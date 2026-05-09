from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class WorkoutFavorite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='workout_favorites')
    workout = models.ForeignKey('workouts.Workout', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'workout']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} ♥ {self.workout.title}"


class MealPlanFavorite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='meal_favorites')
    meal_plan = models.ForeignKey('workouts.MealPlan', on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'meal_plan']
        ordering = ['-created_at']


class WorkoutReview(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='workout_reviews')
    workout = models.ForeignKey('workouts.Workout', on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'workout']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} rated {self.workout.title} {self.rating}★"


class BodyMeasurement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='measurements')
    date = models.DateField()
    weight = models.FloatField(null=True, blank=True)
    body_fat_percentage = models.FloatField(null=True, blank=True)
    muscle_mass = models.FloatField(null=True, blank=True)
    chest = models.FloatField(null=True, blank=True)
    waist = models.FloatField(null=True, blank=True)
    hips = models.FloatField(null=True, blank=True)
    arms = models.FloatField(null=True, blank=True)
    thighs = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user.username} — {self.date}"


class Achievement(models.Model):
    REQUIREMENT_TYPES = [
        ('workouts_completed', 'Workouts Completed'),
        ('streak_days', 'Streak Days'),
        ('calories_burned', 'Calories Burned'),
        ('minutes_trained', 'Minutes Trained'),
        ('reviews_written', 'Reviews Written'),
        ('first_workout', 'First Workout'),
        ('first_payment', 'First Payment'),
        ('profile_complete', 'Profile Complete'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    icon = models.CharField(max_length=10, default='🏆')
    points = models.IntegerField(default=10)
    requirement_type = models.CharField(max_length=50, choices=REQUIREMENT_TYPES)
    requirement_value = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['requirement_value']

    def __str__(self):
        return f"{self.icon} {self.name}"


class UserAchievement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='earned_by')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'achievement']
        ordering = ['-earned_at']

    def __str__(self):
        return f"{self.user.username} earned {self.achievement.name}"


class UserPoints(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField('accounts.CustomUser', on_delete=models.CASCADE, related_name='points')
    total_points = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    streak_days = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    last_workout_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    LEVEL_NAMES = {1: 'Beginner', 2: 'Active', 3: 'Dedicated', 4: 'Athlete', 5: 'Champion', 6: 'Legend'}
    LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2500]

    def get_level_name(self):
        return self.LEVEL_NAMES.get(self.level, 'Legend')

    def points_to_next_level(self):
        if self.level < len(self.LEVEL_THRESHOLDS):
            return max(0, self.LEVEL_THRESHOLDS[self.level] - self.total_points)
        return 0

    def recalculate_level(self):
        for i, threshold in enumerate(self.LEVEL_THRESHOLDS):
            if self.total_points < threshold:
                self.level = max(1, i)
                return
        self.level = 6

    def __str__(self):
        return f"{self.user.username} — {self.total_points} pts (Level {self.level})"


class Challenge(models.Model):
    GOAL_TYPES = [
        ('workouts', 'Complete Workouts'),
        ('calories', 'Burn Calories'),
        ('minutes', 'Train Minutes'),
        ('streak', 'Maintain Streak'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    icon = models.CharField(max_length=10, default='🏅')
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES)
    goal_value = models.IntegerField()
    reward_points = models.IntegerField(default=50)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.title


class ChallengeParticipation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='challenge_participations')
    challenge = models.ForeignKey(Challenge, on_delete=models.CASCADE, related_name='participants')
    progress = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'challenge']
        ordering = ['-joined_at']


class Notification(models.Model):
    TYPES = [
        ('achievement', 'Achievement Unlocked'),
        ('challenge', 'Challenge Update'),
        ('subscription', 'Subscription'),
        ('workout', 'Workout Reminder'),
        ('system', 'System'),
        ('streak', 'Streak'),
        ('points', 'Points Earned'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPES, default='system')
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=200, blank=True)
    icon = models.CharField(max_length=10, default='🔔')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.title}"


class Coupon(models.Model):
    DISCOUNT_TYPES = [('percentage', 'Percentage'), ('fixed', 'Fixed Amount')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=200, blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    max_uses = models.IntegerField(null=True, blank=True)
    times_used = models.IntegerField(default=0)
    min_purchase_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    applicable_plans = models.ManyToManyField('subscriptions.SubscriptionPlan', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return False, 'Coupon is inactive'
        if now < self.valid_from:
            return False, 'Coupon not yet valid'
        if now > self.valid_until:
            return False, 'Coupon has expired'
        if self.max_uses and self.times_used >= self.max_uses:
            return False, 'Coupon usage limit reached'
        return True, 'Valid'

    def __str__(self):
        return f"{self.code} — {self.discount_value}{'%' if self.discount_type == 'percentage' else '$'} off"


class Referral(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('completed', 'Completed'), ('rewarded', 'Rewarded')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    referrer = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='referrals_made')
    referred = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='referred_by_referral', null=True, blank=True)
    referral_code = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reward_points = models.IntegerField(default=100)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.referrer.username} → {self.referral_code}"


class SupportTicket(models.Model):
    STATUS_CHOICES = [('open', 'Open'), ('in_progress', 'In Progress'), ('resolved', 'Resolved'), ('closed', 'Closed')]
    PRIORITY_CHOICES = [('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='support_tickets', null=True, blank=True)
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=300)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.status.upper()}] {self.subject}"
