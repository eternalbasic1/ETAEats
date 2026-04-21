"""
Fan notifications out when Order state changes. Keeping the hook in
signals (rather than inside `orders.services`) avoids a hard dependency
from orders → notifications.
"""
from __future__ import annotations

from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.orders.models import Order, OrderStatus

from . import services


_STATUS_TO_EVENT = {
    OrderStatus.PENDING: 'created',
    OrderStatus.CONFIRMED: 'confirmed',
    OrderStatus.PREPARING: 'preparing',
    OrderStatus.READY: 'ready',
    OrderStatus.PICKED_UP: 'picked_up',
    OrderStatus.CANCELLED: 'cancelled',
}


@receiver(post_save, sender=Order)
def on_order_saved(sender, instance: Order, created: bool, **kwargs):
    if created:
        services.notify_order_event(instance, event='created')
        return
    # On updates we just emit based on current status. Orders only change
    # status via advance_status() which saves the row, so this triggers once.
    event = _STATUS_TO_EVENT.get(instance.status)
    if event:
        services.notify_order_event(instance, event=event)
