from django.contrib.auth.models import User
from django_filters.rest_framework import DjangoFilterBackend

from rest_framework import generics, status, viewsets, filters
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser

# Models
from .models import FormDefinition, FormSubmission

#Services
from .services import FormDefinitionService, FormSubmissionService, UserService, AuditLogService, LogEntryService, DashboardService

# Custom Permissions
from .permissions import (
    RoleBasedFormPermission,
    RoleBasedSubmissionPermission,
    RoleBasedUserPermission,
)

# Serializers
from .serializers import (
    AdminRegisterSerializer,
    CustomTokenObtainPairSerializer,
    FormDefinitionSerializer,
    FormSubmissionSerializer,
    LogEntrySerializer,
    PasswordChangeSerializer,
    AuditLogSerializer,
    SelfRegisterSerializer,
)

from .mixins import BulkCreateMixin

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100

class FormDefinitionViewSet(BulkCreateMixin, viewsets.ModelViewSet):
    serializer_class = FormDefinitionSerializer
    permission_classes = [IsAuthenticated, RoleBasedFormPermission]
    pagination_class = StandardResultsSetPagination

    user_field = "created_by"

    def get_queryset(self):
        queryset = FormDefinition.objects.all().order_by("-created_at")
        queryset = FormDefinitionService.filter_by_state(queryset, self.request.user, self.request.query_params)
        queryset = FormDefinitionService.filter_latest_only(queryset, self.request.query_params.get("latest_only", "true"))
        return queryset
    
    def update(self, request, *args, **kwargs):
        # Leave versioning/business rules in FormDefinitionSerializer (already refactored with FormService)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.groups.filter(name="Admin").exists():
            return super().destroy(request, *args, **kwargs)
        return Response({"detail": "Use PATCH for soft delete."}, status=status.HTTP_403_FORBIDDEN)

class FormSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = FormSubmissionSerializer
    permission_classes = [IsAuthenticated, RoleBasedSubmissionPermission]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        form_pk = self.kwargs.get("form_pk")
        queryset = FormSubmission.objects.all().order_by("-submitted_at")
        if form_pk:
            queryset = queryset.filter(form_id=form_pk)
        form_version = self.request.query_params.get("form_version")
        if form_version:
            queryset = queryset.filter(form_version=form_version)
        return queryset

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        form_pk = self.kwargs.get("form_pk")
        if form_pk:
            data["form"] = form_pk
        many = isinstance(data, list)
        serializer = self.get_serializer(data=data, many=many)
        serializer.is_valid(raise_exception=True)

        if many:
            for item in serializer.validated_data:
                FormSubmissionService.check_latest_version(item["form"])
        else:
            FormSubmissionService.check_latest_version(serializer.validated_data["form"])

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        form_pk = self.kwargs.get("form_pk")
        form = FormDefinition.objects.get(pk=form_pk) if form_pk else serializer.validated_data["form"]
        serializer.save(form=form, form_version=form.version, submitted_by=self.request.user)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    permission_classes = [IsAuthenticated, RoleBasedUserPermission]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["is_active"]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["id", "username", "email", "last_login"]
    ordering = ["id"]

    def get_serializer_class(self):
        from .serializers import AdminRegisterSerializer, UserUpdateSerializer, UserWithRoleSerializer
        if self.action == "create":
            return AdminRegisterSerializer
        elif self.action in ["update", "partial_update"]:
            return UserUpdateSerializer
        return UserWithRoleSerializer

    @action(detail=True, methods=["post"], url_path="set-password")
    def set_password(self, request, pk=None):
        user = self.get_object()
        serializer = PasswordChangeSerializer(data=request.data, context={"user": user})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="change_password")
    def change_password(self, request):
        result = UserService.change_password(request.user, request.data)
        return Response(result, status=status.HTTP_200_OK)

class DashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(DashboardService.get_metrics())

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint to view user activity logs (audit logs).
    Only Admins can access this.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]

    # Move queryset logic into service
    def get_queryset(self):
        return AuditLogService.get_queryset(self.request.query_params)

class LogEntryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint to view log entries.
    Only Admins can access this.
    """
    serializer_class = LogEntrySerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return LogEntryService.get_queryset()
    
class SelfRegisterView(generics.CreateAPIView):
    
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = SelfRegisterSerializer

class SelfChangePasswordView(APIView):
    """
    Allow the authenticated user to change their own password.
    Uses UserService to handle logic.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        result = UserService.change_password(request.user, request.data)
        return Response(result, status=status.HTTP_200_OK)

class AdminRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, RoleBasedUserPermission]
    serializer_class = AdminRegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
