from django.db import models
import uuid

class SubscriptionTier(models.Model):
    """Tier definitions: Free, Basic, Pro, Elite"""
    TIER_CHOICES = [
        ('free', 'Free'),
        ('pro', 'Pro'),
        ('elite', 'Elite'),
        ('custom', 'Custom'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, choices=TIER_CHOICES, unique=True)
    description = models.TextField()
    features = models.JSONField(default=list)
    sessions_per_week = models.IntegerField(default=0, help_text="1-on-1 sessions per week")
    video_sessions_per_month = models.IntegerField(default=0, help_text="Video coaching sessions included per month")
    priority = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.get_name_display()

class SubscriptionPlan(models.Model):
    """Specific pricing for a tier (e.g. Pro Monthly, Pro Yearly)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tier = models.ForeignKey(SubscriptionTier, on_delete=models.CASCADE, related_name='plans', null=True, blank=True)
    name = models.CharField(max_length=100) # e.g. "Pro Monthly"
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
    duration_days = models.IntegerField(default=30)
    stripe_price_id = models.CharField(max_length=255, null=True, blank=True)
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
