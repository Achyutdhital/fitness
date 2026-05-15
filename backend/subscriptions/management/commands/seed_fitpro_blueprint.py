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
                'name': 'basic',
                'description': 'Affordable starter paid tier with full core content and no live coaching.',
                'features': ['Full workout library', 'Standard meal plans', 'Progress tracking'],
                'sessions_per_week': 0,
                'video_sessions_per_month': 0,
                'priority': 2,
            },
            {
                'name': 'pro',
                'description': 'AI coach, AI meal planner, weekly ML adaptation, no live sessions.',
                'features': ['AI coach', 'AI meal planner', 'Weekly adaptation'],
                'sessions_per_week': 0,
                'priority': 3,
            },
            {
                'name': 'elite',
                'description': 'Pro + assigned trainer, 1x45 min session/month, 10 msgs/week.',
                'features': ['Assigned trainer', '1 session/month', '10 trainer messages/week', 'Video calls'],
                'sessions_per_week': 1,
                'video_sessions_per_month': 1,
                'priority': 4,
            },
            {
                'name': 'custom',
                'description': 'Elite base + extra session add-ons. Trainer 80%, platform 20%.',
                'features': ['Elite features', 'Extra sessions add-on', 'Priority support'],
                'sessions_per_week': 4,
                'priority': 5,
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
                    'video_sessions_per_month': t.get('video_sessions_per_month', 0),
                    'priority': t['priority'],
                }
            )
            tier_map[t['name']] = tier

        plans = [
            # Free
            ('free', 'Starter Free', 0.00, 'monthly', 30, 1),

            # Basic
            ('basic', 'Basic Monthly', 9.99, 'monthly', 30, 5),
            ('basic', 'Basic Quarterly', 26.97, 'quarterly', 90, 6), # 10% discount
            ('basic', 'Basic Yearly', 95.90, 'yearly', 365, 7), # 20% discount
            
            # Pro
            ('pro', 'Pro Monthly', 24.99, 'monthly', 30, 10),
            ('pro', 'Pro Quarterly', 67.47, 'quarterly', 90, 11), # 10% discount (24.99 * 3 * 0.9)
            ('pro', 'Pro Yearly', 239.90, 'yearly', 365, 12),    # 20% discount (24.99 * 12 * 0.8)

            # Elite (Standard)
            ('elite', 'Elite Standard Monthly', 99.00, 'monthly', 30, 20),
            ('elite', 'Elite Standard Quarterly', 267.30, 'quarterly', 90, 21), # 10% discount
            ('elite', 'Elite Standard Yearly', 950.40, 'yearly', 365, 22),    # 20% discount

            # Elite (Pro)
            ('elite', 'Elite Pro Monthly', 149.00, 'monthly', 30, 23),
            ('elite', 'Elite Pro Quarterly', 402.30, 'quarterly', 90, 24),
            ('elite', 'Elite Pro Yearly', 1430.40, 'yearly', 365, 25),

            # Elite (Specialist)
            ('elite', 'Elite Specialist Monthly', 199.00, 'monthly', 30, 26),
            ('elite', 'Elite Specialist Quarterly', 537.30, 'quarterly', 90, 27),
            ('elite', 'Elite Specialist Yearly', 1910.40, 'yearly', 365, 28),

            # Custom (Base)
            ('custom', 'Custom Elite Plus Monthly', 419.00, 'monthly', 30, 30),
            ('custom', 'Custom Elite Plus Quarterly', 1131.30, 'quarterly', 90, 31),
            ('custom', 'Custom Elite Plus Yearly', 4022.40, 'yearly', 365, 32),
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
