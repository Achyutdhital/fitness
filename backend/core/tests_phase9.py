"""
Phase 9 Test Cases: Database Optimization, Async Workers, Feature Flags, Analytics
"""

from django.test import TestCase
from django.core.management import call_command
from io import StringIO
from accounts.models import CustomUser


class Phase9DatabaseOptimizationTestCase(TestCase):
    """Test Phase 9 database query optimization"""
    
    def setUp(self):
        """Create test users and data"""
        self.user = CustomUser.objects.create_user(
            username='dbtest',
            email='db@test.com',
            password='testpass'
        )
    
    def test_query_optimization_import(self):
        """Test that query optimization module imports without error"""
        from fitness_project.utils.query_optimization import (
            OptimizedUserQueryset, OptimizedCoachingQueries, OptimizedWorkoutQueries
        )
        self.assertIsNotNone(OptimizedUserQueryset)
        self.assertIsNotNone(OptimizedCoachingQueries)
    
    def test_optimized_user_queryset_with_subscription(self):
        """Test OptimizedUserQueryset.with_subscription() for N+1 prevention"""
        from fitness_project.utils.query_optimization import OptimizedUserQueryset
        
        # OptimizedUserQueryset methods are static and return optimized querysets
        qs = OptimizedUserQueryset.with_subscription()
        self.assertIsNotNone(qs)
        self.assertTrue(hasattr(qs, 'model'))
    
    def test_database_migration_indexes_created(self):
        """Test that Phase 9 indexes are created"""
        from django.db import connection
        
        with connection.cursor() as cursor:
            # Check for indexes (at least one should exist from Phase 9 migrations)
            cursor.execute(
                "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE '%idx%' OR name LIKE '%phase9%'"
            )
            indexes = cursor.fetchall()
            self.assertGreater(len(indexes), 0)


class Phase9CeleryTasksTestCase(TestCase):
    """Test Phase 9 async Celery tasks"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='celerytest',
            email='celery@test.com',
            password='testpass'
        )
    
    def test_celery_config_import(self):
        """Test that Celery config can be imported"""
        from fitness_project.celery import app
        self.assertIsNotNone(app)
    
    def test_celery_beat_schedule_exists(self):
        """Test that beat schedule is configured"""
        from fitness_project.celery import app
        
        schedule = app.conf.beat_schedule
        self.assertIsNotNone(schedule)
        # Task names use dashes in beat schedule
        self.assertIn('send-email-automation', schedule)
        self.assertIn('aggregate-ai-usage', schedule)
    
    def test_core_tasks_import(self):
        """Test that core tasks can be imported"""
        from core.tasks import (
            send_email_automation,
            send_coaching_reminders,
            aggregate_ai_usage,
            update_churn_predictions,
            calculate_engagement_scores,
        )
        self.assertIsNotNone(send_email_automation)
        self.assertIsNotNone(update_churn_predictions)
    
    def test_payment_tasks_import(self):
        """Test that payment tasks can be imported"""
        from payments.tasks import process_monthly_coach_payouts
        self.assertIsNotNone(process_monthly_coach_payouts)


class Phase9FeatureFlagsTestCase(TestCase):
    """Test Phase 9 feature flag system"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='flagtest',
            email='flag@test.com',
            password='testpass'
        )
        self.admin_user = CustomUser.objects.create_user(
            username='adminflag',
            email='adminflag@test.com',
            password='testpass',
            is_staff=True
        )
    
    def test_feature_flag_model_creation(self):
        """Test that feature flags can be created"""
        from core.feature_flags import FeatureFlag, FeatureFlagType
        
        flag = FeatureFlag.objects.create(
            key='test_feature',
            name='Test Feature',
            type=FeatureFlagType.PERCENTAGE.value,
            percentage_rollout=50,
            is_active=True,
        )
        self.assertIsNotNone(flag)
        self.assertEqual(flag.key, 'test_feature')
    
    def test_feature_flag_percentage_rollout(self):
        """Test percentage-based rollout (consistent hashing)"""
        from core.feature_flags import FeatureFlag, FeatureFlagType
        
        flag = FeatureFlag.objects.create(
            key='percentage_feature',
            name='Percentage Feature',
            type=FeatureFlagType.PERCENTAGE.value,
            percentage_rollout=50,
            is_active=True,
        )
        
        # Same user should always get same result (consistent hash)
        result1 = flag.is_enabled_for_user(self.user)
        result2 = flag.is_enabled_for_user(self.user)
        self.assertEqual(result1, result2)
    
    def test_feature_flag_admin_type(self):
        """Test admin-only flag type"""
        from core.feature_flags import FeatureFlag, FeatureFlagType
        
        flag = FeatureFlag.objects.create(
            key='admin_feature',
            name='Admin Feature',
            type=FeatureFlagType.ADMIN.value,
            is_active=True,
        )
        
        # Regular user should not have access
        self.assertFalse(flag.is_enabled_for_user(self.user))
        # Admin user should have access
        self.assertTrue(flag.is_enabled_for_user(self.admin_user))
    
    def test_feature_flag_explicit_users(self):
        """Test explicit user list flag type"""
        from core.feature_flags import FeatureFlag, FeatureFlagType
        
        flag = FeatureFlag.objects.create(
            key='explicit_feature',
            name='Explicit Feature',
            type=FeatureFlagType.EXPLICIT.value,
            explicit_user_ids=str(self.user.id),
            is_active=True,
        )
        
        # User should be enabled
        self.assertTrue(flag.is_enabled_for_user(self.user))
        # Other user should not be enabled
        other_user = CustomUser.objects.create_user(
            username='other',
            email='other@test.com',
            password='testpass'
        )
        self.assertFalse(flag.is_enabled_for_user(other_user))
    
    def test_feature_flag_manager(self):
        """Test FeatureFlagManager singleton"""
        from core.feature_flags import FeatureFlag, FeatureFlagManager, FeatureFlagType
        
        flag = FeatureFlag.objects.create(
            key='manager_test',
            name='Manager Test',
            type=FeatureFlagType.PERCENTAGE.value,
            percentage_rollout=100,
            is_active=True,
        )
        
        # Manager should return flag
        retrieved = FeatureFlagManager.get_flag('manager_test')
        self.assertIsNotNone(retrieved)
        
        # Manager should check if enabled for user
        is_enabled = FeatureFlagManager.is_enabled('manager_test', self.user)
        self.assertTrue(is_enabled)


