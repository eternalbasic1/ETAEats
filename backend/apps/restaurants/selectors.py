"""
Read-side queries that span restaurants + fleet, isolated so views/services
don't grow inline ORM calls.
"""
from __future__ import annotations

from typing import Optional

from .models import MenuItem, Restaurant


def menu_for_restaurant(restaurant: Restaurant):
    return (
        MenuItem.objects
        .filter(restaurant=restaurant, deleted_at__isnull=True)
        .select_related('category')
        .order_by('category__sort_order', 'name')
    )


def restaurant_for_qr_token(qr_token: str) -> Optional[Restaurant]:
    from apps.fleet.models import BusRestaurantAssignment
    normalized_qr_token = qr_token.upper()

    assignment = (
        BusRestaurantAssignment.objects
        .select_related('restaurant', 'bus')
        .filter(bus__qr_token=normalized_qr_token, is_active=True)
        .first()
    )
    return assignment.restaurant if assignment else None
