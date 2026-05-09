from django.db.models.signals import post_save
from django.dispatch import receiver
from accounts.models import CustomUser, UserProfile, UserSubscription


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Create user profile when user is created"""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=CustomUser)
def create_user_subscription(sender, instance, created, **kwargs):
    """Create default trial subscription for new user"""
    if created:
        try:
            from subscriptions.models import SubscriptionPlan
            trial_plan = SubscriptionPlan.objects.filter(name='Trial').first()
            if trial_plan:
                UserSubscription.objects.get_or_create(
                    user=instance,
                    defaults={
                        'subscription_plan': trial_plan,
                        'status': 'trial'
                    }
                )
        except:
            pass
