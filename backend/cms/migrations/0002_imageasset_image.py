from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cms', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='imageasset',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='cms_assets/'),
        ),
        migrations.AlterField(
            model_name='imageasset',
            name='image_url',
            field=models.URLField(blank=True),
        ),
    ]
