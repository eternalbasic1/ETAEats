"""
Fleet domain services — QR generation, GPS ingest, assignment rotation.
"""
from __future__ import annotations

import io
import logging
from typing import Optional

from django.contrib.gis.geos import Point
from django.core.files.base import ContentFile
from django.db import transaction
from django.utils import timezone

from apps.accounts.exceptions import DomainError

from .models import Bus, BusGPSLog, BusRestaurantAssignment

logger = logging.getLogger(__name__)


def generate_qr_image(bus: Bus, base_url: str) -> bytes:
    """Return PNG bytes encoding the scan URL for this bus."""
    import qrcode

    scan_url = f'{base_url.rstrip("/")}/scan/{bus.qr_token}'
    img = qrcode.make(scan_url)
    buf = io.BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


@transaction.atomic
def record_gps(bus: Bus, *, latitude: float, longitude: float) -> BusGPSLog:
    """Update bus current location and append a history row."""
    point = Point(longitude, latitude, srid=4326)
    bus.current_location = point
    bus.last_gps_update = timezone.now()
    bus.save(update_fields=['current_location', 'last_gps_update'])
    return BusGPSLog.objects.create(bus=bus, location=point)


@transaction.atomic
def assign_restaurant(bus: Bus, restaurant, *, assigned_by=None) -> BusRestaurantAssignment:
    """Deactivate any existing active assignment, then create a new one."""
    BusRestaurantAssignment.objects.filter(bus=bus, is_active=True).update(is_active=False)
    return BusRestaurantAssignment.objects.create(
        bus=bus,
        restaurant=restaurant,
        is_active=True,
        assigned_by=assigned_by,
    )


def active_restaurant_for(bus: Bus) -> Optional['restaurants.Restaurant']:  # type: ignore[name-defined]
    assignment = (
        BusRestaurantAssignment.objects
        .select_related('restaurant')
        .filter(bus=bus, is_active=True)
        .first()
    )
    return assignment.restaurant if assignment else None
