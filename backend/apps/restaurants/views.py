from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminOrOperator, IsRestaurantStaff
from apps.fleet.models import Bus

from . import selectors
from .models import MenuCategory, MenuItem, Restaurant
from .serializers import (
    MenuCategorySerializer,
    MenuItemSerializer,
    RestaurantSerializer,
)


class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    filterset_fields = ('is_active',)
    search_fields = ('name', 'phone_number', 'fssai_license_number')

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrOperator()]


class MenuCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = MenuCategorySerializer
    permission_classes = [IsAuthenticated, IsRestaurantStaff]

    def get_queryset(self):
        return MenuCategory.objects.filter(
            restaurant__memberships__user=self.request.user,
            restaurant__memberships__is_active=True,
        ).distinct()


class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    filterset_fields = ('restaurant', 'category', 'is_available')

    def get_permissions(self):
        # Passengers browse the menu without any account.
        # Only restaurant staff can create / update / delete items.
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAuthenticated(), IsRestaurantStaff()]

    def get_queryset(self):
        qs = (
            MenuItem.objects
            .select_related('category', 'restaurant')
            .filter(deleted_at__isnull=True)
        )
        # Write actions (create/update/delete) are staff-only and scoped to
        # the user's own restaurants. Read actions are public (AllowAny).
        if self.action not in ('list', 'retrieve') and self.request.user.is_authenticated:
            qs = qs.filter(
                restaurant__memberships__user=self.request.user,
                restaurant__memberships__is_active=True,
            ).distinct()
        return qs

    def perform_update(self, serializer):
        instance = serializer.save()
        # Auto-restore availability when restocked
        qty = instance.quantity_available
        if qty is not None and qty > 0 and not instance.is_available:
            instance.is_available = True
            instance.save(update_fields=['is_available'])

    def destroy(self, request, *args, **kwargs):
        """
        Soft-delete menu items so historical OrderItem rows (PROTECT FK) keep
        working and staff can safely remove items from active menu listings.
        """
        instance = self.get_object()
        instance.deleted_at = timezone.now()
        instance.is_available = False
        instance.save(update_fields=['deleted_at', 'is_available'])
        return Response(status=http_status.HTTP_204_NO_CONTENT)


class ScanBusQRView(APIView):
    """
    Public endpoint — passengers scan a bus QR code and get bus + assigned
    restaurant + menu. No auth required for browsing.
    """
    permission_classes = [AllowAny]

    def get(self, request, qr_token: str):
        normalized_qr_token = qr_token.upper()
        bus = get_object_or_404(Bus, qr_token=normalized_qr_token, is_active=True)
        restaurant = selectors.restaurant_for_qr_token(normalized_qr_token)
        if restaurant is None:
            return Response(
                {
                    'bus': {'id': bus.id, 'name': bus.bus_name},
                    'restaurant': None,
                    'menu': [],
                    'detail': 'No restaurant is currently assigned to this bus.',
                },
                status=200,
            )
        menu = selectors.menu_for_restaurant(restaurant)
        from datetime import timedelta
        duration_hours = float(bus.route.estimated_duration_hours) if bus.route_id else 8.0
        expires_at = timezone.now() + timedelta(hours=duration_hours)
        return Response({
            'bus': {'id': bus.id, 'name': bus.bus_name, 'number_plate': bus.number_plate},
            'restaurant': RestaurantSerializer(restaurant).data,
            'menu': MenuItemSerializer(menu, many=True).data,
            'expires_at': expires_at.isoformat(),
        })
