"""
Celery configuration for async task processing.
Phase 9: Background jobs, scheduled tasks, notifications.
"""

import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_project.settings')

app = Celery('fitness_project')

# Load config from Django settings (CELERY_ prefix)
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()

# Celery Beat schedule - periodic tasks
app.conf.beat_schedule = {
    # Email automation (every hour)
    'send-email-automation': {
        'task': 'core.tasks.send_email_automation',
        'schedule': crontab(minute=0),  # Every hour
    },
    
    # Coaching session reminders (every 6 hours)
    'send-coaching-reminders': {
        'task': 'core.tasks.send_coaching_reminders',
        'schedule': crontab(minute=0, hour='*/6'),
    },
    
    # AI usage analytics aggregation (daily at 2 AM)
    'aggregate-ai-usage': {
        'task': 'core.tasks.aggregate_ai_usage',
        'schedule': crontab(hour=2, minute=0),
    },
    
    # Churn prediction model update (weekly Sunday at 3 AM)
    'update-churn-predictions': {
        'task': 'core.tasks.update_churn_predictions',
        'schedule': crontab(hour=3, minute=0, day_of_week=0),
    },
    
    # Coach payout processing (monthly 1st at 4 AM)
    'process-monthly-payouts': {
        'task': 'payments.tasks.process_monthly_coach_payouts',
        'schedule': crontab(hour=4, minute=0, day_of_month=1),
    },
    
    # User engagement scoring (daily at 1 AM)
    'calculate-engagement-scores': {
        'task': 'core.tasks.calculate_engagement_scores',
        'schedule': crontab(hour=1, minute=0),
    },
}

# Celery configuration
app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task routing
    task_default_queue='default',
    task_queues={
        'default': {'exchange': 'default'},
        'email': {'exchange': 'email'},
        'analytics': {'exchange': 'analytics'},
        'notifications': {'exchange': 'notifications'},
    },
    
    # Task routing rules
    task_routes={
        'core.tasks.send_*': {'queue': 'notifications'},
        'core.tasks.aggregate_*': {'queue': 'analytics'},
        'core.tasks.calculate_*': {'queue': 'analytics'},
        'payments.tasks.*': {'queue': 'default'},
    },
    
    # Task settings
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery."""
    print(f'Request: {self.request!r}')
