from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminOrOperator

from . import services
from .models import Bus, BusOperator, BusRestaurantAssignment, Route
from .serializers import (
    BusOperatorSerializer,
    BusRestaurantAssignmentSerializer,
    BusSerializer,
    GPSPingSerializer,
    RouteSerializer,
)


class BusOperatorViewSet(viewsets.ModelViewSet):
    queryset = BusOperator.objects.all()
    serializer_class = BusOperatorSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    search_fields = ('company_name', 'email', 'phone_number')


class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    search_fields = ('origin_city', 'destination_city')


class BusViewSet(viewsets.ModelViewSet):
    queryset = Bus.objects.select_related('operator', 'route').all()
    serializer_class = BusSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    filterset_fields = ('operator', 'route', 'is_active')
    search_fields = ('bus_name', 'number_plate')

    @action(detail=True, methods=['post'])
    def assign_restaurant(self, request, pk=None):
        bus = self.get_object()
        restaurant_id = request.data.get('restaurant')
        if not restaurant_id:
            return Response({'detail': 'restaurant required'}, status=400)
        from apps.restaurants.models import Restaurant
        restaurant = get_object_or_404(Restaurant, pk=restaurant_id)
        assignment = services.assign_restaurant(bus, restaurant, assigned_by=request.user)
        return Response(
            BusRestaurantAssignmentSerializer(assignment).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='gps')
    def gps_ping(self, request, pk=None):
        bus = self.get_object()
        serializer = GPSPingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        services.record_gps(bus, **serializer.validated_data)
        return Response(status=status.HTTP_204_NO_CONTENT)


class AssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BusRestaurantAssignment.objects.select_related('bus', 'restaurant')
    serializer_class = BusRestaurantAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrOperator]
    filterset_fields = ('bus', 'restaurant', 'is_active')
