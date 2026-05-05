"""
Cart + Order services. All mutations go through here so invariants
(single-restaurant cart, legal status transitions, price snapshots) hold.
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import Iterable, Optional

from django.db import IntegrityError, transaction
from django.db.models import F
from django.utils import timezone

from apps.accounts.exceptions import DomainError
from apps.accounts.models import User
from apps.fleet.models import Bus
from apps.restaurants.models import MenuItem, Restaurant

from .models import (
    ALLOWED_STATUS_TRANSITIONS,
    Cart,
    CartItem,
    Order,
    OrderItem,
    OrderStatus,
    PaymentStatus,
)

logger = logging.getLogger(__name__)


# ---------- Cart ---------------------------------------------------------

def clear_cart_context_if_empty(cart: Cart) -> None:
    """
    If a cart has no items, clear pinned restaurant/bus context so a new scan
    can start with a clean restaurant without false mismatch errors.
    """
    if cart.items.exists():
        return
    update_fields = []
    if cart.restaurant_id is not None:
        cart.restaurant = None
        update_fields.append('restaurant')
    if cart.bus_id is not None:
        cart.bus = None
        update_fields.append('bus')
    if update_fields:
        cart.save(update_fields=update_fields)

def get_or_create_cart(
    *,
    user: Optional[User] = None,
    session_key: str = '',
    bus: Optional[Bus] = None,
    restaurant: Optional[Restaurant] = None,
) -> Cart:
    if user and user.is_authenticated:
        cart, _ = Cart.objects.get_or_create(
            user=user,
            defaults={'bus': bus, 'restaurant': restaurant},
        )
        return cart
    if not session_key:
        raise DomainError('Session key required for anonymous cart.', code='session_required')
    cart, _ = Cart.objects.get_or_create(
        session_key=session_key,
        user__isnull=True,
        defaults={'bus': bus, 'restaurant': restaurant},
    )
    return cart


@transaction.atomic
def add_item(cart: Cart, menu_item: MenuItem, quantity: int = 1) -> CartItem:
    if quantity < 1:
        raise DomainError('Quantity must be at least 1.', code='invalid_quantity')
    if not menu_item.is_available or menu_item.deleted_at:
        raise DomainError('Item is unavailable.', code='item_unavailable')
    if menu_item.quantity_available is not None and menu_item.quantity_available == 0:
        raise DomainError('Item is unavailable.', code='item_unavailable')

    # If previous operations emptied this cart, drop stale bus/restaurant pins.
    clear_cart_context_if_empty(cart)

    if cart.restaurant_id and cart.restaurant_id != menu_item.restaurant_id:
        raise DomainError(
            'Cart already contains items from a different restaurant.',
            code='restaurant_mismatch',
        )
    if cart.restaurant_id is None:
        cart.restaurant = menu_item.restaurant
        cart.save(update_fields=['restaurant'])

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        menu_item=menu_item,
        defaults={'quantity': quantity},
    )
    if not created:
        item.quantity += quantity
        item.save(update_fields=['quantity'])
    return item


@transaction.atomic
def update_item_quantity(item: CartItem, quantity: int) -> Optional[CartItem]:
    if quantity <= 0:
        cart = item.cart
        item.delete()
        clear_cart_context_if_empty(cart)
        return None
    item.quantity = quantity
    item.save(update_fields=['quantity'])
    return item


@transaction.atomic
def merge_anonymous_cart_into_user(session_key: str, user: User) -> Optional[Cart]:
    """Called after OTP verify. Moves anon cart items into the user's cart."""
    anon = Cart.objects.filter(session_key=session_key, user__isnull=True).first()
    if not anon:
        return None
    user_cart, _ = Cart.objects.get_or_create(user=user, defaults={
        'bus': anon.bus, 'restaurant': anon.restaurant,
    })
    for item in anon.items.all():
        existing = CartItem.objects.filter(cart=user_cart, menu_item=item.menu_item).first()
        if existing:
            existing.quantity += item.quantity
            existing.save(update_fields=['quantity'])
        else:
            CartItem.objects.create(
                cart=user_cart,
                menu_item=item.menu_item,
                quantity=item.quantity,
            )
    anon.delete()
    return user_cart


def cart_total(cart: Cart) -> Decimal:
    total = Decimal('0.00')
    for item in cart.items.select_related('menu_item'):
        total += item.menu_item.price * item.quantity
    return total


# ---------- Order --------------------------------------------------------

