from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

# Admin dynamic dashboard (custom admin views)
from core.admin_dashboard import FitnessAdminDashboardView

urlpatterns = [
    path('admin/dashboard/', FitnessAdminDashboardView.as_view(), name='fitness-admin-dashboard'),
    path('admin/', admin.site.urls),

    path('api/auth/', include('accounts.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('api/workouts/', include('workouts.urls')),
    path('api/payments/', include('payments.urls')),
    path('api/cms/', include('cms.urls')),
    path('api/core/', include('core.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

