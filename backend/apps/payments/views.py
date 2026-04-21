import json
import logging

from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsPassenger
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer

from . import services
from .serializers import CreateRazorpayOrderSerializer, RazorpayConfirmSerializer

logger = logging.getLogger(__name__)


class CreateRazorpayOrderView(APIView):
    permission_classes = [IsAuthenticated, IsPassenger]

    def post(self, request):
        serializer = CreateRazorpayOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = get_object_or_404(
            Order,
            pk=serializer.validated_data['order_id'],
            passenger=request.user,
        )
        payload = services.create_razorpay_order(order)
        return Response(payload, status=201)


class ConfirmRazorpayPaymentView(APIView):
    permission_classes = [IsAuthenticated, IsPassenger]

    def post(self, request):
        serializer = RazorpayConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = get_object_or_404(
            Order,
            pk=serializer.validated_data['order_id'],
            passenger=request.user,
        )
        order = services.confirm_from_client(
            order,
            razorpay_order_id=serializer.validated_data['razorpay_order_id'],
            razorpay_payment_id=serializer.validated_data['razorpay_payment_id'],
            razorpay_signature=serializer.validated_data['razorpay_signature'],
        )
        return Response(OrderSerializer(order).data)


class RazorpayWebhookView(APIView):
    """
    Razorpay → us. Signature verified in service. We always 200 on receipt
    so Razorpay doesn't retry forever; invalid signatures are logged.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        raw_body = request.body
        signature = request.headers.get('X-Razorpay-Signature', '')
        try:
            event = json.loads(raw_body.decode('utf-8') or '{}')
        except ValueError:
            return Response({'detail': 'invalid json'}, status=400)
        services.process_webhook(raw_body, signature, event)
        return Response(status=200)
