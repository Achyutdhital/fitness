"""
Django Migration: Add database indexes for Phase 9 optimization.
Indexes on frequently-queried fields to reduce query time.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('workouts', '0003_userworkoutprogress_started_at_and_more'),
    ]

    operations = [
        # Workout indexes
        migrations.AddIndex(
            model_name='workout',
            index=models.Index(fields=['created_by', 'created_at'], name='workout_creator_date_idx'),
        ),
        migrations.AddIndex(
            model_name='workout',
            index=models.Index(fields=['category', 'difficulty_level'], name='workout_category_level_idx'),
        ),
        migrations.AddIndex(
            model_name='userworkoutprogress',
            index=models.Index(fields=['user', 'completed_date'], name='progress_user_date_idx'),
        ),
        migrations.AddIndex(
            model_name='userworkoutprogress',
            index=models.Index(fields=['workout', 'status'], name='progress_workout_status_idx'),
        ),
    ]
