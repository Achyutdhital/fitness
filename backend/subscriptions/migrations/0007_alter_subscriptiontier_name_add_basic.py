from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0006_subscriptiontier_custom_hourly_rate'),
    ]

    operations = [
        migrations.AlterField(
            model_name='subscriptiontier',
            name='name',
            field=models.CharField(
                choices=[
                    ('free', 'Free'),
                    ('basic', 'Basic'),
                    ('pro', 'Pro'),
                    ('elite', 'Elite'),
                    ('custom', 'Custom'),
                ],
                max_length=20,
                unique=True,
            ),
        ),
    ]
