from decimal import Decimal

from rest_framework import serializers


class ValidatePromoSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50, allow_blank=True)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0'))
    restaurant_id = serializers.IntegerField(required=False, allow_null=True)
