from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_coachpayout'),
    ]

    operations = [
        migrations.AddField(
            model_name='supportticket',
            name='category',
            field=models.CharField(choices=[('general', 'General'), ('account', 'Account Access'), ('billing', 'Billing & Payments'), ('technical', 'Technical Issue'), ('coaching', 'Coaching & Sessions'), ('cancellation', 'Cancellation'), ('feedback', 'Feedback / Feature Request')], default='general', max_length=30),
        ),
        migrations.AddField(
            model_name='supportticket',
            name='triaged_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name='supportticket',
            index=models.Index(fields=['status', 'priority', 'created_at'], name='core_suppor_status_b56a31_idx'),
        ),
        migrations.AddIndex(
            model_name='supportticket',
            index=models.Index(fields=['category', 'created_at'], name='core_suppor_category_0d3f0b_idx'),
        ),
    ]