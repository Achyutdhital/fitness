from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from datetime import date, timedelta


@receiver(post_save, sender='workouts.UserWorkoutProgress')
def handle_workout_completed(sender, instance, created, **kwargs):
    if not instance.completed:
        return

    from core.models import UserPoints, Achievement, UserAchievement, Notification

    points_obj, _ = UserPoints.objects.get_or_create(user=instance.user)

    # ── Streak logic ──────────────────────────────────────────────────────────
    today = date.today()
    last = points_obj.last_workout_date

    if last is None or last < today:
        if last == today - timedelta(days=1):
            points_obj.streak_days += 1
        elif last != today:
            points_obj.streak_days = 1

        points_obj.last_workout_date = today
        if points_obj.streak_days > points_obj.longest_streak:
            points_obj.longest_streak = points_obj.streak_days

    # ── Award points ──────────────────────────────────────────────────────────
    points_obj.total_points += 10
    points_obj.recalculate_level()
    points_obj.save()

    # ── Check achievements ────────────────────────────────────────────────────
    completed_count = instance.user.workout_progress.filter(completed=True).count()
    total_calories = instance.user.workout_progress.filter(completed=True).aggregate(
        t=__import__('django.db.models', fromlist=['Sum']).Sum('calories_burnt')
    )['t'] or 0

    achievements = Achievement.objects.filter(is_active=True)
    for ach in achievements:
        if UserAchievement.objects.filter(user=instance.user, achievement=ach).exists():
            continue

        earned = False
        if ach.requirement_type == 'first_workout' and completed_count >= 1:
            earned = True
        elif ach.requirement_type == 'workouts_completed' and completed_count >= ach.requirement_value:
            earned = True
        elif ach.requirement_type == 'streak_days' and points_obj.streak_days >= ach.requirement_value:
            earned = True
        elif ach.requirement_type == 'calories_burned' and total_calories >= ach.requirement_value:
            earned = True

        if earned:
            UserAchievement.objects.create(user=instance.user, achievement=ach)
            points_obj.total_points += ach.points
            points_obj.recalculate_level()
            points_obj.save()
            Notification.objects.create(
                user=instance.user,
                title=f'Achievement Unlocked: {ach.name}',
                message=f'You earned {ach.points} points! {ach.description}',
                notification_type='achievement',
                icon=ach.icon,
                action_url='/dashboard',
            )


@receiver(post_save, sender='accounts.CustomUser')
def create_user_points(sender, instance, created, **kwargs):
    if created:
        from core.models import UserPoints, Referral
        import random, string
        UserPoints.objects.get_or_create(user=instance)
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        Referral.objects.get_or_create(
            referrer=instance,
            defaults={'referral_code': code}
        )
