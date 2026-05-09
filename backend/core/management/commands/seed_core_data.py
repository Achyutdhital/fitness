from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta


class Command(BaseCommand):
    help = 'Seed achievements, challenges, and sample coupons'

    def handle(self, *args, **options):
        self.seed_achievements()
        self.seed_challenges()
        self.seed_coupons()
        self.stdout.write(self.style.SUCCESS('Core data seeded successfully!'))

    def seed_achievements(self):
        from core.models import Achievement
        achievements = [
            ('First Step', 'Complete your very first workout', '🎯', 10, 'first_workout', 1),
            ('Getting Started', 'Complete 5 workouts', '💪', 25, 'workouts_completed', 5),
            ('On a Roll', 'Complete 10 workouts', '🔥', 50, 'workouts_completed', 10),
            ('Dedicated', 'Complete 25 workouts', '⚡', 100, 'workouts_completed', 25),
            ('Centurion', 'Complete 100 workouts', '🏆', 500, 'workouts_completed', 100),
            ('3-Day Streak', 'Work out 3 days in a row', '📅', 20, 'streak_days', 3),
            ('Week Warrior', 'Work out 7 days in a row', '🗓️', 75, 'streak_days', 7),
            ('Two Week Titan', 'Work out 14 days in a row', '💎', 150, 'streak_days', 14),
            ('Monthly Master', 'Work out 30 days in a row', '👑', 300, 'streak_days', 30),
            ('Calorie Crusher', 'Burn 1,000 calories total', '🔥', 50, 'calories_burned', 1000),
            ('Fat Burner', 'Burn 5,000 calories total', '💥', 150, 'calories_burned', 5000),
            ('Inferno', 'Burn 10,000 calories total', '🌋', 300, 'calories_burned', 10000),
            ('Reviewer', 'Write your first workout review', '⭐', 15, 'reviews_written', 1),
            ('Critic', 'Write 5 workout reviews', '📝', 40, 'reviews_written', 5),
            ('Supporter', 'Make your first payment', '💳', 20, 'first_payment', 1),
            ('Profile Pro', 'Complete your profile', '👤', 15, 'profile_complete', 1),
            ('Hour Club', 'Train for 60 minutes total', '⏱️', 30, 'minutes_trained', 60),
            ('Iron Hour', 'Train for 600 minutes total', '🏋️', 100, 'minutes_trained', 600),
            ('Time Lord', 'Train for 3,000 minutes total', '⌛', 250, 'minutes_trained', 3000),
        ]
        for name, desc, icon, points, req_type, req_val in achievements:
            Achievement.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'icon': icon,
                    'points': points,
                    'requirement_type': req_type,
                    'requirement_value': req_val,
                    'is_active': True,
                }
            )
        self.stdout.write(f'  Seeded {len(achievements)} achievements')

    def seed_challenges(self):
        from core.models import Challenge
        now = timezone.now()
        challenges = [
            ('7-Day Workout Challenge', 'Complete 7 workouts in 7 days and earn bonus points!', '🏅', 'workouts', 7, 100, now, now + timedelta(days=7)),
            ('Calorie Burn Blitz', 'Burn 2,000 calories this week to claim your reward.', '🔥', 'calories', 2000, 75, now, now + timedelta(days=7)),
            ('30-Day Consistency', 'Work out every day for 30 days. The ultimate test.', '👑', 'streak', 30, 500, now, now + timedelta(days=30)),
            ('Weekend Warrior', 'Complete 4 workouts this weekend.', '⚡', 'workouts', 4, 50, now, now + timedelta(days=2)),
            ('Monthly Mover', 'Log 1,000 minutes of training this month.', '⏱️', 'minutes', 1000, 200, now, now + timedelta(days=30)),
        ]
        for title, desc, icon, goal_type, goal_val, reward, start, end in challenges:
            Challenge.objects.get_or_create(
                title=title,
                defaults={
                    'description': desc,
                    'icon': icon,
                    'goal_type': goal_type,
                    'goal_value': goal_val,
                    'reward_points': reward,
                    'start_date': start,
                    'end_date': end,
                    'is_active': True,
                }
            )
        self.stdout.write(f'  Seeded {len(challenges)} challenges')

    def seed_coupons(self):
        from core.models import Coupon
        now = timezone.now()
        coupons = [
            ('WELCOME20', 'Welcome discount for new members', 'percentage', 20, now, now + timedelta(days=365), 1000),
            ('SAVE10', '$10 off any plan', 'fixed', 10, now, now + timedelta(days=90), 500),
            ('HALFOFF', '50% off your first month', 'percentage', 50, now, now + timedelta(days=30), 100),
            ('FRIEND15', 'Referral reward — 15% off', 'percentage', 15, now, now + timedelta(days=180), None),
        ]
        for code, desc, dtype, dval, vfrom, vuntil, max_uses in coupons:
            Coupon.objects.get_or_create(
                code=code,
                defaults={
                    'description': desc,
                    'discount_type': dtype,
                    'discount_value': dval,
                    'valid_from': vfrom,
                    'valid_until': vuntil,
                    'max_uses': max_uses,
                    'is_active': True,
                }
            )
        self.stdout.write(f'  Seeded {len(coupons)} coupons')
