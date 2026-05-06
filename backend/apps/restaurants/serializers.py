from rest_framework import serializers

from .models import MenuCategory, MenuItem, Restaurant


class RestaurantSerializer(serializers.ModelSerializer):
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = (
            'id', 'name', 'owner_name', 'phone_number', 'email', 'address',
            'fssai_license_number', 'hygiene_rating', 'latitude', 'longitude',
            'is_active', 'created_at',
        )
        read_only_fields = ('id', 'created_at')

    def get_latitude(self, obj: Restaurant):
        return obj.location.y if obj.location else None

    def get_longitude(self, obj: Restaurant):
        return obj.location.x if obj.location else None


class MenuCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuCategory
        fields = ('id', 'restaurant', 'name', 'sort_order')
        read_only_fields = ('id',)


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = (
            'id', 'restaurant', 'category', 'category_name', 'name', 'description',
            'price', 'photo_url', 'is_available', 'quantity_available', 'prep_time_minutes', 'created_at',
        )
        read_only_fields = ('id', 'created_at')


class ScanResponseSerializer(serializers.Serializer):
    """Response shape for the public QR-scan endpoint."""
    bus = serializers.DictField()
    restaurant = RestaurantSerializer()
    menu = MenuItemSerializer(many=True)
