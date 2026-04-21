from rest_framework import serializers


class CreateRazorpayOrderSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()


class RazorpayConfirmSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    razorpay_order_id = serializers.CharField()
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField()
