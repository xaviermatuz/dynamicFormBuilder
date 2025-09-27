from django.urls import path, include

urlpatterns = [
    # Auth module
    path("auth/", include("api.v1.custom_urls.urls_auth")),

    # Users module
    path("", include("api.v1.custom_urls.urls_users")),

    # Dashboard module
    path("dashboard/", include("api.v1.custom_urls.urls_dashboard")),

    # Forms module
    path("", include("api.v1.custom_urls.urls_forms")),

    # Logs module
    path("", include("api.v1.custom_urls.urls_logs")),
]
