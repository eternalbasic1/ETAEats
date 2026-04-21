"""
Razorpay orchestration: create Razorpay order, verify checkout signature,
verify webhook signatures, and reconcile payment state with Order.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.accounts.exceptions import DomainError
from apps.orders import services as order_services
from apps.orders.models import Order, PaymentStatus

from .models import WebhookEvent

logger = logging.getLogger(__name__)


def _razorpay_client():
    import razorpay
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


@transaction.atomic
def create_razorpay_order(order: Order) -> dict:
    """Create a Razorpay order and cache its id on our Order row."""
    client = _razorpay_client()
    amount_paise = int((order.total_amount * Decimal('100')).to_integral_value())
    rp_order = client.order.create({
        'amount': amount_paise,
        'currency': 'INR',
        'receipt': str(order.id),
        'notes': {'order_id': str(order.id)},
    })
    order.razorpay_order_id = rp_order['id']
    order.save(update_fields=['razorpay_order_id', 'updated_at'])
    return {
        'razorpay_order_id': rp_order['id'],
        'amount': amount_paise,
        'currency': 'INR',
        'key_id': settings.RAZORPAY_KEY_ID,
    }


def verify_checkout_signature(
    *,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """Client-side confirmation path: HMAC(order_id|payment_id, key_secret)."""
    expected_payload = f'{razorpay_order_id}|{razorpay_payment_id}'.encode()
    expected_sig = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        expected_payload,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected_sig, razorpay_signature)


def verify_webhook_signature(raw_body: bytes, signature_header: str) -> bool:
    expected = hmac.new(
        settings.RAZORPAY_WEBHOOK_SECRET.encode(),
        raw_body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature_header)


@transaction.atomic
def confirm_from_client(
    order: Order,
    *,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> Order:
    if order.razorpay_order_id != razorpay_order_id:
        raise DomainError('Razorpay order id mismatch.', code='rp_mismatch')
    if not verify_checkout_signature(
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
        razorpay_signature=razorpay_signature,
    ):
        raise DomainError('Invalid payment signature.', code='rp_bad_signature')
    return order_services.mark_payment(
        order,
        status=PaymentStatus.CAPTURED,
        razorpay_payment_id=razorpay_payment_id,
    )


@transaction.atomic
def process_webhook(raw_body: bytes, signature_header: str, event: dict) -> WebhookEvent:
    """
    Idempotent webhook ingest. Stores the raw event, verifies signature, then
    reconciles the target Order by razorpay_order_id.
    """
    event_id = event.get('id') or event.get('payload', {}).get('payment', {}).get('entity', {}).get('id')
    event_type = event.get('event', '')
    if not event_id:
        raise DomainError('Webhook missing event id.', code='webhook_no_id')

    existing = WebhookEvent.objects.filter(event_id=event_id).first()
    if existing:
        return existing  # idempotent

    valid = verify_webhook_signature(raw_body, signature_header)
    entity = event.get('payload', {}).get('payment', {}).get('entity', {})
    rp_order_id = entity.get('order_id')
    order = Order.objects.filter(razorpay_order_id=rp_order_id).first() if rp_order_id else None

    record = WebhookEvent.objects.create(
        provider='razorpay',
        event_id=event_id,
        event_type=event_type,
        order=order,
        payload=event,
        signature_valid=valid,
    )

    if not valid:
        logger.warning('Razorpay webhook signature invalid for event %s', event_id)
        return record

    if order is None:
        record.processed_at = timezone.now()
        record.save(update_fields=['processed_at'])
        return record

    if event_type == 'payment.captured':
        order_services.mark_payment(
            order,
            status=PaymentStatus.CAPTURED,
            razorpay_payment_id=entity.get('id', ''),
        )
    elif event_type == 'payment.failed':
        order_services.mark_payment(order, status=PaymentStatus.FAILED)
    elif event_type == 'refund.processed':
        order_services.mark_payment(order, status=PaymentStatus.REFUNDED)

    record.processed_at = timezone.now()
    record.save(update_fields=['processed_at'])
    return record
