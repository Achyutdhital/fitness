from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SubscriptionPlanViewSet, FeatureViewSet

router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='plan')
router.register(r'features', FeatureViewSet, basename='feature')

urlpatterns = router.urls
