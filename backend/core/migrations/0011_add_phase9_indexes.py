"""
Phase 9: Create database indexes migration for core app.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0010_emailautomationlog'),
    ]

    operations = [
        # Support ticket indexes
        migrations.AddIndex(
            model_name='supportticket',
            index=models.Index(fields=['status', 'priority'], name='ticket_status_priority_idx'),
        ),
        migrations.AddIndex(
            model_name='supportticket',
            index=models.Index(fields=['user', 'created_at'], name='ticket_user_date_idx'),
        ),
        
        # AI usage indexes
        migrations.AddIndex(
            model_name='aiusage',
            index=models.Index(fields=['user', 'month_date'], name='aiusage_user_month_idx'),
        ),
        
        # Chat message indexes
        migrations.AddIndex(
            model_name='aichatmessage',
            index=models.Index(fields=['user', 'timestamp'], name='chat_user_date_idx'),
        ),
        
        # Coaching session indexes
        migrations.AddIndex(
            model_name='coachsession',
            index=models.Index(fields=['coach', 'status'], name='session_coach_status_idx'),
        ),
        migrations.AddIndex(
            model_name='coachsession',
            index=models.Index(fields=['client', 'scheduled_at'], name='session_client_date_idx'),
        ),
        
        # Body measurement indexes
        migrations.AddIndex(
            model_name='bodymeasurement',
            index=models.Index(fields=['user', 'date'], name='measurement_user_date_idx'),
        ),
    ]
