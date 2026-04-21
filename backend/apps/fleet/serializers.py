from rest_framework import serializers

from .models import Bus, BusOperator, BusRestaurantAssignment, Route


class BusOperatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusOperator
        fields = (
            'id', 'company_name', 'contact_name', 'phone_number', 'email',
            'is_active', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = (
            'id', 'origin_city', 'destination_city', 'distance_km',
            'estimated_duration_hours',
        )
        read_only_fields = ('id',)


class BusSerializer(serializers.ModelSerializer):
    operator_name = serializers.CharField(source='operator.company_name', read_only=True)
    route_label = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = Bus
        fields = (
            'id', 'operator', 'operator_name', 'route', 'route_label',
            'bus_name', 'number_plate', 'qr_token', 'qr_image_url',
            'total_seats', 'is_active', 'latitude', 'longitude',
            'last_gps_update', 'created_at',
        )
        read_only_fields = ('id', 'qr_token', 'qr_image_url', 'created_at')

    def get_route_label(self, obj: Bus):
        return str(obj.route) if obj.route_id else None

    def get_latitude(self, obj: Bus):
        return obj.current_location.y if obj.current_location else None

    def get_longitude(self, obj: Bus):
        return obj.current_location.x if obj.current_location else None


class GPSPingSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)


class BusRestaurantAssignmentSerializer(serializers.ModelSerializer):
    bus_name = serializers.CharField(source='bus.bus_name', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = BusRestaurantAssignment
        fields = (
            'id', 'bus', 'bus_name', 'restaurant', 'restaurant_name',
            'is_active', 'created_at',
        )
        read_only_fields = ('id', 'created_at', 'is_active')
