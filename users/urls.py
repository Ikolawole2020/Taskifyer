from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    MeView,
    MyProviderProfileView,
    ProviderProfileViewSet,
    CustomerProfileViewSet,
    NotificationViewSet,
    PortfolioImageViewSet,
    VerifyEmailView,
    CustomTokenObtainPairView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
)

router = DefaultRouter()
router.register(r'providers', ProviderProfileViewSet, basename='providers')
router.register(r'customers', CustomerProfileViewSet, basename='customers')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'portfolio', PortfolioImageViewSet, basename='portfolio')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('me/', MeView.as_view(), name='me'),
    path('me/provider/', MyProviderProfileView.as_view(), name='my-provider-profile'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('', include(router.urls)),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]