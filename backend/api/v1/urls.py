from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from .views import (
    dashboard, RegisterView, 
    FormDefinitionViewSet, FormSubmissionViewSet,
    UserViewSet, LogEntryViewSet,
)

# --- DRF Flat Router ---
router = DefaultRouter()
router.register(r'forms', FormDefinitionViewSet, basename='form')
router.register(r'submissions', FormSubmissionViewSet, basename='form-submission')
router.register(r'users', UserViewSet, basename='user')
router.register(r"logs", LogEntryViewSet, basename="log")

# --- Nested Router for submissions under a specific form ---
forms_router = routers.NestedSimpleRouter(router, r'forms', lookup='form')
forms_router.register(r'submissions', FormSubmissionViewSet, basename='form-submissions-nested')

urlpatterns = [
    # Dashboard route
    path("dashboard/", dashboard, name="dashboard"),

    # Auth routes under /api/v1/auth/ for consistency
    path("auth/register/", RegisterView.as_view(), name="register"),

    # Include DRF flat and nested routers
    path("", include(router.urls)),           # Flat endpoints
    path("", include(forms_router.urls)),     # Nested endpoints
]
