from django.shortcuts import get_object_or_404
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
        # Staff-facing write actions scope to the user's own restaurants.
        if self.action not in ('list', 'retrieve') and self.request.user.is_authenticated:
            qs = qs.filter(
                restaurant__memberships__user=self.request.user,
                restaurant__memberships__is_active=True,
            ).distinct()
        return qs

    def get_queryset(self):
        return (
            MenuItem.objects
            .filter(
                restaurant__memberships__user=self.request.user,
                restaurant__memberships__is_active=True,
                deleted_at__isnull=True,
            )
            .select_related('category', 'restaurant')
            .distinct()
        )


class ScanBusQRView(APIView):
    """
    Public endpoint — passengers scan a bus QR code and get bus + assigned
    restaurant + menu. No auth required for browsing.
    """
    permission_classes = [AllowAny]

    def get(self, request, qr_token: str):
        bus = get_object_or_404(Bus, qr_token=qr_token, is_active=True)
        restaurant = selectors.restaurant_for_qr_token(qr_token)
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
        return Response({
            'bus': {'id': bus.id, 'name': bus.bus_name, 'number_plate': bus.number_plate},
            'restaurant': RestaurantSerializer(restaurant).data,
            'menu': MenuItemSerializer(menu, many=True).data,
        })
