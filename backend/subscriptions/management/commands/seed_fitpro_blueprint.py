from django.core.management.base import BaseCommand
from subscriptions.models import SubscriptionTier, SubscriptionPlan


class Command(BaseCommand):
    help = 'Seed FitPro blueprint tiers/plans from product spec HTML'

    def handle(self, *args, **options):
        tiers = [
            {
                'name': 'free',
                'description': 'Points economy, ad-supported, beginner plans only, basic BMI.',
                'features': ['Points rewards', 'Beginner workouts', 'Basic BMI'],
                'sessions_per_week': 0,
                'priority': 1,
            },
            {
                'name': 'pro',
                'description': 'AI coach, AI meal planner, weekly ML adaptation, no live sessions.',
                'features': ['AI coach', 'AI meal planner', 'Weekly adaptation'],
                'sessions_per_week': 0,
                'priority': 2,
            },
            {
                'name': 'elite',
                'description': 'Pro + assigned trainer, 2x30 min sessions/month, 10 msgs/week.',
                'features': ['Assigned trainer', '2 sessions/month', '10 trainer messages/week', 'Video calls'],
                'sessions_per_week': 1,
                'priority': 3,
            },
            {
                'name': 'custom',
                'description': 'Elite base + extra session add-ons. Trainer 80%, platform 20%.',
                'features': ['Elite features', 'Extra sessions add-on', 'Priority support'],
                'sessions_per_week': 4,
                'priority': 4,
            },
        ]

        tier_map = {}
        for t in tiers:
            tier, _ = SubscriptionTier.objects.update_or_create(
                name=t['name'],
                defaults={
                    'description': t['description'],
                    'features': t['features'],
                    'sessions_per_week': t['sessions_per_week'],
                    'priority': t['priority'],
                }
            )
            tier_map[t['name']] = tier

        plans = [
            ('free', 'Starter Free', 0.00, 'monthly', 30, 1),
            ('pro', 'Pro Monthly', 24.99, 'monthly', 30, 10),
            ('elite', 'Elite Standard Monthly', 99.00, 'monthly', 30, 20),
            ('elite', 'Elite Pro Monthly', 149.00, 'monthly', 30, 21),
            ('elite', 'Elite Specialist Monthly', 199.00, 'monthly', 30, 22),
            ('custom', 'Custom Elite Plus', 419.00, 'monthly', 30, 30),
        ]

        for tier_name, name, price, cycle, duration, priority in plans:
            SubscriptionPlan.objects.update_or_create(
                name=name,
                defaults={
                    'tier': tier_map[tier_name],
                    'price': price,
                    'billing_cycle': cycle,
                    'duration_days': duration,
                    'is_active': True,
                    'priority': priority,
                }
            )

        self.stdout.write(self.style.SUCCESS('FitPro blueprint tiers and plans seeded successfully.'))
