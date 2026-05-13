from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
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


class AdViewLog(models.Model):
    """Log to track ad views for the Free tier '1-ad-per-week' requirement"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='ad_logs')
    viewed_at = models.DateTimeField(auto_now_add=True)
    points_awarded = models.IntegerField(default=10)

    class Meta:
        ordering = ['-viewed_at']

class ItemUnlock(models.Model):
    """Tracks individual items unlocked with points (Basic tier only)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='unlocks')
    workout = models.ForeignKey('workouts.Workout', on_delete=models.CASCADE, null=True, blank=True)
    meal_plan = models.ForeignKey('workouts.MealPlan', on_delete=models.CASCADE, null=True, blank=True)
    unlocked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_active(self):
        from django.utils import timezone
        return timezone.now() < self.expires_at

class CustomizedWorkout(models.Model):
    """Cloned workout for specific client, modified by coach"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='custom_workouts')
    coach = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='managed_workouts')
    original_workout = models.ForeignKey('workouts.Workout', on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    data = models.JSONField(help_text="Customized structure/exercises")
    created_at = models.DateTimeField(auto_now_add=True)

class CustomizedMealPlan(models.Model):
    """Cloned meal plan for specific client, modified by coach"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='custom_meal_plans')
    coach = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='managed_meals')
    original_meal_plan = models.ForeignKey('workouts.MealPlan', on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=200)
    description = models.TextField()
    data = models.JSONField(help_text="Customized diet plan")
    created_at = models.DateTimeField(auto_now_add=True)

class CoachSession(models.Model):
    """Scheduled 1-on-1 sessions (Elite/Pro)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='sessions_led')
    client = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='sessions_attended')
    requested_by = models.ForeignKey('accounts.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name='coach_session_requests')
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=45)
    status = models.CharField(
        max_length=20, 
        choices=[
            ('pending_approval', 'Pending Approval'),
            ('scheduled', 'Scheduled'),
            ('completed', 'Completed'),
            ('canceled', 'Canceled'),
            ('reschedule_requested', 'Reschedule Requested'),
        ],
        default='pending_approval'
    )
    meeting_link = models.URLField(blank=True)
    notes = models.TextField(blank=True)


class CoachPayout(models.Model):
    """Track revenue share payouts for assigned coaches."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('rejected', 'Rejected'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    coach = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='payouts_received')
    client = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='payouts_generated')
    payment = models.OneToOneField('payments.Payment', on_delete=models.CASCADE, related_name='coach_payout')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payout_period = models.CharField(max_length=20, default='monthly')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.coach.username} payout ${self.amount} ({self.status})"

