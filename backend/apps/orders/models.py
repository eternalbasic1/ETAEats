"""
Cart → Order lifecycle.

Cart supports anonymous (session_key) and authed (user) usage and is pinned
to a single bus+restaurant. Ordering an item from a different restaurant
than the cart's restaurant is rejected at the service layer.

Order status is an explicit state machine: services.advance_status enforces
legal transitions and is the only caller allowed to mutate `status`.
"""
import uuid

from django.db import models

from apps.accounts.models import TimeStampedModel


class Cart(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session_key = models.CharField(max_length=255, blank=True, default='', db_index=True)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='carts',
    )
    bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='carts',
    )
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='carts',
    )

    class Meta:
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'
        indexes = [
            models.Index(fields=['session_key', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self) -> str:
        owner = self.user or f'anon({self.session_key[:8]})'
        return f'Cart {self.id} for {owner}'


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(
        'restaurants.MenuItem',
        on_delete=models.CASCADE,
        related_name='cart_items',
    )
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ('cart', 'menu_item')

    def __str__(self) -> str:
        return f'{self.quantity} × {self.menu_item.name}'

    @property
    def line_total(self):
        return self.quantity * self.menu_item.price


class OrderStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    CONFIRMED = 'CONFIRMED', 'Confirmed'
    PREPARING = 'PREPARING', 'Preparing'
    READY = 'READY', 'Ready'
    PICKED_UP = 'PICKED_UP', 'Picked Up'
    CANCELLED = 'CANCELLED', 'Cancelled'


class PaymentStatus(models.TextChoices):
    UNPAID = 'UNPAID', 'Unpaid'
    AUTHORIZED = 'AUTHORIZED', 'Authorized'
    CAPTURED = 'CAPTURED', 'Captured'
    REFUNDED = 'REFUNDED', 'Refunded'
    FAILED = 'FAILED', 'Failed'


# Legal state transitions for Order.status.
# PENDING → CONFIRMED → PREPARING → READY → PICKED_UP
# CANCELLED is reachable from PENDING / CONFIRMED only.
ALLOWED_STATUS_TRANSITIONS = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.PREPARING, OrderStatus.CANCELLED},
    OrderStatus.PREPARING: {OrderStatus.READY},
    OrderStatus.READY: {OrderStatus.PICKED_UP},
    OrderStatus.PICKED_UP: set(),
    OrderStatus.CANCELLED: set(),
}


class Order(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    passenger = models.ForeignKey(
        'accounts.User',
        on_delete=models.PROTECT,
        related_name='orders',
    )
    bus = models.ForeignKey(
        'fleet.Bus',
        on_delete=models.PROTECT,
        related_name='orders',
    )
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.PROTECT,
        related_name='orders',
    )
    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.UNPAID,
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    razorpay_order_id = models.CharField(max_length=200, blank=True, default='')
    razorpay_payment_id = models.CharField(max_length=200, blank=True, default='')
    cancelled_reason = models.CharField(max_length=255, blank=True, default='')
    confirmed_at = models.DateTimeField(null=True, blank=True)
    ready_at = models.DateTimeField(null=True, blank=True)
    picked_up_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['restaurant', '-created_at']),
            models.Index(fields=['passenger', '-created_at']),
            models.Index(fields=['bus', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'Order {self.id} ({self.status})'


class OrderItem(models.Model):
    """
    Price snapshot at the time of ordering — changing MenuItem.price later
    must NOT retroactively alter historical orders.
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(
        'restaurants.MenuItem',
        on_delete=models.PROTECT,
        related_name='order_items',
    )
    menu_item_name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)

    class Meta:
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self) -> str:
        return f'{self.quantity} × {self.menu_item_name}'

    @property
    def line_total(self):
        return self.quantity * self.unit_price