class Phase9AnalyticsTestCase(TestCase):
    """Test Phase 9 advanced analytics models"""
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='analyticstest',
            email='analytics@test.com',
            password='testpass'
        )
    
    def test_churn_prediction_model_creation(self):
        """Test that ChurnPrediction records can be created"""
        from core.analytics_models import ChurnPrediction
        
        churn = ChurnPrediction.objects.create(
            user=self.user,
            churn_risk_score=45,
            is_at_risk=False,
            days_inactive=10,
        )
        self.assertIsNotNone(churn)
        self.assertEqual(churn.churn_risk_score, 45)
    
    def test_engagement_score_model_creation(self):
        """Test that EngagementScore records can be created"""
        from core.analytics_models import EngagementScore
        
        engagement = EngagementScore.objects.create(
            user=self.user,
            score=75,
            workouts_week=3,
            ai_interactions=5,
        )
        self.assertIsNotNone(engagement)
        self.assertEqual(engagement.score, 75)
    
    def test_lifetime_value_calculation(self):
        """Test LTV calculation"""
        from core.analytics_models import LifetimeValue
        
        ltv = LifetimeValue.calculate_ltv(self.user)
        self.assertIsNotNone(ltv)
        self.assertGreaterEqual(ltv.predicted_ltv, 0)
    
    def test_cohort_analysis_model_creation(self):
        """Test that CohortAnalysis records can be created"""
        from core.analytics_models import CohortAnalysis
        from datetime import date
        
        cohort = CohortAnalysis.objects.create(
            cohort_month=date(2024, 1, 1),
            cohort_size=100,
            total_revenue=5000,
            avg_ltv=50,
        )
        self.assertIsNotNone(cohort)
        self.assertEqual(cohort.cohort_size, 100)
    
    def test_retention_metrics_model_creation(self):
        """Test that RetentionMetrics records can be created"""
        from core.analytics_models import RetentionMetrics
        from datetime import date
        
        retention = RetentionMetrics.objects.create(
            date=date.today(),
            day_1_retention=85.5,
            active_users=500,
            new_users=20,
        )
        self.assertIsNotNone(retention)
        self.assertEqual(retention.day_1_retention, 85.5)
    
    def test_cac_model_creation(self):
        """Test that CAC records can be created"""
        from core.analytics_models import CustomerAcquisitionCost
        from datetime import date
        from decimal import Decimal
        
        cac = CustomerAcquisitionCost.objects.create(
            month=date(2024, 1, 1),
            total_marketing_spend=Decimal('1000.00'),
            new_customers=50,
        )
        self.assertIsNotNone(cac)
        self.assertEqual(cac.cac_per_customer, Decimal('20.00'))
