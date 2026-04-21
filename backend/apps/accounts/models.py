"""
Identity + authentication models.

One `User` table with a `role` enum is the source of truth for login.
Org affiliation (belonging to a restaurant or bus operator) is modelled
separately via `Membership` so a user's identity stays decoupled from
which organisation they work for.
"""
import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from phonenumber_field.modelfields import PhoneNumberField


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class UserRole(models.TextChoices):
    PASSENGER = 'PASSENGER', 'Passenger'
    RESTAURANT_STAFF = 'RESTAURANT_STAFF', 'Restaurant Staff'
    BUS_OPERATOR = 'BUS_OPERATOR', 'Bus Operator'
    ADMIN = 'ADMIN', 'Admin'


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, phone_number, password, **extra_fields):
        if not phone_number:
            raise ValueError('Users must have a phone number')
        email = extra_fields.pop('email', None)
        if email:
            email = self.normalize_email(email)
        user = self.model(phone_number=phone_number, email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('role', UserRole.PASSENGER)
        return self._create_user(phone_number, password, **extra_fields)

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        if not extra_fields['is_staff'] or not extra_fields['is_superuser']:
            raise ValueError('Superuser must have is_staff=True and is_superuser=True.')
        return self._create_user(phone_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Phone-first user. Password is optional; passengers authenticate via OTP.
    Restaurant staff and operators may also use OTP, or password for admin UIs.
    """
    class Gender(models.TextChoices):
        MALE = 'M', 'Male'
        FEMALE = 'F', 'Female'
        OTHER = 'O', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = PhoneNumberField(unique=True)
    email = models.EmailField(blank=True, null=True, unique=True)
    full_name = models.CharField(max_length=200, blank=True)
    gender = models.CharField(max_length=1, choices=Gender.choices, blank=True)

    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.PASSENGER,
    )

    fcm_token = models.CharField(max_length=255, blank=True, default='')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    last_login_at = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['phone_number']),
        ]

    def __str__(self) -> str:
        return f'{self.full_name or self.phone_number} ({self.role})'

    def get_full_name(self) -> str:
        return self.full_name or str(self.phone_number)

    def get_short_name(self) -> str:
        return self.full_name.split(' ')[0] if self.full_name else str(self.phone_number)


class Membership(TimeStampedModel):
    """
    Links a user to an organisation (restaurant OR bus operator) with an
    org-scoped role. A single user can belong to multiple orgs if needed.
    """
    class OrgRole(models.TextChoices):
        # Restaurant side
        RESTAURANT_OWNER = 'RESTAURANT_OWNER', 'Restaurant Owner'
        RESTAURANT_MANAGER = 'RESTAURANT_MANAGER', 'Restaurant Manager'
        RESTAURANT_COOK = 'RESTAURANT_COOK', 'Restaurant Cook'
        # Operator side
        OPERATOR_OWNER = 'OPERATOR_OWNER', 'Operator Owner'
        OPERATOR_ADMIN = 'OPERATOR_ADMIN', 'Operator Admin'

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='memberships',
    )
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.CASCADE,
        related_name='memberships',
        null=True,
        blank=True,
    )
    operator = models.ForeignKey(
        'fleet.BusOperator',
        on_delete=models.CASCADE,
        related_name='memberships',
        null=True,
        blank=True,
    )
    org_role = models.CharField(max_length=32, choices=OrgRole.choices)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Membership'
        verbose_name_plural = 'Memberships'
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(restaurant__isnull=False, operator__isnull=True)
                    | models.Q(restaurant__isnull=True, operator__isnull=False)
                ),
                name='membership_exactly_one_org',
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['restaurant', 'is_active']),
            models.Index(fields=['operator', 'is_active']),
        ]

    def __str__(self) -> str:
        org = self.restaurant or self.operator
        return f'{self.user} @ {org} ({self.org_role})'


class OTPPurpose(models.TextChoices):
    LOGIN = 'LOGIN', 'Login'
    PHONE_VERIFY = 'PHONE_VERIFY', 'Phone Verify'


class OTPCode(models.Model):
    """
    One row per outstanding OTP. Stored as a hash (never plaintext).
    Indexed by phone + purpose for fast verification lookups.
    """
    phone_number = PhoneNumberField()
    purpose = models.CharField(
        max_length=20,
        choices=OTPPurpose.choices,
        default=OTPPurpose.LOGIN,
    )
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    consumed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'OTP Code'
        verbose_name_plural = 'OTP Codes'
        indexes = [
            models.Index(fields=['phone_number', 'purpose', '-created_at']),
        ]

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def is_locked(self) -> bool:
        return bool(self.locked_until and timezone.now() < self.locked_until)

    def is_consumed(self) -> bool:
        return self.consumed_at is not None
