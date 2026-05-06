from rest_framework import serializers

from .models import Cart, CartItem, Order, OrderItem


class CartItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    unit_price = serializers.DecimalField(source='menu_item.price', max_digits=8, decimal_places=2, read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'menu_item', 'menu_item_name', 'quantity', 'unit_price', 'line_total')
        read_only_fields = ('id',)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'bus', 'restaurant', 'items', 'total', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_total(self, obj: Cart):
        from .services import cart_total
        return str(cart_total(obj))


class AddCartItemSerializer(serializers.Serializer):
    menu_item = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    # Passed after scanning the bus QR so the cart is pinned to a bus from
    # the very first item add. Optional — omitting leaves bus null.
    bus_id = serializers.IntegerField(required=False, allow_null=True)


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'menu_item', 'menu_item_name', 'quantity', 'unit_price', 'line_total')
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    bus_name = serializers.CharField(source='bus.bus_name', read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'passenger', 'bus', 'bus_name', 'restaurant', 'restaurant_name',
            'status', 'payment_status', 'total_amount', 'promo_code', 'discount_amount', 'items',
            'razorpay_order_id', 'razorpay_payment_id',
            'confirmed_at', 'ready_at', 'picked_up_at',
            'cancelled_reason', 'created_at', 'updated_at',
        )
        read_only_fields = fields


class CheckoutLineSerializer(serializers.Serializer):
    menu_item = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField(required=False, allow_null=True)
    bus_id = serializers.IntegerField()
    promo_code = serializers.CharField(required=False, allow_blank=True, default='')
    lines = CheckoutLineSerializer(many=True, required=False)

    def validate(self, data):
        cart_id = data.get('cart_id')
        raw_lines = data.get('lines')
        lines_list = list(raw_lines) if raw_lines is not None else []
        has_cart = cart_id is not None
        has_lines = len(lines_list) > 0
        if has_cart == has_lines:
            raise serializers.ValidationError(
                'Provide exactly one of: cart_id (server cart) or lines (non-empty list of items).',
            )
        data['lines'] = lines_list
        return data


class AdvanceStatusSerializer(serializers.Serializer):
    status = serializers.CharField()
    reason = serializers.CharField(required=False, allow_blank=True, default='')
