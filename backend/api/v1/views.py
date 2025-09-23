from rest_framework import generics, status, viewsets, permissions
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
# Models
from .models import FormDefinition, FormSubmission
# Custom Permissions
from .permissions import RoleBasedFormPermission, RoleBasedSubmissionPermission
# Serializers
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, FormDefinitionSerializer, FormSubmissionSerializer


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
@permission_classes([AllowAny])
def dashboard(request):
    return Response({"message": "Hello, authenticated user!"})

class FormDefinitionViewSet(viewsets.ModelViewSet):
    queryset = FormDefinition.objects.all().order_by("-created_at")
    serializer_class = FormDefinitionSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedFormPermission]
    pagination_class = StandardResultsSetPagination

    def create(self, request, *args, **kwargs):
        data = request.data
        many = isinstance(data, list)

        serializer = self.get_serializer(data=data, many=many)
        serializer.is_valid(raise_exception=True)

        # Save with created_by
        if many:
            serializer.save(created_by=self.request.user)
        else:
            serializer.save(created_by=self.request.user)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class FormSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = FormSubmissionSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedSubmissionPermission]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        form_pk = self.kwargs.get("form_pk")
        if form_pk:
            return FormSubmission.objects.filter(form_id=form_pk).order_by("-submitted_at")
        return FormSubmission.objects.all().order_by("-submitted_at")

    def create(self, request, *args, **kwargs):
        data = request.data
        many = isinstance(data, list)

        serializer = self.get_serializer(data=data, many=many)
        serializer.is_valid(raise_exception=True)

        form_pk = self.kwargs.get("form_pk")

        if many:
            serializer.save(
                form_id=form_pk if form_pk else None,
                submitted_by=self.request.user
            )
        else:
            serializer.save(
                form_id=form_pk if form_pk else None,
                submitted_by=self.request.user
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        form_pk = self.kwargs.get("form_pk")
        if form_pk:
            serializer.save(
                form_id=form_pk,
                submitted_by=self.request.user
            )
        else:
            serializer.save(
                submitted_by=self.request.user
            )