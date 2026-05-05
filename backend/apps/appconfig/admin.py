from django.contrib import admin

from .models import AppVersionConfig


@admin.register(AppVersionConfig)
class AppVersionConfigAdmin(admin.ModelAdmin):
    list_display = ('app_name', 'min_required_version', 'is_active', 'updated_at')
    list_filter = ('is_active',)
    readonly_fields = ('created_at', 'updated_at')
