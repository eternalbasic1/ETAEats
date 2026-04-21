from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'channel', 'title', 'read_at', 'created_at')
    list_filter = ('channel',)
    search_fields = ('user__phone_number', 'title')
    readonly_fields = ('id', 'created_at', 'updated_at')
