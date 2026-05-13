"""
Django migration: Add Phase 9 feature flags and analytics models.
"""

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0011_add_phase9_indexes'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Feature Flags
        migrations.CreateModel(
            name='FeatureFlag',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(db_index=True, max_length=100, unique=True)),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('type', models.CharField(choices=[('percentage', 'PERCENTAGE'), ('segment', 'SEGMENT'), ('explicit', 'EXPLICIT'), ('beta_users', 'BETA_USERS'), ('admin', 'ADMIN')], default='percentage', max_length=20)),
                ('percentage_rollout', models.IntegerField(default=0, help_text='0-100 percentage')),
                ('segment_name', models.CharField(blank=True, help_text="User segment (e.g., 'premium', 'beta')", max_length=100)),
                ('explicit_user_ids', models.TextField(blank=True, help_text='Comma-separated user IDs')),
                ('is_active', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-created_at']},
        ),
        
        # Analytics Models
        migrations.CreateModel(
            name='CohortAnalysis',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cohort_month', models.DateField(help_text='Month of user signup (first day)')),
                ('cohort_size', models.IntegerField(help_text='Number of users in this cohort')),
                ('month_0_active', models.IntegerField(default=0)),
                ('month_1_active', models.IntegerField(default=0)),
                ('month_3_active', models.IntegerField(default=0)),
                ('month_6_active', models.IntegerField(default=0)),
                ('month_12_active', models.IntegerField(default=0)),
                ('total_revenue', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('avg_ltv', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-cohort_month'], 'unique_together': {('cohort_month',)}},
        ),
        
        migrations.CreateModel(
            name='LifetimeValue',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_revenue', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('average_revenue_per_month', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('months_active', models.IntegerField(default=0)),
                ('predicted_ltv', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('ltv_prediction_confidence', models.FloatField(default=0.0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='ltv_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        
        migrations.CreateModel(
            name='RetentionMetrics',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(db_index=True, unique=True)),
                ('day_1_retention', models.FloatField(default=0.0)),
                ('day_7_retention', models.FloatField(default=0.0)),
                ('day_30_retention', models.FloatField(default=0.0)),
                ('day_90_retention', models.FloatField(default=0.0)),
                ('active_users', models.IntegerField(default=0)),
                ('new_users', models.IntegerField(default=0)),
                ('returning_users', models.IntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-date']},
        ),
        
        migrations.CreateModel(
            name='ChurnPrediction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('churn_risk_score', models.IntegerField(default=0, help_text='0-100 score')),
                ('is_at_risk', models.BooleanField(default=False)),
                ('days_inactive', models.IntegerField(default=0)),
                ('engagement_score', models.FloatField(default=0.0)),
                ('subscription_status', models.CharField(default='active', max_length=20)),
                ('last_intervention', models.DateTimeField(blank=True, null=True)),
                ('intervention_count', models.IntegerField(default=0)),
                ('last_calculated', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='churn_prediction', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        
        migrations.CreateModel(
            name='EngagementScore',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.IntegerField(default=0, help_text='0-100 engagement score')),
                ('workouts_week', models.IntegerField(default=0)),
                ('workouts_month', models.IntegerField(default=0)),
                ('ai_interactions', models.IntegerField(default=0)),
                ('coaching_sessions', models.IntegerField(default=0)),
                ('score_trend', models.CharField(choices=[('up', 'Increasing'), ('stable', 'Stable'), ('down', 'Decreasing')], default='stable', max_length=10)),
                ('last_calculated', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='engagement_score', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        
        migrations.CreateModel(
            name='CustomerAcquisitionCost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('month', models.DateField(help_text='Month for CAC calculation', unique=True)),
                ('total_marketing_spend', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('new_customers', models.IntegerField(default=0)),
                ('cac_per_customer', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['-month']},
        ),
        
        # Add indexes to FeatureFlag
        migrations.AddIndex(
            model_name='featureflag',
            index=models.Index(fields=['key', 'is_active'], name='feature_flag_key_active_idx'),
        ),
    ]
