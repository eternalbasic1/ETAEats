from django.contrib import admin

from .models import PromoCode, PromoRedemption


class PromoRedemptionInline(admin.TabularInline):
    model = PromoRedemption
    extra = 0
    readonly_fields = ('user', 'order', 'discount_applied', 'created_at')
    can_delete = False


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = (
        'code', 'discount_type', 'discount_value', 'restaurant',
        'valid_from', 'valid_until', 'used_count', 'max_uses', 'is_active',
    )
    list_filter = ('discount_type', 'is_active', 'restaurant')
    search_fields = ('code',)
    readonly_fields = ('used_count', 'created_at', 'updated_at')
    inlines = [PromoRedemptionInline]
    fieldsets = (
        ('Code', {
            'fields': ('code', 'is_active'),
        }),
        ('Discount', {
            'fields': ('discount_type', 'discount_value', 'max_discount_amount'),
        }),
        ('Restrictions', {
            'fields': ('restaurant', 'min_order_value', 'max_uses', 'used_count'),
        }),
        ('Validity', {
            'fields': ('valid_from', 'valid_until'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def save_model(self, request, obj, form, change):
        # Always store codes uppercase
        obj.code = obj.code.upper().strip()
        super().save_model(request, obj, form, change)


@admin.register(PromoRedemption)
class PromoRedemptionAdmin(admin.ModelAdmin):
    list_display = ('promo_code', 'user', 'order', 'discount_applied', 'created_at')
    list_filter = ('promo_code',)
    search_fields = ('promo_code__code', 'user__phone_number')
    readonly_fields = ('promo_code', 'user', 'order', 'discount_applied', 'created_at', 'updated_at')
