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
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')],
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
    weight = models.FloatField(null=True, blank=True, help_text="Weight in kg")
    height = models.FloatField(null=True, blank=True, help_text="Height in cm")
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
