from django.contrib import admin

from .models import WebhookEvent


@admin.register(WebhookEvent)
class WebhookEventAdmin(admin.ModelAdmin):
    list_display = ('provider', 'event_type', 'event_id', 'order', 'signature_valid', 'processed_at', 'created_at')
    list_filter = ('provider', 'event_type', 'signature_valid')
    search_fields = ('event_id',)
    readonly_fields = ('id', 'payload', 'created_at', 'updated_at')
