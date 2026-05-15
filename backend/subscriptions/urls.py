from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SubscriptionTierViewSet, SubscriptionPlanViewSet, FeatureViewSet

router = DefaultRouter()
router.register(r'tiers', SubscriptionTierViewSet, basename='tier')
router.register(r'packages', SubscriptionPlanViewSet, basename='package')
router.register(r'features', FeatureViewSet, basename='feature')

urlpatterns = router.urls
