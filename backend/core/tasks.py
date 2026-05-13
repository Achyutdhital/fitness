"""
Celery tasks for async processing.
Phase 9: Email, reminders, analytics, notifications.
"""

from celery import shared_task
from django.core.management import call_command
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from io import StringIO
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@shared_task(name='core.tasks.send_email_automation', bind=True, max_retries=3)
def send_email_automation(self):
    """Run email automation asynchronously."""
    try:
        output = StringIO()
        call_command('run_email_automation', stdout=output, live=True)
        result = output.getvalue()
        logger.info(f"Email automation complete: {result[:100]}")
        return {'status': 'success', 'output': result}
    except Exception as exc:
        logger.error(f"Email automation failed: {exc}")
        # Retry in 5 minutes
        raise self.retry(exc=exc, countdown=300)


@shared_task(name='core.tasks.send_coaching_reminders')
def send_coaching_reminders():
    """Send reminders for upcoming coaching sessions."""
    from core.models import CoachSession
    from fitness_project.utils.email_templates import render_email_template
    
    # Find sessions in next 24 hours
    now = timezone.now()
    upcoming = CoachSession.objects.filter(
        scheduled_at__gte=now,
        scheduled_at__lte=now + timedelta(hours=24),
        reminder_sent=False
    ).select_related('coach', 'client')
    
    count = 0
    for session in upcoming:
        try:
            # Send to client
            subject, message = render_email_template(
                'coaching_reminder',
                {
                    'user_name': session.client.username,
                    'coach_name': session.coach.username,
                    'session_time': session.scheduled_at.strftime('%Y-%m-%d %H:%M'),
                }
            )
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [session.client.email],
                fail_silently=True,
            )
            
            # Send to coach
            subject, message = render_email_template(
                'coaching_reminder_coach',
                {
                    'coach_name': session.coach.username,
                    'client_name': session.client.username,
                    'session_time': session.scheduled_at.strftime('%Y-%m-%d %H:%M'),
                }
            )
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [session.coach.email],
                fail_silently=True,
            )
            
            session.reminder_sent = True
            session.save()
            count += 1
        except Exception as e:
            logger.error(f"Failed to send reminder for session {session.id}: {e}")
    
    logger.info(f"Sent {count} coaching reminders")
    return {'reminders_sent': count}


@shared_task(name='core.tasks.aggregate_ai_usage')
def aggregate_ai_usage():
    """Aggregate daily AI usage statistics."""
    from core.models import AIChatMessage, AIUsage
    from django.db.models import Count, Q
    from datetime import date
    
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Get unique users who used AI yesterday
    users = AIChatMessage.objects.filter(
        created_at__date=yesterday
    ).values_list('user_id', flat=True).distinct()
    
    count = 0
    for user_id in users:
        try:
            messages = AIChatMessage.objects.filter(
                user_id=user_id,
                created_at__date=yesterday
            ).count()
            
            # Update or create AIUsage record
            AIUsage.objects.update_or_create(
                user_id=user_id,
                month_date=yesterday.replace(day=1),
                defaults={
                    'monthly_count': messages,
                    'last_updated': timezone.now(),
                }
            )
            count += 1
        except Exception as e:
            logger.error(f"Failed to aggregate AI usage for user {user_id}: {e}")
    
    logger.info(f"Aggregated AI usage for {count} users")
    return {'users_aggregated': count}


@shared_task(name='core.tasks.update_churn_predictions')
def update_churn_predictions():
    """Update churn predictions for users."""
    from accounts.models import CustomUser
    from core.models import ChurnPrediction
    from datetime import timedelta
    
    now = timezone.now()
    inactive_threshold = now - timedelta(days=30)
    
    # Identify inactive users
    inactive_users = CustomUser.objects.filter(
        last_login__lt=inactive_threshold
    ).exclude(
        last_login__isnull=True
    )
    
    count = 0
    for user in inactive_users:
        try:
            # Calculate churn risk score (0-100)
            days_inactive = (now - user.last_login).days
            churn_score = min(100, int(days_inactive * 2))  # Rough estimate
            
            ChurnPrediction.objects.update_or_create(
                user=user,
                defaults={
                    'churn_risk_score': churn_score,
                    'last_calculated': now,
                    'is_at_risk': churn_score >= 50,
                }
            )
            count += 1
        except Exception as e:
            logger.error(f"Failed to update churn prediction for user {user.id}: {e}")
    
    logger.info(f"Updated churn predictions for {count} users")
    return {'users_updated': count}


@shared_task(name='core.tasks.calculate_engagement_scores')
def calculate_engagement_scores():
    """Calculate user engagement scores."""
    from accounts.models import CustomUser
    from core.models import EngagementScore
    from workouts.models import UserWorkoutProgress
    from django.db.models import Count, Q
    
    users = CustomUser.objects.filter(
        last_login__isnull=False
    )
    
    count = 0
    for user in users:
        try:
            now = timezone.now()
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            # Calculate engagement metrics
            workouts_week = UserWorkoutProgress.objects.filter(
                user=user,
                completed_date__gte=week_ago
            ).count()
            
            workouts_month = UserWorkoutProgress.objects.filter(
                user=user,
                completed_date__gte=month_ago
            ).count()
            
            # Simple engagement score: workouts per week * 10
            engagement_score = min(100, (workouts_week * 10))
            
            EngagementScore.objects.update_or_create(
                user=user,
                defaults={
                    'score': engagement_score,
                    'workouts_week': workouts_week,
                    'workouts_month': workouts_month,
                    'last_calculated': now,
                }
            )
            count += 1
        except Exception as e:
            logger.error(f"Failed to calculate engagement score for user {user.id}: {e}")
    
    logger.info(f"Calculated engagement scores for {count} users")
    return {'users_scored': count}
