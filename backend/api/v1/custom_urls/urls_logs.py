from django.urls import include, path
from rest_framework.routers import DefaultRouter
from ..views import LogEntryViewSet, AuditLogViewSet

router = DefaultRouter()
# router.register(r'logs', LogEntryViewSet, basename='log')
router.register(r'audit-logs', AuditLogViewSet, basename='auditlog')

urlpatterns = [
    path("", include(router.urls)),
]
