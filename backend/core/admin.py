from django.contrib import admin
from .models import (
    WorkoutFavorite, MealPlanFavorite, WorkoutReview,
    BodyMeasurement, Achievement, UserAchievement, UserPoints,
    Challenge, ChallengeParticipation, Notification,
    Coupon, Referral, SupportTicket,
    EmailAutomationLog,
)

from .feature_flags import FeatureFlag
from .analytics_models import (
    ChurnPrediction, EngagementScore, LifetimeValue,
    CohortAnalysis, RetentionMetrics, CustomerAcquisitionCost
)

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['icon', 'name', 'points', 'requirement_type', 'requirement_value', 'is_active']
    list_filter = ['requirement_type', 'is_active']
    search_fields = ['name']


@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ['user', 'achievement', 'earned_at']
    list_filter = ['achievement']
    search_fields = ['user__username']


@admin.register(UserPoints)
class UserPointsAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_points', 'level', 'streak_days', 'longest_streak']
    ordering = ['-total_points']
    search_fields = ['user__username']


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display = ['icon', 'title', 'goal_type', 'goal_value', 'reward_points', 'start_date', 'end_date', 'is_active']
    list_filter = ['goal_type', 'is_active']
    search_fields = ['title']


@admin.register(ChallengeParticipation)
class ChallengeParticipationAdmin(admin.ModelAdmin):
    list_display = ['user', 'challenge', 'progress', 'completed', 'joined_at']
    list_filter = ['completed', 'challenge']


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'times_used', 'max_uses', 'valid_until', 'is_active']
    list_filter = ['discount_type', 'is_active']
    search_fields = ['code']


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ['referrer', 'referral_code', 'referred', 'status', 'reward_points', 'created_at']
    list_filter = ['status']
    search_fields = ['referrer__username', 'referral_code']


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['subject', 'name', 'email', 'category', 'status', 'priority', 'triaged_at', 'created_at']
    list_filter = ['category', 'status', 'priority']
    search_fields = ['subject', 'name', 'email', 'message', 'admin_notes']
    readonly_fields = ['triaged_at', 'created_at', 'updated_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['user__username', 'title']


@admin.register(EmailAutomationLog)
class EmailAutomationLogAdmin(admin.ModelAdmin):
    list_display = ['automation_key', 'recipient_email', 'reference_date', 'created_at']
    list_filter = ['automation_key', 'reference_date']
    search_fields = ['recipient_email', 'recipient_name', 'automation_key']


@admin.register(BodyMeasurement)
class BodyMeasurementAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'weight', 'body_fat_percentage', 'waist']
    list_filter = ['date']
    search_fields = ['user__username']


@admin.register(WorkoutReview)
class WorkoutReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'workout', 'rating', 'created_at']
    list_filter = ['rating']
    search_fields = ['user__username', 'workout__title']


admin.site.register(WorkoutFavorite)
admin.site.register(MealPlanFavorite)


# ============================================================================
# Phase 9: Feature Flags and Analytics Admin
# ============================================================================

@admin.register(FeatureFlag)
class FeatureFlagAdmin(admin.ModelAdmin):
    list_display = ['key', 'name', 'type', 'is_active', 'percentage_rollout', 'created_at']
    list_filter = ['type', 'is_active']
    search_fields = ['key', 'name']
    ordering = ['-created_at']


@admin.register(ChurnPrediction)
class ChurnPredictionAdmin(admin.ModelAdmin):
    list_display = ['user', 'churn_risk_score', 'is_at_risk', 'days_inactive']
    list_filter = ['is_at_risk']
    search_fields = ['user__username']
    ordering = ['-churn_risk_score']


@admin.register(EngagementScore)
class EngagementScoreAdmin(admin.ModelAdmin):
    list_display = ['user', 'score', 'workouts_week', 'score_trend']
    list_filter = ['score_trend']
    search_fields = ['user__username']
    ordering = ['-score']


@admin.register(LifetimeValue)
class LifetimeValueAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_revenue', 'average_revenue_per_month', 'predicted_ltv']
    search_fields = ['user__username']
    ordering = ['-predicted_ltv']


@admin.register(CohortAnalysis)
class CohortAnalysisAdmin(admin.ModelAdmin):
    list_display = ['cohort_month', 'cohort_size', 'month_0_active', 'avg_ltv', 'total_revenue']
    list_filter = ['cohort_month']
    ordering = ['-cohort_month']


@admin.register(RetentionMetrics)
class RetentionMetricsAdmin(admin.ModelAdmin):
    list_display = ['date', 'active_users', 'day_1_retention', 'day_7_retention', 'day_30_retention']
    list_filter = ['date']
    ordering = ['-date']


@admin.register(CustomerAcquisitionCost)
class CustomerAcquisitionCostAdmin(admin.ModelAdmin):
    list_display = ['month', 'new_customers', 'total_marketing_spend', 'cac_per_customer']
    list_filter = ['month']
    ordering = ['-month']
