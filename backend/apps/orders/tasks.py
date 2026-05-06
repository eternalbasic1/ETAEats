from celery import shared_task

from apps.orders.services import cancel_stale_pending_unpaid_orders


@shared_task(name='orders.cancel_stale_pending_reserved_orders')
def cancel_stale_pending_reserved_orders_task() -> int:
    """Release inventory for unpaid checkout sessions older than the configured window."""
    return cancel_stale_pending_unpaid_orders()
