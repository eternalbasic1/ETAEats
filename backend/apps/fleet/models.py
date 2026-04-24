"""
Bus fleet domain: operators own buses; buses run routes; each bus has a
QR token passengers scan; current location is PostGIS-indexed for proximity.
"""
import secrets
import string

from django.contrib.gis.db import models as geomodels
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField

from apps.accounts.models import TimeStampedModel

QR_TOKEN_LENGTH = 6
QR_TOKEN_ALPHABET = string.ascii_uppercase + string.digits


def generate_qr_token() -> str:
    # Human-friendly, URL-safe alphanumeric token for bus scan stickers.
    return ''.join(secrets.choice(QR_TOKEN_ALPHABET) for _ in range(QR_TOKEN_LENGTH))


class BusOperator(TimeStampedModel):
    """
    Bus operator company. Login access is granted via `Membership`
    (user with role=BUS_OPERATOR linked to this operator).
    """
    company_name = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=200, blank=True)
    phone_number = PhoneNumberField(unique=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Bus Operator'
        verbose_name_plural = 'Bus Operators'

    def __str__(self) -> str:
        return self.company_name


class Route(TimeStampedModel):
    origin_city = models.CharField(max_length=100)
    destination_city = models.CharField(max_length=100)
    distance_km = models.PositiveIntegerField()
    estimated_duration_hours = models.DecimalField(max_digits=4, decimal_places=1)

    class Meta:
        verbose_name = 'Route'
        verbose_name_plural = 'Routes'
        indexes = [
            models.Index(fields=['origin_city', 'destination_city']),
        ]

    def __str__(self) -> str:
        return f'{self.origin_city} → {self.destination_city}'


class Bus(TimeStampedModel):
    operator = models.ForeignKey(
        BusOperator,
        on_delete=models.PROTECT,
        related_name='buses',
    )
    route = models.ForeignKey(
        Route,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='buses',
    )
    bus_name = models.CharField(max_length=200)
    number_plate = models.CharField(max_length=20, unique=True)
    qr_token = models.CharField(
        max_length=QR_TOKEN_LENGTH,
        unique=True,
        default=generate_qr_token,
        editable=False,
    )
    qr_image_url = models.CharField(max_length=500, blank=True)
    total_seats = models.PositiveIntegerField()
    is_active = models.BooleanField(default=True)
    current_location = geomodels.PointField(null=True, blank=True, spatial_index=True)
    last_gps_update = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Bus'
        verbose_name_plural = 'Buses'
        indexes = [
            models.Index(fields=['operator', 'is_active']),
            models.Index(fields=['qr_token']),
        ]

    def __str__(self) -> str:
        return f'{self.bus_name} ({self.number_plate})'

    def save(self, *args, **kwargs):
        if self.qr_token:
            self.qr_token = str(self.qr_token).upper()
        super().save(*args, **kwargs)


class BusRestaurantAssignment(TimeStampedModel):
    """
    Assigns a restaurant to a bus. At most one active assignment per bus.
    """
    bus = models.ForeignKey(
        Bus,
        on_delete=models.CASCADE,
        related_name='restaurant_assignments',
    )
    restaurant = models.ForeignKey(
        'restaurants.Restaurant',
        on_delete=models.CASCADE,
        related_name='bus_assignments',
    )
    is_active = models.BooleanField(default=True)
    assigned_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bus_assignments_made',
    )

    class Meta:
        verbose_name = 'Bus-Restaurant Assignment'
        verbose_name_plural = 'Bus-Restaurant Assignments'
        constraints = [
            models.UniqueConstraint(
                fields=['bus'],
                condition=models.Q(is_active=True),
                name='unique_active_bus_assignment',
            ),
        ]

    def __str__(self) -> str:
        return f'{self.bus.bus_name} → {self.restaurant.name}'


class BusGPSLog(models.Model):
    """
    Append-only GPS breadcrumbs. `current_location` on Bus is the latest;
    this table keeps history for analytics/replay.
    """
    bus = models.ForeignKey(Bus, on_delete=models.CASCADE, related_name='gps_logs')
    location = geomodels.PointField()
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Bus GPS Log'
        verbose_name_plural = 'Bus GPS Logs'
        indexes = [
            models.Index(fields=['bus', '-recorded_at']),
        ]

    def __str__(self) -> str:
        return f'{self.bus.bus_name} @ {self.recorded_at:%Y-%m-%d %H:%M}'
