from rest_framework import serializers
from .models import (
    WorkoutFavorite, MealPlanFavorite, WorkoutReview,
    BodyMeasurement, Achievement, UserAchievement, UserPoints,
    Challenge, ChallengeParticipation, Notification,
    Coupon, Referral, SupportTicket,
    AdViewLog, ItemUnlock, CustomizedWorkout, CustomizedMealPlan, CoachSession
)

class WorkoutFavoriteSerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source='workout.title', read_only=True)
    workout_thumbnail = serializers.ImageField(source='workout.thumbnail', read_only=True)
    workout_difficulty = serializers.CharField(source='workout.difficulty_level', read_only=True)
    workout_duration = serializers.IntegerField(source='workout.duration_minutes', read_only=True)

    class Meta:
        model = WorkoutFavorite
        fields = ['id', 'workout', 'workout_title', 'workout_thumbnail', 'workout_difficulty', 'workout_duration', 'created_at']
        read_only_fields = ['id', 'created_at']

class MealPlanFavoriteSerializer(serializers.ModelSerializer):
    meal_plan_title = serializers.CharField(source='meal_plan.title', read_only=True)

    class Meta:
        model = MealPlanFavorite
        fields = ['id', 'meal_plan', 'meal_plan_title', 'created_at']
        read_only_fields = ['id', 'created_at']

class WorkoutReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    workout_title = serializers.CharField(source='workout.title', read_only=True)

    class Meta:
        model = WorkoutReview
        fields = ['id', 'user', 'username', 'workout', 'workout_title', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

class BodyMeasurementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BodyMeasurement
        fields = [
            'id', 'date', 'weight', 'body_fat_percentage', 'muscle_mass',
            'chest', 'waist', 'hips', 'arms', 'thighs', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon', 'points', 'requirement_type', 'requirement_value']

class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ['id', 'achievement', 'earned_at']

class UserPointsSerializer(serializers.ModelSerializer):
    level_name = serializers.SerializerMethodField()
    points_to_next_level = serializers.SerializerMethodField()

    class Meta:
        model = UserPoints
        fields = ['total_points', 'level', 'level_name', 'points_to_next_level', 'streak_days', 'longest_streak', 'last_workout_date']

    def get_level_name(self, obj):
        return obj.get_level_name()

    def get_points_to_next_level(self, obj):
        return obj.points_to_next_level()

class ChallengeSerializer(serializers.ModelSerializer):
    participant_count = serializers.SerializerMethodField()
    user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = ['id', 'title', 'description', 'icon', 'goal_type', 'goal_value', 'reward_points', 'start_date', 'end_date', 'participant_count', 'user_progress']

    def get_participant_count(self, obj):
        return obj.participants.count()

    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            p = ChallengeParticipation.objects.filter(user=request.user, challenge=obj).first()
            if p:
                return {'progress': p.progress, 'completed': p.completed, 'joined': True}
        return {'joined': False}

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'notification_type', 'is_read', 'action_url', 'icon', 'created_at']
        read_only_fields = ['id', 'created_at']

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'description', 'discount_type', 'discount_value', 'valid_until', 'min_purchase_amount']

class ReferralSerializer(serializers.ModelSerializer):
    referral_link = serializers.SerializerMethodField()
    referred_count = serializers.SerializerMethodField()

    class Meta:
        model = Referral
        fields = ['id', 'referral_code', 'referral_link', 'status', 'reward_points', 'referred_count', 'created_at']

    def get_referral_link(self, obj):
        return f"https://fitcoachpro.com/register?ref={obj.referral_code}"

    def get_referred_count(self, obj):
        return Referral.objects.filter(referrer=obj.referrer, status__in=['completed', 'rewarded']).count()

class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ['id', 'name', 'email', 'subject', 'message', 'status', 'priority', 'created_at']
        read_only_fields = ['id', 'status', 'priority', 'created_at']

class AdViewLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdViewLog
        fields = '__all__'

class ItemUnlockSerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source='workout.title', read_only=True)
    meal_plan_title = serializers.CharField(source='meal_plan.title', read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = ItemUnlock
        fields = ['id', 'workout', 'workout_title', 'meal_plan', 'meal_plan_title', 'unlocked_at', 'expires_at', 'is_active']

class CustomizedWorkoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizedWorkout
        fields = '__all__'

class CustomizedMealPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizedMealPlan
        fields = '__all__'

class CoachSessionSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.get_full_name', read_only=True)
    coach_name = serializers.CharField(source='coach.get_full_name', read_only=True)

    class Meta:
        model = CoachSession
        fields = '__all__'
