from django.db import models
import uuid

class SubscriptionPlan(models.Model):
    """Different subscription tiers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    billing_cycle = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('quarterly', 'Quarterly'),
            ('yearly', 'Yearly'),
        ],
        default='monthly'
    )
    stripe_product_id = models.CharField(max_length=255, null=True, blank=True)
    stripe_price_id = models.CharField(max_length=255, null=True, blank=True)
    duration_days = models.IntegerField(default=30)
    features = models.JSONField(default=list, help_text="List of features included in this plan")
    max_workouts_per_week = models.IntegerField(default=5)
    include_meal_plans = models.BooleanField(default=False)
    include_personal_trainer = models.BooleanField(default=False)
    include_nutrition_consultation = models.BooleanField(default=False)
    include_community_access = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    priority = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['priority', 'price']

    def __str__(self):
        return f"{self.name} - ${self.price}/{self.billing_cycle}"


class Feature(models.Model):
    """Features available for plans"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField()
    icon = models.ImageField(upload_to='feature_icons/', null=True, blank=True)
    category = models.CharField(
        max_length=50,
        choices=[
            ('workouts', 'Workouts'),
            ('nutrition', 'Nutrition'),
            ('tracking', 'Tracking'),
            ('community', 'Community'),
            ('support', 'Support'),
            ('other', 'Other'),
        ]
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return self.name
