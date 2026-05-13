"""
Phase 9: Advanced Analytics Models
Cohort analysis, LTV, CAC, retention, churn prediction.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q, F, DecimalField, ExpressionWrapper
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal

User = get_user_model()


class CohortAnalysis(models.Model):
    """
    Cohort analysis: track user groups by signup period.
    Helps understand retention and behavior patterns.
    """
    
    cohort_month = models.DateField(help_text="Month of user signup (first day)")
    cohort_size = models.IntegerField(help_text="Number of users in this cohort")
    
    # Retention metrics
    month_0_active = models.IntegerField(default=0)  # Month of signup
    month_1_active = models.IntegerField(default=0)  # 1 month after signup
    month_3_active = models.IntegerField(default=0)  # 3 months
    month_6_active = models.IntegerField(default=0)  # 6 months
    month_12_active = models.IntegerField(default=0)  # 12 months
    
    # Revenue metrics
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    avg_ltv = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Average LTV per user
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-cohort_month']
        unique_together = ['cohort_month']
    
    def __str__(self):
        return f"Cohort {self.cohort_month.strftime('%Y-%m')}"
    
    @staticmethod
    def calculate_cohorts():
        """Calculate cohort metrics for all cohorts."""
        from accounts.models import CustomUser
        from subscriptions.models import SubscriptionPlan
        
        # Get unique signup months
        cohorts = CustomUser.objects.datetimedate_trunc('created_at', 'month').values('created_at').distinct()
        
        for cohort_date in cohorts:
            cohort_month = cohort_date['created_at'].date().replace(day=1)
            
            # Get users signed up in this month
            cohort_users = CustomUser.objects.filter(
                created_at__date__month=cohort_month.month,
                created_at__date__year=cohort_month.year,
            )
            
            cohort_size = cohort_users.count()
            if cohort_size == 0:
                continue
            
            # Calculate retention at each interval
            now = timezone.now()
            month_0 = cohort_users.filter(
                last_login__gte=now - timedelta(days=30)
            ).count()
            
            month_1 = cohort_users.filter(
                last_login__gte=now - timedelta(days=60)
            ).count()
            
            month_3 = cohort_users.filter(
                last_login__gte=now - timedelta(days=120)
            ).count()
            
            # Calculate revenue
            total_revenue = sum(
                u.user_subscription_set.aggregate(
                    total=Sum('subscription_plan__price')
                )['total'] or 0
                for u in cohort_users
            )
            
            avg_ltv = Decimal(total_revenue) / Decimal(cohort_size) if cohort_size > 0 else 0
            
            # Update or create cohort
            CohortAnalysis.objects.update_or_create(
                cohort_month=cohort_month,
                defaults={
                    'cohort_size': cohort_size,
                    'month_0_active': month_0,
                    'month_1_active': month_1,
                    'month_3_active': month_3,
                    'total_revenue': total_revenue,
                    'avg_ltv': avg_ltv,
                }
            )


class LifetimeValue(models.Model):
    """
    User Lifetime Value (LTV): total revenue expected from a user.
    """
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='ltv_profile')
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_revenue_per_month = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    months_active = models.IntegerField(default=0)
    
    # Predicted LTV based on historical behavior
    predicted_ltv = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ltv_prediction_confidence = models.FloatField(default=0.0)  # 0.0-1.0
    
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"LTV: {self.user.username} - ${self.total_revenue}"
    
    @staticmethod
    def calculate_ltv(user):
        """Calculate LTV for a user."""
        from subscriptions.models import SubscriptionPlan
        
        # Total revenue from subscriptions
        # Total revenue from user's subscription
        total_revenue = 0
        if hasattr(user, 'subscription') and user.subscription and user.subscription.subscription_plan:
            total_revenue = user.subscription.subscription_plan.price
        # Months active
        if user.last_login and user.created_at:
            months_active = max(1, (user.last_login - user.created_at).days // 30)
        else:
            months_active = 0
        
        # Average monthly revenue
        arpu = Decimal(total_revenue) / max(1, months_active)
        
        # Predicted LTV (simple: 12 months of current ARPU)
        predicted_ltv = arpu * 12
        
        ltv, created = LifetimeValue.objects.update_or_create(
            user=user,
            defaults={
                'total_revenue': total_revenue,
                'months_active': months_active,
                'average_revenue_per_month': arpu,
                'predicted_ltv': predicted_ltv,
                'ltv_prediction_confidence': 0.7 if months_active >= 3 else 0.3,
            }
        )
        return ltv


class CustomerAcquisitionCost(models.Model):
    """
    Customer Acquisition Cost (CAC): average cost to acquire a customer.
    """
    
    month = models.DateField(unique=True, help_text="Month for CAC calculation")
    
    # Costs
    total_marketing_spend = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    new_customers = models.IntegerField(default=0)
    
    # Calculated metrics
    cac_per_customer = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-month']
    
    def __str__(self):
        return f"CAC {self.month.strftime('%Y-%m')}: ${self.cac_per_customer}"
    
    def save(self, *args, **kwargs):
        """Auto-calculate CAC on save."""
        if self.new_customers > 0:
            self.cac_per_customer = self.total_marketing_spend / self.new_customers
        super().save(*args, **kwargs)


class RetentionMetrics(models.Model):
    """
    Daily retention metrics: track how many users return each day.
    """
    
    date = models.DateField(unique=True, db_index=True)
    
    # Retention cohorts
    day_1_retention = models.FloatField(default=0.0)   # Percentage (0-100)
    day_7_retention = models.FloatField(default=0.0)
    day_30_retention = models.FloatField(default=0.0)
    day_90_retention = models.FloatField(default=0.0)
    
    # Engagement
    active_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    returning_users = models.IntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return f"Retention {self.date}: D1={self.day_1_retention:.1f}%"
    
    @staticmethod
    def calculate_daily_metrics(date_obj: date):
        """Calculate retention for a specific date."""
        from accounts.models import CustomUser
        
        # Users active today
        active_today = CustomUser.objects.filter(
            last_login__date=date_obj
        ).count()
        
        # Users active yesterday (day 1 retention)
        yesterday = date_obj - timedelta(days=1)
        active_yesterday = CustomUser.objects.filter(
            last_login__date=yesterday
        ).count()
        day_1_ret = (active_yesterday / max(1, active_today)) * 100
        
        # New users today
        new_users = CustomUser.objects.filter(
            created_at__date=date_obj
        ).count()
        
        # Returning users (active today, not new)
        returning = active_today - new_users
        
        RetentionMetrics.objects.update_or_create(
            date=date_obj,
            defaults={
                'active_users': active_today,
                'new_users': new_users,
                'returning_users': returning,
                'day_1_retention': day_1_ret,
            }
        )


class ChurnPrediction(models.Model):
    """
    Churn prediction model: identify users likely to churn.
    """
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='churn_prediction')
    churn_risk_score = models.IntegerField(default=0, help_text="0-100 score")
    is_at_risk = models.BooleanField(default=False)
    
    # Contributing factors
    days_inactive = models.IntegerField(default=0)
    engagement_score = models.FloatField(default=0.0)
    subscription_status = models.CharField(max_length=20, default='active')
    
    # Intervention tracking
    last_intervention = models.DateTimeField(null=True, blank=True)
    intervention_count = models.IntegerField(default=0)
    
    last_calculated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        risk_level = "HIGH" if self.is_at_risk else "LOW"
        return f"{self.user.username}: {risk_level} ({self.churn_risk_score}%)"


class EngagementScore(models.Model):
    """
    User engagement score: composite metric of user activity.
    """
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='engagement_score')
    score = models.IntegerField(default=0, help_text="0-100 engagement score")
    
    # Engagement factors
    workouts_week = models.IntegerField(default=0)
    workouts_month = models.IntegerField(default=0)
    ai_interactions = models.IntegerField(default=0)
    coaching_sessions = models.IntegerField(default=0)
    
    # Trend
    score_trend = models.CharField(
        max_length=10,
        choices=[('up', 'Increasing'), ('stable', 'Stable'), ('down', 'Decreasing')],
        default='stable'
    )
    
    last_calculated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}: {self.score}/100"
