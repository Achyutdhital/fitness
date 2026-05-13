# Generated data migration to remove flex and basic tiers

from django.db import migrations


def remove_old_tiers(apps, schema_editor):
    """Remove flex and basic tiers from database"""
    SubscriptionTier = apps.get_model('subscriptions', 'SubscriptionTier')
    SubscriptionTier.objects.filter(name__in=['flex', 'basic']).delete()


def noop(apps, schema_editor):
    """Reverse migration - this is destructive so we don't reverse it"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0004_subscriptiontier_video_sessions_per_month'),
    ]

    operations = [
        migrations.RunPython(remove_old_tiers, noop),
    ]
