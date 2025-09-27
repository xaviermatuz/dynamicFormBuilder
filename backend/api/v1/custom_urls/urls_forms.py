from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers
from ..views import FormDefinitionViewSet, FormSubmissionViewSet

# Flat router
router = DefaultRouter()
router.register(r'forms', FormDefinitionViewSet, basename='form')
router.register(r'submissions', FormSubmissionViewSet, basename='form-submission')

# Nested router
forms_router = routers.NestedSimpleRouter(router, r'forms', lookup='form')
forms_router.register(r'submissions', FormSubmissionViewSet, basename='form-submissions-nested')

urlpatterns = [
    path("", include(router.urls)),
    path("", include(forms_router.urls)),
]
