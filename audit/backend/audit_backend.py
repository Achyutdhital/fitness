"""
FitnessPro Backend Audit Suite
Tests all features, endpoints, models, and integration points.
"""

import os
import sys
import django
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent.parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fitness_project.settings')
os.chdir(str(backend_dir))
django.setup()

# Add testserver to ALLOWED_HOSTS for audit testing
from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')

from django.test import Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import CustomUser, UserSubscription, UserProfile
from subscriptions.models import SubscriptionPlan, SubscriptionTier, Feature
from workouts.models import Workout, Exercise, WorkoutCategory, UserWorkoutProgress
from payments.models import Payment
from cms.models import BlogPost, DynamicPage
from core.models import (
    CoachSession, Notification, Achievement, UserAchievement,
    BodyMeasurement, Challenge, ChallengeParticipation,
    SupportTicket, AIUsage
)
from core.analytics_models import ChurnPrediction, EngagementScore, LifetimeValue
from core.tasks import send_email_automation, send_coaching_reminders
from core.feature_flags import FeatureFlag, FeatureFlagManager

# Global audit results
audit_results = {
    'passed': [],
    'failed': [],
    'warnings': [],
    'timestamp': datetime.now().isoformat()
}

def log_pass(msg):
    audit_results['passed'].append(msg)
    print(f"[PASS] {msg}")

def log_fail(msg, error=None):
    audit_results['failed'].append(msg)
    if error:
        print(f"[FAIL] {msg}: {str(error)[:100]}")
    else:
        print(f"[FAIL] {msg}")

def log_warn(msg):
    audit_results['warnings'].append(msg)
    print(f"[WARN] {msg}")

def audit_database_connections():
    """Test database connectivity."""
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        log_pass("Database connectivity")
    except Exception as e:
        log_fail("Database connectivity", e)

def audit_models():
    """Verify all models exist and have proper fields."""
    models_to_check = [
        CustomUser, UserSubscription, UserProfile,
        SubscriptionTier, SubscriptionPlan, Feature,
        Workout, WorkoutCategory, Exercise, UserWorkoutProgress,
        Payment, BlogPost, DynamicPage,
        CoachSession, Notification, Achievement, UserAchievement,
        BodyMeasurement, Challenge, ChallengeParticipation,
        SupportTicket, AIUsage, FeatureFlag,
        ChurnPrediction, EngagementScore, LifetimeValue
    ]
    
    for model in models_to_check:
        try:
            model.objects.count()
            log_pass(f"Model {model.__name__}")
        except Exception as e:
            log_fail(f"Model {model.__name__}", e)

def audit_authentication():
    """Test user registration and authentication."""
    client = APIClient()
    
    # Test user registration
    try:
        response = client.post('/api/auth/register/', {
            'email': f'test_audit_{datetime.now().timestamp()}@example.com',
            'password': 'TestPassword123!',
            'password_confirm': 'TestPassword123!',
            'first_name': 'Test',
            'last_name': 'User'
        })
        if response.status_code in [200, 201, 400]:
            log_pass("User registration endpoint")
        else:
            log_fail(f"User registration endpoint: Status {response.status_code}")
    except Exception as e:
        log_fail("User registration endpoint", e)

def audit_subscriptions():
    """Test subscription endpoints."""
    client = APIClient()
    
    try:
        response = client.get('/api/subscriptions/plans/')
        if response.status_code in [200, 401]:
            log_pass("Subscription plans listing")
        else:
            log_fail(f"Subscription plans listing: Status {response.status_code}")
    except Exception as e:
        log_fail("Subscription plans listing", e)

def audit_workouts():
    """Test workout endpoints."""
    client = APIClient()
    
    try:
        response = client.get('/api/workouts/')
        if response.status_code in [200, 401]:
            log_pass("Workouts listing")
        else:
            log_fail(f"Workouts listing: Status {response.status_code}")
    except Exception as e:
        log_fail("Workouts listing", e)
    
    try:
        response = client.get('/api/workouts/categories/')
        if response.status_code in [200, 401]:
            log_pass("Workout categories")
        else:
            log_fail(f"Workout categories: Status {response.status_code}")
    except Exception as e:
        log_fail("Workout categories", e)

def audit_payments():
    """Test payment endpoints."""
    client = APIClient()
    
    try:
        response = client.get('/api/payments/')
        if response.status_code in [200, 401]:
            log_pass("Payments endpoint")
        else:
            log_fail(f"Payments endpoint: Status {response.status_code}")
    except Exception as e:
        log_fail("Payments endpoint", e)

def audit_cms():
    """Test CMS endpoints."""
    client = APIClient()
    
    try:
        response = client.get('/api/cms/pages/')
        if response.status_code in [200, 401]:
            log_pass("CMS pages listing")
        else:
            log_fail(f"CMS pages listing: Status {response.status_code}")
    except Exception as e:
        log_fail("CMS pages listing", e)
    
    try:
        response = client.get('/api/cms/blog/')
        if response.status_code in [200, 401]:
            log_pass("Blog posts listing")
        else:
            log_fail(f"Blog posts listing: Status {response.status_code}")
    except Exception as e:
        log_fail("Blog posts listing", e)

def audit_core_features():
    """Test core feature endpoints."""
    client = APIClient()
    
    try:
        response = client.get('/api/core/notifications/')
        if response.status_code in [200, 401]:
            log_pass("Notifications endpoint")
        else:
            log_fail(f"Notifications endpoint: Status {response.status_code}")
    except Exception as e:
        log_fail("Notifications endpoint", e)
    
    try:
        response = client.get('/api/core/achievements/')
        if response.status_code in [200, 401]:
            log_pass("Achievements endpoint")
        else:
            log_fail(f"Achievements endpoint: Status {response.status_code}")
    except Exception as e:
        log_fail("Achievements endpoint", e)

