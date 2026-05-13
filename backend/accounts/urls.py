from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, LoginView, UserViewSet,
    PasswordResetRequestView, PasswordResetConfirmView,
    AdminStatsView, AdminUsersViewSet,
    OAuthStartView, OAuthCallbackView,
)

router = DefaultRouter()
router.register(r'user', UserViewSet, basename='user')
router.register(r'admin/users', AdminUsersViewSet, basename='admin-users')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('oauth/<str:provider>/start/', OAuthStartView.as_view(), name='oauth-start'),
    path('oauth/<str:provider>/callback/', OAuthCallbackView.as_view(), name='oauth-callback'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
] + router.urls
