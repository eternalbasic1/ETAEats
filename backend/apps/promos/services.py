"""
Promo code validation and redemption logic.
Checkout uses select_for_update; preview validate never locks.
"""
from __future__ import annotations

from decimal import Decimal

from django.utils import timezone

from apps.accounts.exceptions import DomainError
from apps.accounts.models import User

from .models import PromoCode, PromoRedemption


def check_promo_eligibility(
    promo: PromoCode,
    *,
    cart_total: Decimal,
    user: User,
    restaurant_id: int | None,
) -> None:
    """Raises DomainError if this promo cannot be applied to the cart."""
    if not promo.is_active:
        raise DomainError('This promo code is no longer active.', code='promo_inactive')

    now = timezone.now()
    if now < promo.valid_from:
        raise DomainError('This promo code is not yet valid.', code='promo_not_started')
    if now > promo.valid_until:
        raise DomainError('This promo code has expired.', code='promo_expired')

    if not promo.has_uses_remaining():
        raise DomainError('This promo code has reached its usage limit.', code='promo_exhausted')

    if promo.restaurant_id is not None:
        if restaurant_id is None or promo.restaurant_id != restaurant_id:
            raise DomainError(
                'This promo code is not valid for this restaurant.',
                code='promo_restaurant_mismatch',
            )

    if promo.min_order_value is not None and cart_total < promo.min_order_value:
        raise DomainError(
            f'Minimum order value of ₹{promo.min_order_value} required for this code.',
            code='promo_min_order',
        )

    if PromoRedemption.objects.filter(promo_code=promo, user=user).exists():
        raise DomainError(
            'You have already used this promo code.',
            code='promo_already_used',
        )


def validate_promo_preview(
    *,
    code: str,
    cart_total: Decimal,
    user: User,
    restaurant_id: int | None = None,
) -> dict:
    """
    Validate a promo code without redeeming it.
    Always returns: valid, discount_amount, final_total, message (HTTP 200 body).
    """
    final_total_str = str(cart_total)
    normalized = code.upper().strip()
    if not normalized:
        return {
            'valid': False,
            'discount_amount': '0.00',
            'final_total': final_total_str,
            'message': 'Please enter a promo code.',
        }
    try:
        promo = PromoCode.objects.get(code=normalized)
    except PromoCode.DoesNotExist:
        return {
            'valid': False,
            'discount_amount': '0.00',
            'final_total': final_total_str,
            'message': 'Invalid promo code.',
        }
    try:
        check_promo_eligibility(
            promo,
            cart_total=cart_total,
            user=user,
            restaurant_id=restaurant_id,
        )
    except DomainError as exc:
        return {
            'valid': False,
            'discount_amount': '0.00',
            'final_total': final_total_str,
            'message': exc.message,
        }

    discount_amount = promo.calculate_discount(cart_total)
    final_total = cart_total - discount_amount
    return {
        'valid': True,
        'discount_amount': str(discount_amount),
        'final_total': str(final_total),
        'message': f'Code applied! You save ₹{discount_amount:.0f}.',
    }
