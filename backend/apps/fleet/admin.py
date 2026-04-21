from django.contrib import admin

from .models import Bus, BusGPSLog, BusOperator, BusRestaurantAssignment, Route


@admin.register(BusOperator)
class BusOperatorAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'contact_name', 'phone_number', 'email', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('company_name', 'email', 'phone_number')


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ('origin_city', 'destination_city', 'distance_km', 'estimated_duration_hours')
    search_fields = ('origin_city', 'destination_city')


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('bus_name', 'number_plate', 'operator', 'route', 'is_active', 'last_gps_update')
    list_filter = ('is_active', 'operator')
    search_fields = ('bus_name', 'number_plate')
    readonly_fields = ('qr_token', 'current_location', 'last_gps_update')


@admin.register(BusRestaurantAssignment)
class BusRestaurantAssignmentAdmin(admin.ModelAdmin):
    list_display = ('bus', 'restaurant', 'is_active', 'assigned_by', 'created_at')
    list_filter = ('is_active',)
    autocomplete_fields = ('bus', 'restaurant', 'assigned_by')


@admin.register(BusGPSLog)
class BusGPSLogAdmin(admin.ModelAdmin):
    list_display = ('bus', 'recorded_at')
    list_filter = ('bus',)
    readonly_fields = ('recorded_at',)
