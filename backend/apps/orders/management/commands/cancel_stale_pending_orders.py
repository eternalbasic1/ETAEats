from django.core.management.base import BaseCommand

from apps.orders.services import cancel_stale_pending_unpaid_orders


class Command(BaseCommand):
    help = (
        'Cancel unpaid PENDING orders that still hold inventory reservations '
        '(default: created more than 30 minutes ago).'
    )

    def handle(self, *args, **options):
        n = cancel_stale_pending_unpaid_orders()
        self.stdout.write(self.style.SUCCESS(f'Cancelled {n} stale unpaid order(s).'))
