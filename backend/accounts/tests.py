from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from .models import UserProfile
from core.models import BodyMeasurement

User = get_user_model()


class DashboardStatsTestCase(TestCase):
    """Verify dashboard stats include derived Phase 4 insights."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='dashboarduser',
            email='dashboard@example.com',
            password='testpass123',
            fitness_goal='gain_muscle',
        )
        self.client.force_authenticate(user=self.user)
        UserProfile.objects.get_or_create(user=self.user)

        BodyMeasurement.objects.create(user=self.user, date='2026-05-10', weight=90.0)
        BodyMeasurement.objects.create(user=self.user, date='2026-05-12', weight=91.5)

    def test_dashboard_stats_returns_insights(self):
        response = self.client.get('/api/auth/user/dashboard_stats/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('insight_cards', response.data)
        self.assertIn('weekly_completion_rate', response.data)
        self.assertIn('next_best_action', response.data)
        self.assertIn('weight_trend', response.data)
        self.assertEqual(len(response.data['insight_cards']), 3)
        self.assertEqual(response.data['weight_trend'], 1.5)
        self.assertEqual(response.data['weekly_completion_rate'], 0)
