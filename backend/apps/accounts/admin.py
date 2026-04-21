from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Membership, OTPCode, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ('-created_at',)
    list_display = ('phone_number', 'full_name', 'email', 'role', 'is_active', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('phone_number', 'email', 'full_name')

    fieldsets = (
        (None, {'fields': ('phone_number', 'password')}),
        ('Profile', {'fields': ('full_name', 'email', 'gender', 'role', 'fcm_token')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps', {'fields': ('last_login', 'last_login_at', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('last_login', 'last_login_at', 'created_at', 'updated_at')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'role', 'password1', 'password2'),
        }),
    )


@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'restaurant', 'operator', 'org_role', 'is_active', 'created_at')
    list_filter = ('org_role', 'is_active')
    search_fields = ('user__phone_number', 'user__full_name')
    autocomplete_fields = ('user', 'restaurant', 'operator')


@admin.register(OTPCode)
class OTPCodeAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'purpose', 'expires_at', 'attempts', 'consumed_at', 'created_at')
    list_filter = ('purpose',)
    search_fields = ('phone_number',)
    readonly_fields = ('code_hash', 'created_at')
