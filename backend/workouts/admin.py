from django.contrib import admin
from .models import WorkoutCategory, Workout, Exercise, MealPlan, Meal, UserWorkoutProgress


@admin.register(WorkoutCategory)
class WorkoutCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']


class ExerciseInline(admin.TabularInline):
    model = Exercise
    extra = 1
    fields = ['name', 'sets', 'reps', 'duration_seconds', 'rest_seconds', 'order']


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'difficulty_level', 'duration_minutes', 'is_featured', 'is_active', 'rating']
    list_filter = ['difficulty_level', 'category', 'is_active', 'is_featured']
    search_fields = ['title', 'description']
    inlines = [ExerciseInline]
    readonly_fields = ['created_at', 'updated_at', 'rating', 'total_reviews']
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'description', 'category', 'difficulty_level')
        }),
        ('Details', {
            'fields': (
                'duration_minutes', 'exercise_count', 'instructions', 'video_url',
                'thumbnail', 'calories_burnt', 'equipment_needed', 'muscle_groups'
            )
        }),
        ('Rating & Status', {
            'fields': ('rating', 'total_reviews', 'is_featured', 'is_active', 'required_subscription_plans')
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ['name', 'workout', 'sets', 'reps', 'order']
    list_filter = ['workout', 'workout__category']
    search_fields = ['name', 'workout__title']
    ordering = ['workout', 'order']


class MealInline(admin.TabularInline):
    model = Meal
    extra = 1
    fields = ['day', 'meal_type', 'name', 'calories', 'preparation_time_minutes']


@admin.register(MealPlan)
class MealPlanAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty_level', 'dietary_type', 'duration_days', 'is_active']
    list_filter = ['difficulty_level', 'dietary_type', 'is_active']
    search_fields = ['title', 'description']
    inlines = [MealInline]
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'description', 'difficulty_level', 'dietary_type')
        }),
        ('Nutrition Details', {
            'fields': (
                'calories_per_day', 'protein_grams', 'carbs_grams', 'fats_grams',
                'meals_per_day', 'duration_days'
            )
        }),
        ('Media & Status', {
            'fields': ('thumbnail', 'is_active', 'required_subscription_plans')
        }),
        ('Meta', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ['name', 'meal_plan', 'day', 'meal_type', 'calories']
    list_filter = ['meal_plan', 'meal_type', 'day']
    search_fields = ['name', 'meal_plan__title']
    readonly_fields = ['created_at']


@admin.register(UserWorkoutProgress)
class UserWorkoutProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'workout', 'completed', 'completed_date', 'calories_burnt']
    list_filter = ['completed', 'completed_date']
    search_fields = ['user__username', 'workout__title']
    readonly_fields = ['created_at', 'updated_at']
