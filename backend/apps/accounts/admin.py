from django.contrib import admin
from django.contrib.auth.forms import AdminPasswordChangeForm, AuthenticationForm
from django import forms

from .models import Membership, OTPCode, User


class AdminLoginForm(AuthenticationForm):
    """Show 'Phone Number' instead of 'Username' on the admin login page."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['username'].label = 'Phone Number'
        self.fields['username'].help_text = 'e.g. +919876543210 or 9876543210'


admin.site.login_form = AdminLoginForm


class UserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Confirm password', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('phone_number', 'role')

    def clean_password2(self):
        p1 = self.cleaned_data.get('password1')
        p2 = self.cleaned_data.get('password2')
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError("Passwords don't match.")
        return p2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    class Meta:
        model = User
        fields = '__all__'


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    ordering = ('-created_at',)
    list_display = ('phone_number', 'full_name', 'email', 'role', 'is_active', 'is_staff', 'created_at')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('phone_number', 'email', 'full_name')

    fieldsets = (
        (None, {'fields': ('phone_number', 'password')}),
        ('Profile', {'fields': ('full_name', 'email', 'gender', 'role', 'fcm_token')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Timestamps', {'fields': ('last_login', 'last_login_at', 'created_at', 'updated_at')}),
    )
    readonly_fields = ('last_login', 'last_login_at', 'created_at', 'updated_at')

    add_fieldsets = [
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'role', 'password1', 'password2'),
        }),
    ]

    def get_form(self, request, obj=None, change=False, **kwargs):
        if obj is None:
            kwargs['form'] = self.add_form
        return super().get_form(request, obj, change=change, **kwargs)

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            return self.add_fieldsets
        return super().get_fieldsets(request, obj)


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
