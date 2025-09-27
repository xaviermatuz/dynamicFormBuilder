from django.urls import path
from ..views import SelfChangePasswordView, SelfRegisterView, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    # Registration (public)
    path("register/", SelfRegisterView.as_view(), name="register"),
    
    # Login (JWT) → your /auth/token
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Self-service password change (authenticated)
    path("change-password/", SelfChangePasswordView.as_view(), name="change-password"),
]
