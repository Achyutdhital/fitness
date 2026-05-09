from rest_framework import serializers
from .models import Workout, Exercise, WorkoutCategory, MealPlan, Meal, UserWorkoutProgress


class WorkoutCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutCategory
        fields = ['id', 'name', 'description', 'icon', 'color_code']


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = [
            'id', 'name', 'description', 'reps', 'sets', 'duration_seconds',
            'rest_seconds', 'instructions', 'video_url', 'image', 'order'
        ]


class WorkoutSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    exercises = ExerciseSerializer(many=True, read_only=True)

    class Meta:
        model = Workout
        fields = [
            'id', 'title', 'description', 'category', 'category_name', 'difficulty_level',
            'duration_minutes', 'exercise_count', 'instructions', 'video_url', 'thumbnail',
            'calories_burnt', 'equipment_needed', 'muscle_groups', 'rating', 'total_reviews',
            'is_featured', 'exercises', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'rating', 'total_reviews']


class WorkoutDetailSerializer(WorkoutSerializer):
    class Meta(WorkoutSerializer.Meta):
        fields = WorkoutSerializer.Meta.fields + ['required_subscription_plans', 'is_active', 'created_by', 'updated_at']


class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = [
            'id', 'day', 'meal_type', 'name', 'description', 'ingredients',
            'recipe', 'calories', 'protein', 'carbs', 'fats', 'image',
            'preparation_time_minutes'
        ]


class MealPlanSerializer(serializers.ModelSerializer):
    meals = MealSerializer(many=True, read_only=True)

    class Meta:
        model = MealPlan
        fields = [
            'id', 'title', 'description', 'difficulty_level', 'calories_per_day',
            'protein_grams', 'carbs_grams', 'fats_grams', 'duration_days',
            'dietary_type', 'meals_per_day', 'thumbnail', 'meals', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class MealPlanDetailSerializer(MealPlanSerializer):
    class Meta(MealPlanSerializer.Meta):
        fields = MealPlanSerializer.Meta.fields + ['required_subscription_plans', 'is_active', 'created_by', 'updated_at']


class UserWorkoutProgressSerializer(serializers.ModelSerializer):
    workout_title = serializers.CharField(source='workout.title', read_only=True)

    class Meta:
        model = UserWorkoutProgress
        fields = [
            'id', 'user', 'workout', 'workout_title', 'completed', 'completed_date',
            'calories_burnt', 'duration_minutes', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
