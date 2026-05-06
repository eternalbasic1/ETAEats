from django.core.exceptions import ValidationError
from django.db import models

from apps.accounts.models import TimeStampedModel
from .semver import parse_version


class AppVersionConfig(TimeStampedModel):
    APP_CHOICES = [
        ('passenger', 'Passenger'),
        ('restaurant', 'Restaurant'),
        ('admin', 'Admin'),
    ]

    app_name = models.CharField(max_length=20, choices=APP_CHOICES, unique=True)
    min_required_version = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    update_message = models.TextField(default='A new version of the app is required.')
    android_store_url = models.URLField(blank=True, default='')
    ios_store_url = models.URLField(blank=True, default='')

    def clean(self):
        try:
            parse_version(self.min_required_version)
        except ValueError as e:
            raise ValidationError({'min_required_version': str(e)})

    def __str__(self):
        return f"{self.app_name} (min: {self.min_required_version})"
