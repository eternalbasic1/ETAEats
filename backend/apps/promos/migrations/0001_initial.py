# Generated manually for promos app

import django.core.validators
import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('orders', '0001_initial'),
        ('restaurants', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PromoCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('code', models.CharField(max_length=50, unique=True)),
                ('discount_type', models.CharField(choices=[('PERCENT', 'Percentage'), ('FLAT', 'Flat Amount')], max_length=10)),
                ('discount_value', models.DecimalField(decimal_places=2, max_digits=8, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('min_order_value', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(Decimal('0'))])),
                ('max_discount_amount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, validators=[django.core.validators.MinValueValidator(Decimal('0.01'))])),
                ('valid_from', models.DateTimeField()),
                ('valid_until', models.DateTimeField()),
                ('max_uses', models.PositiveIntegerField(blank=True, null=True)),
                ('used_count', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('restaurant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='promo_codes', to='restaurants.restaurant')),
            ],
            options={
                'verbose_name': 'Promo Code',
                'verbose_name_plural': 'Promo Codes',
            },
        ),
        migrations.CreateModel(
            name='PromoRedemption',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('discount_applied', models.DecimalField(decimal_places=2, max_digits=10)),
                ('order', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='promo_redemption', to='orders.order')),
                ('promo_code', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='redemptions', to='promos.promocode')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='promo_redemptions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Promo Redemption',
                'verbose_name_plural': 'Promo Redemptions',
                'unique_together': {('promo_code', 'user')},
            },
        ),
        migrations.AddIndex(
            model_name='promocode',
            index=models.Index(fields=['is_active', 'valid_from', 'valid_until'], name='promos_promo_is_acti_idx'),
        ),
    ]
