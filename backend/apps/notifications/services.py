"""
Notification fan-out:
  - push_to_user       → FCM via firebase_admin (if token present)
  - ws_to_user_group   → Channels group "user.{id}"
  - ws_to_restaurant   → Channels group "restaurant.{id}"
  - notify_order_event → the public entry-point for order lifecycle events
"""
from __future__ import annotations

import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from apps.accounts.models import User

from .models import Notification

logger = logging.getLogger(__name__)


def _fcm_available() -> bool:
    try:
        import firebase_admin  # noqa: F401
        return True
    except ImportError:
        return False


def push_to_user(user: User, *, title: str, body: str = '', data: dict | None = None) -> None:
    """Send an FCM push to a user, no-op if they have no token / SDK missing."""
    if not user.fcm_token or not _fcm_available():
        logger.debug('Skip push to %s (no token or SDK)', user)
        return
    try:
        from firebase_admin import messaging
        msg = messaging.Message(
            token=user.fcm_token,
            notification=messaging.Notification(title=title, body=body),
            data={k: str(v) for k, v in (data or {}).items()},
        )
        messaging.send(msg)
    except Exception:
        logger.exception('FCM send failed for user %s', user.id)


def _group_send(group: str, payload: dict) -> None:
    layer = get_channel_layer()
    if layer is None:
        return
    async_to_sync(layer.group_send)(group, {'type': 'notify', 'payload': payload})


def ws_to_user(user: User, payload: dict) -> None:
    _group_send(f'user.{user.id}', payload)


def ws_to_restaurant(restaurant_id: int, payload: dict) -> None:
    _group_send(f'restaurant.{restaurant_id}', payload)


def record_and_dispatch(
    user: User,
    *,
    title: str,
    body: str = '',
    data: dict | None = None,
) -> Notification:
    """Persist in inbox + push via FCM + broadcast over WS."""
    note = Notification.objects.create(user=user, title=title, body=body, data=data or {})
    push_to_user(user, title=title, body=body, data=data)
    ws_to_user(user, {'title': title, 'body': body, 'data': data or {}, 'id': str(note.id)})
    return note


def notify_order_event(order, *, event: str) -> None:
    """Route one order lifecycle event to passenger + restaurant channels."""
    body_map = {
        'created': 'Your order is placed.',
        'confirmed': 'Your order is confirmed.',
        'preparing': 'Your food is being prepared.',
        'ready': 'Your order is ready for pickup.',
        'picked_up': 'Order picked up — enjoy!',
        'cancelled': 'Your order was cancelled.',
    }
    title = 'Order update'
    body = body_map.get(event, f'Order {event}')
    data = {'order_id': str(order.id), 'event': event, 'status': order.status}

    record_and_dispatch(order.passenger, title=title, body=body, data=data)
    ws_to_restaurant(order.restaurant_id, {'event': event, 'order_id': str(order.id), 'status': order.status})
