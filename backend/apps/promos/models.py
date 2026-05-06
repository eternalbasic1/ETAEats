"""
Promo code domain.

PromoCode  — the code definition (discount type, value, validity, limits)
PromoRedemption — one row per successful use, enforces per-user uniqueness
"""
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from apps.accounts.models import TimeStampedModel


class DiscountType(models.TextChoices):
    PERCENT = 'PERCENT', 'Percentage'
    FLAT = 'FLAT', 'Flat Amount'


class PromoCode(TimeStampedModel):
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=10, choices=DiscountType.choices)
    discount_value = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    # Optional: minimum cart total required to apply this code
    min_order_value = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0'))],
    )
    # Optional: cap on discount for PERCENT codes (e.g. max ₹100 off)
    max_discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    # null = global (any restaurant); set = specific restaurant only
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='promo_codes',
    )
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    # null = unlimited total uses
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    # Incremented atomically on each redemption
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Promo Code'
        verbose_name_plural = 'Promo Codes'
        indexes = [
            models.Index(fields=['is_active', 'valid_from', 'valid_until']),
        ]

    def __str__(self) -> str:
        return f'{self.code} ({self.discount_type} {self.discount_value})'

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def is_valid_now(self) -> bool:
        now = timezone.now()
        return self.is_active and self.valid_from <= now <= self.valid_until

    def has_uses_remaining(self) -> bool:
        if self.max_uses is None:
            return True
        return self.used_count < self.max_uses

    def calculate_discount(self, cart_total: Decimal) -> Decimal:
        """Return the rupee discount amount for the given cart total."""
        if self.discount_type == DiscountType.PERCENT:
            discount = (cart_total * self.discount_value / Decimal('100')).quantize(Decimal('0.01'))
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
        else:
            discount = self.discount_value
        # Discount cannot exceed the cart total
        return min(discount, cart_total)


class PromoRedemption(TimeStampedModel):
    promo_code = models.ForeignKey(
        PromoCode,
        on_delete=models.PROTECT,
        related_name='redemptions',
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='promo_redemptions',
    )
    # Set after the order is created at checkout
    order = models.OneToOneField(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='promo_redemption',
    )
    discount_applied = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = 'Promo Redemption'
        verbose_name_plural = 'Promo Redemptions'
        # Each user can redeem a given code only once
        unique_together = ('promo_code', 'user')

    def __str__(self) -> str:
        return f'{self.user} used {self.promo_code.code} (₹{self.discount_applied} off)'
