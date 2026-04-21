from django.contrib import admin

from .models import MenuCategory, MenuItem, Restaurant


@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone_number', 'fssai_license_number', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'phone_number', 'fssai_license_number')


@admin.register(MenuCategory)
class MenuCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'sort_order')
    list_filter = ('restaurant',)


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'category', 'price', 'is_available', 'prep_time_minutes')
    list_filter = ('is_available', 'restaurant')
    search_fields = ('name',)
