from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid

class WorkoutCategory(models.Model):
    """Categories for workouts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.ImageField(upload_to='workout_icons/', null=True, blank=True)
    color_code = models.CharField(max_length=7, default='#FF6B6B')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = "Workout Categories"

    def __str__(self):
        return self.name


class Workout(models.Model):
    """Individual workout programs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(WorkoutCategory, on_delete=models.SET_NULL, null=True, related_name='workouts')
    difficulty_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
        ]
    )
    duration_minutes = models.IntegerField(validators=[MinValueValidator(1)])
    exercise_count = models.IntegerField(default=0)
    instructions = models.TextField()
    video_url = models.URLField(blank=True, null=True)
    thumbnail = models.ImageField(upload_to='workout_thumbnails/', null=True, blank=True)
    calories_burnt = models.IntegerField(null=True, blank=True)
    equipment_needed = models.JSONField(default=list, blank=True)
    muscle_groups = models.JSONField(default=list, blank=True)
    required_subscription_plans = models.ManyToManyField('subscriptions.SubscriptionPlan', blank=True)
    rating = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(5)])
    total_reviews = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, related_name='created_workouts')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Exercise(models.Model):
    """Individual exercises within a workout"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=255)
    description = models.TextField()
    reps = models.IntegerField(null=True, blank=True)
    sets = models.IntegerField(default=1)
    duration_seconds = models.IntegerField(null=True, blank=True)
    rest_seconds = models.IntegerField(default=60)
    instructions = models.TextField()
    video_url = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to='exercise_images/', null=True, blank=True)
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.workout.title} - {self.name}"


class MealPlan(models.Model):
    """Nutrition/meal plans"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    difficulty_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
        ]
    )
    calories_per_day = models.IntegerField()
    protein_grams = models.FloatField()
    carbs_grams = models.FloatField()
    fats_grams = models.FloatField()
    duration_days = models.IntegerField(default=7)
    dietary_type = models.CharField(
        max_length=50,
        choices=[
            ('regular', 'Regular'),
            ('vegetarian', 'Vegetarian'),
            ('vegan', 'Vegan'),
            ('keto', 'Keto'),
            ('paleo', 'Paleo'),
            ('gluten_free', 'Gluten Free'),
        ]
    )
    meals_per_day = models.IntegerField(default=3)
    required_subscription_plans = models.ManyToManyField('subscriptions.SubscriptionPlan', blank=True)
    thumbnail = models.ImageField(upload_to='meal_plan_thumbnails/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, related_name='created_meal_plans')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class Meal(models.Model):
    """Individual meals in a plan"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meal_plan = models.ForeignKey(MealPlan, on_delete=models.CASCADE, related_name='meals')
    day = models.IntegerField(validators=[MinValueValidator(1)])
    meal_type = models.CharField(
        max_length=20,
        choices=[
            ('breakfast', 'Breakfast'),
            ('lunch', 'Lunch'),
            ('dinner', 'Dinner'),
            ('snack', 'Snack'),
        ]
    )
    name = models.CharField(max_length=255)
    description = models.TextField()
    ingredients = models.JSONField(default=list)
    recipe = models.TextField()
    calories = models.IntegerField()
    protein = models.FloatField()
    carbs = models.FloatField()
    fats = models.FloatField()
    image = models.ImageField(upload_to='meal_images/', null=True, blank=True)
    preparation_time_minutes = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['day', 'meal_type']

    def __str__(self):
        return f"{self.meal_plan.title} - Day {self.day} {self.meal_type}"


class WorkoutProgram(models.Model):
    """Overall training programs (e.g., 90-Day Transformation)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to='program_thumbnails/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class WorkoutPhase(models.Model):
    """Stages within a program (e.g., Phase 1: Foundation)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(WorkoutProgram, on_delete=models.CASCADE, related_name='phases')
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=1)
    duration_weeks = models.PositiveIntegerField(default=4)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.program.name} - {self.name}"

class ScheduledWorkout(models.Model):
    """Link a workout to a specific day in a phase"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phase = models.ForeignKey(WorkoutPhase, on_delete=models.CASCADE, related_name='scheduled_workouts')
    workout = models.ForeignKey('Workout', on_delete=models.CASCADE)
    day_number = models.PositiveIntegerField(help_text="Which day of the phase this workout occurs on (1-28 for a 4-week phase)")

    class Meta:
        ordering = ['day_number']
        unique_together = ['phase', 'day_number']

    def __str__(self):
        return f"{self.phase.name} - Day {self.day_number}: {self.workout.title}"

class UserProgram(models.Model):
    """Track user's current program progress"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField('accounts.CustomUser', on_delete=models.CASCADE, related_name='current_program')
    program = models.ForeignKey(WorkoutProgram, on_delete=models.SET_NULL, null=True)
    start_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} - {self.program.name if self.program else 'No Program'}"

class UserWorkoutProgress(models.Model):
    """Track user progress on workouts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='workout_progress')
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='user_progress')
    completed = models.BooleanField(default=False)
    status = models.CharField(
        max_length=20,
        choices=[
            ('not_started', 'Not Started'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed'),
            ('paused', 'Paused'),
        ],
        default='not_started'
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    calories_burnt = models.IntegerField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'workout']

    def __str__(self):
        return f"{self.user.username} - {self.workout.title}"

class WorkoutSet(models.Model):
    """Granular performance tracking for each set in a workout"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    progress = models.ForeignKey(UserWorkoutProgress, on_delete=models.CASCADE, related_name='sets')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    set_number = models.PositiveIntegerField()
    weight = models.FloatField(null=True, blank=True, help_text="Weight used in lbs/kg")
    reps = models.PositiveIntegerField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['progress', 'exercise', 'set_number']

    def __str__(self):
        return f"{self.progress.user.username} - {self.exercise.name} - Set {self.set_number}"