@transaction.atomic
def checkout(cart: Cart, *, user: User, bus: Bus, promo_code: str = '') -> Order:
    from apps.promos.models import PromoCode, PromoRedemption
    from apps.promos.services import check_promo_eligibility

    items: Iterable[CartItem] = list(cart.items.select_related('menu_item'))
    if not items:
        raise DomainError('Cart is empty.', code='cart_empty')
    if cart.restaurant_id is None:
        raise DomainError('Cart has no restaurant.', code='cart_no_restaurant')

    total = sum((i.menu_item.price * i.quantity for i in items), start=Decimal('0.00'))

    normalized_promo = (promo_code or '').upper().strip()
    discount = Decimal('0.00')
    payable = total
    promo_locked: PromoCode | None = None

    if normalized_promo:
        try:
            promo_locked = PromoCode.objects.select_for_update().get(code=normalized_promo)
        except PromoCode.DoesNotExist:
            raise DomainError('Invalid promo code.', code='promo_invalid')

        check_promo_eligibility(
            promo_locked,
            cart_total=total,
            user=user,
            restaurant_id=cart.restaurant_id,
        )
        discount = promo_locked.calculate_discount(total)
        payable = total - discount

    order = Order.objects.create(
        passenger=user,
        bus=bus,
        restaurant=cart.restaurant,
        total_amount=payable,
        promo_code=normalized_promo if normalized_promo else '',
        discount_amount=discount,
    )
    OrderItem.objects.bulk_create([
        OrderItem(
            order=order,
            menu_item=i.menu_item,
            menu_item_name=i.menu_item.name,
            quantity=i.quantity,
            unit_price=i.menu_item.price,
        )
        for i in items
    ])

    if promo_locked is not None:
        try:
            PromoRedemption.objects.create(
                promo_code=promo_locked,
                user=user,
                order=order,
                discount_applied=discount,
            )
        except IntegrityError:
            raise DomainError(
                'You have already used this promo code.',
                code='promo_already_used',
            )
        PromoCode.objects.filter(pk=promo_locked.pk).update(used_count=F('used_count') + 1)

    # Clear the cart after checkout
    cart.items.all().delete()
    clear_cart_context_if_empty(cart)
    return order


@transaction.atomic
def advance_status(order: Order, new_status: str, *, reason: str = '') -> Order:
    """Validate the status transition and stamp the relevant timestamp."""
    current = order.status
    allowed = ALLOWED_STATUS_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        raise DomainError(
            f'Cannot transition from {current} to {new_status}.',
            code='invalid_transition',
            details={'from': current, 'to': new_status, 'allowed': sorted(allowed)},
        )

    now = timezone.now()
    update_fields = ['status', 'updated_at']
    order.status = new_status
    if new_status == OrderStatus.CONFIRMED:
        order.confirmed_at = now
        update_fields.append('confirmed_at')
        _deduct_stock_for_order(order)
    elif new_status == OrderStatus.READY:
        order.ready_at = now
        update_fields.append('ready_at')
    elif new_status == OrderStatus.PICKED_UP:
        order.picked_up_at = now
        update_fields.append('picked_up_at')
    elif new_status == OrderStatus.CANCELLED:
        order.cancelled_reason = reason[:255]
        update_fields.append('cancelled_reason')

    order.save(update_fields=update_fields)
    return order


def _deduct_stock_for_order(order: Order) -> None:
    """
    Lock and deduct stock for all finite-stock items in the order.
    Must be called from within an existing atomic transaction.
    """
    order_items = list(order.items.select_related('menu_item'))
    finite_item_ids = [
        oi.menu_item_id
        for oi in order_items
        if oi.menu_item.quantity_available is not None
    ]
    if not finite_item_ids:
        return

    locked = {
        mi.pk: mi
        for mi in MenuItem.objects.select_for_update().filter(pk__in=finite_item_ids)
    }

    to_update: list[MenuItem] = []
    for oi in order_items:
        mi = locked.get(oi.menu_item_id)
        if mi is None or mi.quantity_available is None:
            continue
        new_qty = max(0, mi.quantity_available - oi.quantity)
        mi.quantity_available = new_qty
        if new_qty == 0:
            mi.is_available = False
        to_update.append(mi)

    if to_update:
        MenuItem.objects.bulk_update(to_update, ['quantity_available', 'is_available'])


def mark_payment(order: Order, *, status: str, razorpay_payment_id: str = '') -> Order:
    order.payment_status = status
    if razorpay_payment_id:
        order.razorpay_payment_id = razorpay_payment_id
    order.save(update_fields=['payment_status', 'razorpay_payment_id', 'updated_at'])
    if status == PaymentStatus.CAPTURED and order.status == OrderStatus.PENDING:
        advance_status(order, OrderStatus.CONFIRMED)
    return order
