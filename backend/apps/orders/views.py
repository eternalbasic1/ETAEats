from django.shortcuts import get_object_or_404
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsPassenger, IsRestaurantStaff
from apps.fleet.models import Bus
from apps.restaurants.models import MenuItem

from . import services
from .models import Cart, CartItem, Order
from .serializers import (
    AddCartItemSerializer,
    AdvanceStatusSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderSerializer,
    UpdateCartItemSerializer,
)


def _session_key(request) -> str:
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


class CartView(APIView):
    """
    Anonymous (session-keyed) and authenticated cart read/add/update/remove.
    """
    permission_classes = [AllowAny]

    def _get_cart(self, request, bus=None) -> Cart:
        return services.get_or_create_cart(
            user=request.user if request.user.is_authenticated else None,
            session_key=_session_key(request),
            bus=bus,
        )

    def get(self, request):
        cart = self._get_cart(request)
        return Response(CartSerializer(cart).data)

    def post(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        bus_id = serializer.validated_data.get('bus_id')
        bus = get_object_or_404(Bus, pk=bus_id, is_active=True) if bus_id else None

        cart = self._get_cart(request, bus=bus)

        # Allow rebinding bus for empty carts (new scan flow).
        if bus and (not cart.bus_id or (cart.bus_id != bus.id and not cart.items.exists())):
            cart.bus = bus
            cart.save(update_fields=['bus'])

        menu_item = get_object_or_404(MenuItem, pk=serializer.validated_data['menu_item'])
        services.add_item(cart, menu_item, serializer.validated_data['quantity'])
        return Response(CartSerializer(cart).data, status=http_status.HTTP_201_CREATED)


class CartItemView(APIView):
    permission_classes = [AllowAny]

    def _get_item(self, request, item_id: int) -> CartItem:
        item = get_object_or_404(CartItem.objects.select_related('cart'), pk=item_id)
        cart = item.cart
        if cart.user_id and request.user.is_authenticated and cart.user_id == request.user.id:
            return item
        if not cart.user_id and cart.session_key == _session_key(request):
            return item
        self.permission_denied(request)

    def patch(self, request, item_id: int):
        item = self._get_item(request, item_id)
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.update_item_quantity(item, serializer.validated_data['quantity'])
        return Response(CartSerializer(item.cart).data)

    def delete(self, request, item_id: int):
        item = self._get_item(request, item_id)
        cart = item.cart
        item.delete()
        services.clear_cart_context_if_empty(cart)
        return Response(CartSerializer(cart).data)


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated, IsPassenger]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_object_or_404(Cart, pk=serializer.validated_data['cart_id'])

        # Cart may be anonymous (user=null) if the passenger logged in after
        # adding items. Assign it to the authenticated user now, or reject if
        # it already belongs to someone else.
        if cart.user_id is None:
            cart.user = request.user
            cart.save(update_fields=['user'])
        elif cart.user_id != request.user.id:
            raise PermissionDenied('This cart belongs to another user.')

        bus = get_object_or_404(Bus, pk=serializer.validated_data['bus_id'], is_active=True)
        order = services.checkout(
            cart,
            user=request.user,
            bus=bus,
            promo_code=serializer.validated_data.get('promo_code') or '',
        )
        return Response(OrderSerializer(order).data, status=http_status.HTTP_201_CREATED)


class PassengerOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsPassenger]

    def get_queryset(self):
        return (
            Order.objects
            .filter(passenger=self.request.user)
            .select_related('restaurant', 'bus')
            .prefetch_related('items')
            .order_by('-created_at')
        )


class RestaurantOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """Orders visible to a restaurant's staff, with status-transition action."""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsRestaurantStaff]

    def get_queryset(self):
        return (
            Order.objects
            .filter(
                restaurant__memberships__user=self.request.user,
                restaurant__memberships__is_active=True,
            )
            .select_related('restaurant', 'bus', 'passenger')
            .prefetch_related('items')
            .order_by('-created_at')
            .distinct()
        )

    @action(detail=True, methods=['post'], url_path='advance')
    def advance(self, request, pk=None):
        order = self.get_object()
        serializer = AdvanceStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.advance_status(
            order,
            serializer.validated_data['status'],
            reason=serializer.validated_data.get('reason', ''),
        )
        return Response(OrderSerializer(order).data)
