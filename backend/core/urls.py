from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import (
    FavoritesViewSet, ReviewViewSet, BodyMeasurementViewSet,
    GamificationViewSet, ChallengeViewSet, NotificationViewSet,
    CouponViewSet, ReferralViewSet, SupportTicketViewSet,
    AdUnlockViewSet, CoachViewSet, ReminderViewSet, AICoachViewSet,
)

router = DefaultRouter()
router.register(r'favorites', FavoritesViewSet, basename='favorites')
router.register(r'reviews', ReviewViewSet, basename='reviews')
router.register(r'measurements', BodyMeasurementViewSet, basename='measurements')
router.register(r'gamification', GamificationViewSet, basename='gamification')
router.register(r'achievements', GamificationViewSet, basename='achievements')
router.register(r'challenges', ChallengeViewSet, basename='challenges')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'coupons', CouponViewSet, basename='coupons')
router.register(r'referrals', ReferralViewSet, basename='referrals')
router.register(r'support', SupportTicketViewSet, basename='support')
router.register(r'ads', AdUnlockViewSet, basename='ads')
router.register(r'coach', CoachViewSet, basename='coach')
router.register(r'reminders', ReminderViewSet, basename='reminders')
router.register(r'ai', AICoachViewSet, basename='ai')
from .views import CoachSessionViewSet
router.register(r'sessions', CoachSessionViewSet, basename='sessions')

urlpatterns = router.urls
