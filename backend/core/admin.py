from django.contrib import admin
from .models import (
    WorkoutFavorite, MealPlanFavorite, WorkoutReview,
    BodyMeasurement, Achievement, UserAchievement, UserPoints,
    Challenge, ChallengeParticipation, Notification,
    Coupon, Referral, SupportTicket,
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
    list_display = ['subject', 'name', 'email', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority']
    search_fields = ['subject', 'name', 'email']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read']
    search_fields = ['user__username', 'title']


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
