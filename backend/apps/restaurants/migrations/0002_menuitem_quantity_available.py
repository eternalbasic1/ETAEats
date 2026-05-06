from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='menuitem',
            name='quantity_available',
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
