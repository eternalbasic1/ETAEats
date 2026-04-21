"""
Restaurant + menu domain. Staff access is via `accounts.Membership`
(role=RESTAURANT_STAFF on User, org_role=OWNER/MANAGER/COOK on Membership).
"""
from django.contrib.gis.db import models as geomodels
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField

from apps.accounts.models import TimeStampedModel


class Restaurant(TimeStampedModel):
    name = models.CharField(max_length=200)
    owner_name = models.CharField(max_length=200, blank=True)
    phone_number = PhoneNumberField(unique=True)
    email = models.EmailField(blank=True)
    address = models.TextField()
    fssai_license_number = models.CharField(max_length=100, unique=True)
    fssai_license_document = models.CharField(max_length=500, blank=True)
    hygiene_rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
    )
    location = geomodels.PointField(spatial_index=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = 'Restaurant'
        verbose_name_plural = 'Restaurants'
        indexes = [
            models.Index(fields=['is_active']),
        ]

    def __str__(self) -> str:
        return self.name


class MenuCategory(TimeStampedModel):
    """
    Optional grouping layer. Kept as its own table (instead of a free-text
    field) so categories can be reordered and renamed without touching items.
    """
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='menu_categories',
    )
    name = models.CharField(max_length=100)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        verbose_name = 'Menu Category'
        verbose_name_plural = 'Menu Categories'
        unique_together = ('restaurant', 'name')
        ordering = ('sort_order', 'name')

    def __str__(self) -> str:
        return f'{self.name} ({self.restaurant.name})'


class MenuItem(TimeStampedModel):
    restaurant = models.ForeignKey(
        Restaurant,
        on_delete=models.CASCADE,
        related_name='menu_items',
    )
    category = models.ForeignKey(
        MenuCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items',
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    photo_url = models.CharField(max_length=500, blank=True)
    is_available = models.BooleanField(default=True)
    prep_time_minutes = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(120)],
    )
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Menu Item'
        verbose_name_plural = 'Menu Items'
        indexes = [
            models.Index(fields=['restaurant', 'is_available']),
        ]

    def __str__(self) -> str:
        return f'{self.name} – {self.restaurant.name}'
