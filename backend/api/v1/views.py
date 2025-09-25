from django.db import models
from django.db.models import OuterRef, Subquery 
from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import generics, status, viewsets, filters, serializers
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser

# Models
from .models import FormDefinition, FormField, FormSubmission, LogEntry

# Custom Permissions
from .permissions import (
    RoleBasedFormPermission,
    RoleBasedSubmissionPermission,
    RoleBasedUserPermission,
)

# Serializers
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    FormDefinitionSerializer,
    FormSubmissionSerializer,
    LogEntrySerializer,
    PasswordChangeSerializer,
    SelfPasswordChangeSerializer,
)

class LogEntryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LogEntry.objects.all().order_by("-created_at")
    serializer_class = LogEntrySerializer
    permission_classes = [IsAdminUser]  # Only admins can see logs

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    return Response({"message": "Hello, authenticated user!"})

class FormDefinitionViewSet(viewsets.ModelViewSet):
    queryset = FormDefinition.objects.none()
    serializer_class = FormDefinitionSerializer
    permission_classes = [IsAuthenticated, RoleBasedFormPermission]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        queryset = FormDefinition.objects.all().order_by("-created_at")

        # Admins can filter by state
        if user.groups.filter(name="Admin").exists():
            state = self.request.query_params.get("state")  # 'active', 'deleted', 'all'
            if state == "deleted":
                queryset = queryset.filter(is_deleted=True)
            elif state == "active":
                queryset = queryset.filter(is_deleted=False)
            # else: return all

        else:
            # Non-admins only see active
            queryset = queryset.filter(is_deleted=False)

        latest_only = self.request.query_params.get("latest_only", "true")
        if latest_only in ("true", "1"):
            # Keep only the latest version of each form by name
            latest_ids = FormDefinition.objects.filter(
                name=OuterRef("name")
            ).order_by("-version").values("id")[:1]

            queryset = queryset.filter(id=Subquery(latest_ids))

        return queryset

    # Fallback
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def create(self, request, *args, **kwargs):
        data = request.data

        # Bulk create
        if isinstance(data, list):
            serializer = self.get_serializer(data=data, many=True)
            serializer.is_valid(raise_exception=True)

            # call serializer.save() → this uses nested create logic properly
            instances = serializer.save(created_by=request.user)

            output_serializer = self.get_serializer(instances, many=True)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)

        # Fallback to single object behavior
        return super().create(request, *args, **kwargs)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        data = request.data.copy()
        fields_data = data.pop("fields", None)

        if fields_data is None:
            # 🔹 Metadata-only update
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        # 🔹 Check if fields actually changed
        existing_fields = list(instance.fields.values(
            "name", "label", "field_type", "required", "order"
        ))

        incoming_fields = [
            {k: field[k] for k in ("name", "label", "field_type", "required", "order") if k in field}
            for field in fields_data
        ]

        if existing_fields == incoming_fields:
            # Fields unchanged → treat as metadata update
            serializer = self.get_serializer(instance, data=data, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        # 🔹 Otherwise → structural change, create a new version
        new_form = FormDefinition.objects.create(
            name=data.get("name", instance.name),
            description=data.get("description", instance.description),
            created_by=instance.created_by,
            is_deleted=data.get("is_deleted", instance.is_deleted),
            version=instance.version + 1,
        )

        for field in fields_data:
            field.pop("id", None)  # avoid duplicate PKs
            FormField.objects.create(form=new_form, **field)

        serializer = self.get_serializer(new_form)
        return Response(
            {
                "detail": f"Form updated by creating new version {new_form.version}.",
                "latest_version_id": new_form.id,
                "latest_version": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )



    def destroy(self, request, *args, **kwargs):
        user = request.user
        instance = self.get_object()

        # Admin → hard delete
        if user.groups.filter(name="Admin").exists():
            return super().destroy(request, *args, **kwargs)

        # Everyone else → forbidden (Editors use PATCH)
        return Response({"detail": "Use PATCH for soft delete."}, status=status.HTTP_403_FORBIDDEN)

class FormSubmissionViewSet(viewsets.ModelViewSet):
    """
    Handles CRUD for form submissions.
    - Always ties a submission to the correct form version.
    - Rejects submissions to outdated form versions.
    """
    queryset = FormSubmission.objects.none()
    serializer_class = FormSubmissionSerializer
    permission_classes = [IsAuthenticated, RoleBasedSubmissionPermission]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        form_pk = self.kwargs.get("form_pk")
        queryset = FormSubmission.objects.all().order_by("-submitted_at")
        if form_pk:
            queryset = queryset.filter(form_id=form_pk)
        # Optional: filter by version via query param
        form_version = self.request.query_params.get("form_version")
        if form_version:
            queryset = queryset.filter(form_version=form_version)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        form_pk = self.kwargs.get("form_pk")

        if form_pk:
            data["form"] = form_pk   # inject form id before validation

        many = isinstance(data, list)
        serializer = self.get_serializer(data=data, many=many)
        serializer.is_valid(raise_exception=True)

        if many:
            for item in serializer.validated_data:
                self._check_latest_version(item["form"])
        else:
            self._check_latest_version(serializer.validated_data["form"])

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """
        Ensure `form_version` is saved correctly.
        """
        form_pk = self.kwargs.get("form_pk")
        form = (
            FormDefinition.objects.get(pk=form_pk)
            if form_pk
            else serializer.validated_data["form"]
        )

        serializer.save(
            form=form,
            form_version=form.version,
            submitted_by=self.request.user,
        )

    def _check_latest_version(self, form: FormDefinition):
        """
        Rejects submissions if the form is not the latest version.
        """
        latest_version = (
            FormDefinition.objects.filter(name=form.name)
            .aggregate(max_version=models.Max("version"))
            .get("max_version", form.version)
        )
        if form.version < latest_version:
            raise serializers.ValidationError(
                {"detail": f"Form '{form.name}' is outdated. Please use version {latest_version}."}
            )

class UserViewSet(viewsets.ModelViewSet):
    """
    Only Admins can manage users (CRUD).
    Editors/Viewers: denied.
    """
    queryset = User.objects.all().order_by("id")
    permission_classes = [IsAuthenticated, RoleBasedUserPermission]
    pagination_class = StandardResultsSetPagination

    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]  # custom filter
    search_fields = ["username", "email", "first_name", "last_name"]  # full search
    ordering_fields = ["id", "username", "email", "last_login"]
    ordering = ["id"]  # default ordering

    def get_serializer_class(self):
        from .serializers import RegisterSerializer, UserUpdateSerializer, UserSerializer
        if self.action == "create":
            return RegisterSerializer
        elif self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=True, methods=["post"], url_path="set-password")
    def set_password(self, request, pk=None):
        user = self.get_object()
        serializer = PasswordChangeSerializer(
            data=request.data, context={"user": user}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get_permissions(self):
        if self.action == "change_password":
            return [IsAuthenticated()]  # only logged-in user can call this
        return [permission() for permission in self.permission_classes]
    
    @action(detail=False, methods=["post"], url_path="change_password")
    def change_password(self, request):
            serializer = SelfPasswordChangeSerializer(
                data=request.data, context={"user": request.user}
            )
            if serializer.is_valid():
                serializer.save()

                # Invalidate old tokens
                refresh_token = request.data.get("refresh")
                if refresh_token:
                    try:
                        token = RefreshToken(refresh_token)
                        token.blacklist()
                    except TokenError:
                        return Response(
                            {"detail": "Password changed but refresh token invalid."},
                            status=status.HTTP_200_OK,
                        )

                return Response(
                    {"detail": "Password changed successfully. Please log in again."},
                    status=status.HTTP_200_OK,
                )

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)