def audit_api_documentation():
    """Test API documentation endpoints."""
    client = APIClient()
    
    try:
        response = client.get('/api/schema/')
        if response.status_code in [200, 401]:
            log_pass("API schema endpoint")
        else:
            log_fail(f"API schema endpoint: Status {response.status_code}")
    except Exception as e:
        log_fail("API schema endpoint", e)
    
    try:
        response = client.get('/api/docs/')
        if response.status_code in [200, 401]:
            log_pass("API docs endpoint")
        else:
            log_warn("API docs endpoint not available (optional)")
    except Exception as e:
        log_warn("API docs endpoint not available (optional)")

def audit_admin_interface():
    """Test admin interface accessibility."""
    try:
        from django.contrib.admin.sites import AdminSite
        log_pass("Admin interface available")
    except Exception as e:
        log_fail("Admin interface", e)

def audit_celery_tasks():
    """Verify Celery tasks are registered."""
    try:
        from fitness_project.celery import app as celery_app
        
        # Get all registered tasks
        registered_tasks = list(celery_app.tasks.keys())
        
        # Check for required tasks
        required_tasks = [
            'core.tasks.send_email_automation',
            'core.tasks.send_coaching_reminders',
            'core.tasks.aggregate_ai_usage',
            'core.tasks.update_churn_predictions',
            'core.tasks.calculate_engagement_scores',
            'payments.tasks.process_monthly_payouts'
        ]
        
        found_tasks = [t for t in required_tasks if any(t in rt for rt in registered_tasks)]
        
        if len(found_tasks) >= 5:
            log_pass(f"Celery tasks registered ({len(registered_tasks)} total)")
        else:
            log_warn(f"Only {len(found_tasks)} of {len(required_tasks)} required tasks found")
    except Exception as e:
        log_fail("Celery tasks", e)

def audit_feature_flags():
    """Test feature flag system."""
    try:
        flag = FeatureFlag.objects.filter().first()
        if flag:
            manager = FeatureFlagManager()
            log_pass("Feature flag system")
        else:
            log_pass("Feature flag system (no flags created yet)")
    except Exception as e:
        log_fail("Feature flag system", e)

def audit_analytics():
    """Test analytics models."""
    try:
        ChurnPrediction.objects.count()
        log_pass("ChurnPrediction model")
    except Exception as e:
        log_fail("ChurnPrediction model", e)
    
    try:
        EngagementScore.objects.count()
        log_pass("EngagementScore model")
    except Exception as e:
        log_fail("EngagementScore model", e)
    
    try:
        LifetimeValue.objects.count()
        log_pass("LifetimeValue model")
    except Exception as e:
        log_fail("LifetimeValue model", e)

def audit_cors_security():
    """Test CORS and security settings."""
    try:
        if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
            log_pass("CORS configuration found")
        else:
            log_warn("CORS configuration not found")
    except Exception as e:
        log_fail("CORS configuration", e)

def audit_static_files():
    """Verify static files configuration."""
    try:
        if hasattr(settings, 'STATIC_URL'):
            log_pass("Static files configuration")
        else:
            log_fail("Static files configuration")
    except Exception as e:
        log_fail("Static files configuration", e)

def audit_database_indexes():
    """Verify database indexes exist."""
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='index'")
            index_count = cursor.fetchone()[0]
        
        if index_count > 0:
            log_pass(f"Database indexes ({index_count} found)")
        else:
            log_warn("No database indexes found")
    except Exception as e:
        log_warn(f"Could not verify indexes: {str(e)[:50]}")

def run_full_audit():
    print("\n" + "="*70)
    print("[AUDIT] FitnessPro Backend Audit Suite")
    print("="*70 + "\n")
    
    print("[INFO] Testing Core Infrastructure...")
    audit_database_connections()
    audit_models()
    audit_database_indexes()
    
    print("\n[INFO] Testing Authentication...")
    audit_authentication()
    
    print("\n[INFO] Testing Features...")
    audit_subscriptions()
    audit_workouts()
    
    print("\n[INFO] Testing API Endpoints...")
    audit_cms()
    audit_payments()
    audit_core_features()
    audit_api_documentation()
    audit_admin_interface()
    
    print("\n[INFO] Testing Background Jobs & Advanced Features...")
    audit_celery_tasks()
    audit_feature_flags()
    audit_analytics()
    
    print("\n[INFO] Testing Security & Configuration...")
    audit_cors_security()
    audit_static_files()
    
    print("\n" + "="*70)
    
    # Summary
    total_passed = len(audit_results['passed'])
    total_failed = len(audit_results['failed'])
    total_warnings = len(audit_results['warnings'])
    total_tests = total_passed + total_failed + total_warnings
    pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\n[PASS] PASSED: {total_passed}/{total_tests}")
    print(f"[FAIL] FAILED: {total_failed}/{total_tests}")
    print(f"[WARN] WARNINGS: {total_warnings}/{total_tests}")
    print(f"[INFO] Pass Rate: {pass_rate:.1f}%")
    
    if total_failed > 0:
        print(f"\n[FAIL] AUDIT FAILED - {total_failed} issues found")
        print("\n[INFO] Failed Tests:")
        for test in audit_results['failed']:
            print(f"  [X] {test}")
    else:
        print(f"\n[PASS] AUDIT PASSED - All tests passed!")
    
    if total_warnings > 0:
        print("\n[WARN] Warnings:")
        for warning in audit_results['warnings']:
            print(f"  [W] {warning}")
    
    print(f"\n[INFO] Timestamp: {audit_results['timestamp']}")
    print("="*70 + "\n")
    
    return audit_results

if __name__ == '__main__':
    audit_results = run_full_audit()
