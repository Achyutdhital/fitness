from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import URLValidator
import uuid

class CustomUser(AbstractUser):
    """Extended user model with additional fitness-related fields"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)
    bio = models.TextField(blank=True, null=True)
    age = models.IntegerField(null=True, blank=True)
    gender = models.CharField(
        max_length=10,
        choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')],
        null=True,
        blank=True
    )
    fitness_level = models.CharField(
        max_length=20,
        choices=[
            ('beginner', 'Beginner'),
            ('intermediate', 'Intermediate'),
            ('advanced', 'Advanced'),
        ],
        default='beginner'
    )
    # Weight in lbs
    weight = models.FloatField(null=True, blank=True, help_text="Weight in lbs")
    # Height in US format
    height_ft = models.IntegerField(null=True, blank=True, help_text="Height feet")
    height_in = models.IntegerField(null=True, blank=True, help_text="Height inches")
    # Onboarding fields
    fitness_goal = models.CharField(
        max_length=50,
        choices=[
            ('lose_weight', 'Lose Weight'),
            ('gain_muscle', 'Gain Muscle'),
            ('maintain', 'Maintain'),
            ('improve_health', 'Improve Health'),
        ],
        null=True,
        blank=True
    )
    activity_level = models.CharField(
        max_length=50,
        choices=[
            ('sedentary', 'Sedentary'),
            ('lightly_active', 'Lightly Active'),
            ('moderately_active', 'Moderately Active'),
            ('very_active', 'Very Active'),
        ],
        null=True,
        blank=True
    )
    dietary_preference = models.CharField(
        max_length=50,
        choices=[
            ('omnivore', 'Omnivore'),
            ('vegetarian', 'Vegetarian'),
            ('vegan', 'Vegan'),
            ('keto', 'Keto'),
            ('no_preference', 'No Preference'),
        ],
        null=True,
        blank=True
    )
    # Body metrics
    body_fat_percentage = models.FloatField(null=True, blank=True, help_text="Estimated body fat %")
    bmi = models.FloatField(null=True, blank=True, help_text="Body Mass Index")
    muscle_mass_kg = models.FloatField(null=True, blank=True, help_text="Estimated muscle mass in kg")
    bmr = models.IntegerField(null=True, blank=True, help_text="Basal Metabolic Rate in calories")
    tdee = models.IntegerField(null=True, blank=True, help_text="Total Daily Energy Expenditure in calories")
    preferred_units = models.CharField(
        max_length=20,
        choices=[('metric', 'Metric'), ('imperial', 'Imperial')],
        default='imperial'
    )
    
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('coach', 'Coach'),
        ('admin', 'Admin'),
        ('content_writer', 'Content Writer'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    assigned_coach = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='clients'
    )
    last_ad_view = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.username

    def _calculate_body_metrics(self):
        """Calculate BMI, body fat percentage, muscle mass estimate, BMR, and TDEE."""
        if not all([self.height_ft, self.height_in, self.weight, self.age, self.gender]):
            return

        # Convert height to total inches
        height_inches = (self.height_ft * 12) + self.height_in
        weight_lbs = self.weight

        # Calculate BMI
        bmi = (weight_lbs / (height_inches * height_inches)) * 703
        self.bmi = round(bmi, 1)

        # Estimate body fat % using Katch-McArdle formula (simplified)
        if self.gender == 'male':
            body_fat = (1.20 * bmi) + (0.23 * self.age) - 16.2
        else:  # female
            body_fat = (1.20 * bmi) + (0.23 * self.age) - 5.4

        self.body_fat_percentage = max(0, round(body_fat, 1))

        # Calculate BMR using Mifflin-St Jeor equation
        # Convert lbs to kg and inches to cm
        weight_kg = weight_lbs / 2.205
        height_cm = height_inches * 2.54

        if self.gender == 'male':
            bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * self.age)
        else:  # female
            bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * self.age)

        self.bmr = int(round(bmr))

        # Estimated lean body mass ~= muscle-centric mass proxy.
        lean_mass_kg = weight_kg * (1 - (self.body_fat_percentage / 100.0))
        self.muscle_mass_kg = max(0, round(lean_mass_kg * 0.50, 1))

        # Calculate TDEE using activity level multiplier
        activity_multipliers = {
            'sedentary': 1.2,
            'lightly_active': 1.375,
            'moderately_active': 1.55,
            'very_active': 1.725,
        }
        multiplier = activity_multipliers.get(self.activity_level, 1.55)
        self.tdee = int(round(bmr * multiplier))


class UserSubscription(models.Model):
    """Track user subscriptions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='subscription')
    subscription_plan = models.ForeignKey('subscriptions.SubscriptionPlan', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    tier = models.ForeignKey('subscriptions.SubscriptionTier', on_delete=models.SET_NULL, null=True, blank=True, related_name='user_subscriptions')
    stripe_subscription_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('canceled', 'Canceled'),
            ('expired', 'Expired'),
            ('trial', 'Trial'),
        ],
        default='trial'
    )
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.subscription_plan}"


class UserProfile(models.Model):
    """Additional user profile data"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    goals = models.TextField(blank=True, null=True, help_text="Fitness goals")
    dietary_preferences = models.JSONField(default=list, blank=True)
    workout_preferences = models.JSONField(default=list, blank=True)
    injuries = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Profile"
