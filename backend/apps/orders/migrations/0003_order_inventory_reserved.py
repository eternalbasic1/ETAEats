from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0002_order_promo_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='inventory_reserved',
            field=models.BooleanField(default=False),
        ),
    ]
