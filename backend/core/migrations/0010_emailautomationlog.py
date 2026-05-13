from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0009_supportticket_triage_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailAutomationLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('automation_key', models.CharField(max_length=80)),
                ('recipient_email', models.EmailField(max_length=254)),
                ('recipient_name', models.CharField(blank=True, max_length=200)),
                ('reference_date', models.DateField()),
                ('payload', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('automation_key', 'recipient_email', 'reference_date')},
            },
        ),
    ]