class Notification(models.Model):
    TYPES = [
        ('achievement', 'Achievement Unlocked'),
        ('challenge', 'Challenge Update'),
        ('subscription', 'Subscription'),
        ('workout', 'Workout Reminder'),
        ('system', 'System'),
        ('streak', 'Streak'),
        ('points', 'Points Earned'),
        ('session', 'Coaching Session'),
        ('unlock_expiry', 'Unlock Expiring'),
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
    CATEGORY_CHOICES = [
        ('general', 'General'),
        ('account', 'Account Access'),
        ('billing', 'Billing & Payments'),
        ('technical', 'Technical Issue'),
        ('coaching', 'Coaching & Sessions'),
        ('cancellation', 'Cancellation'),
        ('feedback', 'Feedback / Feature Request'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='support_tickets', null=True, blank=True)
    name = models.CharField(max_length=200)
    email = models.EmailField()
    subject = models.CharField(max_length=300)
    message = models.TextField()
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    admin_notes = models.TextField(blank=True)
    triaged_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority', 'created_at']),
            models.Index(fields=['category', 'created_at']),
        ]

    @staticmethod
    def _contains_any(text, keywords):
        return any(keyword in text for keyword in keywords)

    def auto_triage(self):
        content = f"{self.subject} {self.message}".lower()

        category_map = [
            ('billing', ['billing', 'charge', 'charged', 'payment', 'refund', 'invoice', 'plan', 'subscription']),
            ('account', ['login', 'sign in', 'password', 'account', 'verify', 'verification', 'locked']),
            ('technical', ['bug', 'error', 'crash', 'broken', 'issue', 'not working', 'glitch', 'failed']),
            ('coaching', ['coach', 'trainer', 'session', 'appointment', 'book', 'reschedule']),
            ('cancellation', ['cancel', 'refund', 'downgrade', 'unsubscribe', 'stop membership']),
            ('feedback', ['feature', 'request', 'idea', 'suggestion', 'feedback']),
        ]

        priority = 'medium'
        if self._contains_any(content, ['urgent', 'asap', 'immediately', 'cannot login', "can't login", 'charged twice', 'payment failed', 'stuck on checkout']):
            priority = 'urgent'
        elif self._contains_any(content, ['today', 'now', 'blocked', 'error', 'broken', 'refund', 'cancel']):
            priority = 'high'
        elif self._contains_any(content, ['question', 'how do i', 'when can', 'info']):
            priority = 'low'

        category = 'general'
        for candidate, keywords in category_map:
            if self._contains_any(content, keywords):
                category = candidate
                break

        note_map = {
            'billing': 'Route to billing queue and confirm payment status.',
            'account': 'Check authentication, password reset, and account access logs.',
            'technical': 'Review app logs and reproduce the reported issue.',
            'coaching': 'Coordinate with coaching team for session or trainer follow-up.',
            'cancellation': 'Confirm cancellation eligibility and retention options.',
            'feedback': 'Log product feedback for roadmap review.',
            'general': 'General inquiry. Respond from the support inbox.',
        }

        self.category = category
        self.priority = priority
        self.admin_notes = self.admin_notes or note_map[category]
        self.triaged_at = timezone.now()

        return self

    def __str__(self):
        return f"[{self.status.upper()}] {self.subject}"

class AIUsage(models.Model):
    """Track daily and monthly AI message usage per tier"""
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='ai_usage')
    date = models.DateField(auto_now_add=True)
    count = models.PositiveIntegerField(default=0)
    month_date = models.DateField(null=True, blank=True)  # First day of the month for monthly tracking
    monthly_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('user', 'date')
        verbose_name_plural = "AI Usage Tracking"

    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.count} msgs (monthly: {self.monthly_count})"
    
    @property
    def get_tier_limit(self):
        """Get daily message limit based on user's subscription tier"""
        try:
            from subscriptions.models import UserSubscription
            sub = UserSubscription.objects.filter(
                user=self.user, status__in=['active', 'trial']
            ).select_related('plan__tier').order_by('-created_at').first()
            if sub and sub.plan and sub.plan.tier:
                tier_name = sub.plan.tier.name.lower()
                limits = {'free': 5, 'pro': 20, 'elite': 50, 'custom': 100}
                return limits.get(tier_name, 5)
        except Exception:
            pass
        return 5  # Default to free limit

class AIChatMessage(models.Model):
    ROLE_CHOICES = (
        ('user', 'User'),
        ('model', 'Coach'),
    )
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='ai_chat_history')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    text = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.user.username} ({self.role}): {self.text[:30]}..."


class TrainerMessage(models.Model):
    """Track 1-on-1 trainer messages for Custom tier users"""
    ROLE_CHOICES = (
        ('coach', 'Trainer'),
        ('user', 'User'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='trainer_messages_received')
    coach = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, related_name='trainer_messages_sent', limit_choices_to={'role': 'trainer'})
    text = models.TextField()
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_ai_generated = models.BooleanField(default=False, help_text="True if message was AI-assisted")
    
    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['coach', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.user.username} ← {self.coach.username} ({self.role}): {self.text[:30]}..."


class TrainerMessageQuota(models.Model):
    """Track weekly trainer message quota for Custom tier users"""
    user = models.OneToOneField('accounts.CustomUser', on_delete=models.CASCADE, related_name='trainer_quota')
    week_start_date = models.DateField()  # Sunday of the current week
    messages_this_week = models.PositiveIntegerField(default=0)
    weekly_limit = models.PositiveIntegerField(default=20)  # 20 messages per week
    month_start_date = models.DateField()  # 1st of current month
    messages_this_month = models.PositiveIntegerField(default=0)
    monthly_limit = models.PositiveIntegerField(default=80)  # ~80 per month (4 weeks * 20)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Trainer Message Quota"
        verbose_name_plural = "Trainer Message Quotas"
    
    def __str__(self):
        return f"{self.user.username}: {self.messages_this_week}/{self.weekly_limit} this week"


class EmailAutomationLog(models.Model):
    """Record one automation send per recipient and day."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    automation_key = models.CharField(max_length=80)
    recipient_email = models.EmailField()
    recipient_name = models.CharField(max_length=200, blank=True)
    reference_date = models.DateField()
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['automation_key', 'recipient_email', 'reference_date']

    def __str__(self):
        return f"{self.automation_key} -> {self.recipient_email} ({self.reference_date})"
