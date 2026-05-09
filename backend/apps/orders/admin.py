from django.contrib import admin

from .models import Cart, CartItem, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('menu_item', 'menu_item_name', 'quantity', 'unit_price')
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'passenger', 'restaurant', 'bus', 'status', 'payment_status',
        'inventory_reserved', 'total_amount', 'created_at',
    )
    list_filter = ('status', 'payment_status', 'restaurant')
    search_fields = ('id', 'passenger__phone_number', 'razorpay_order_id')
    inlines = [OrderItemInline]
    readonly_fields = (
        'id', 'created_at', 'updated_at', 'confirmed_at', 'ready_at', 'picked_up_at', 'inventory_reserved',
    )


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_key', 'restaurant', 'bus', 'updated_at')
    search_fields = ('id', 'session_key', 'user__phone_number')
    inlines = [CartItemInline]
    readonly_fields = ('id', 'created_at', 'updated_at')
