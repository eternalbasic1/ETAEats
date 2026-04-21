"""
Role-based permissions. Views pin down the minimum role they need; membership
checks for org-scoped actions belong in the view/service, not here.
"""
from rest_framework.permissions import BasePermission

from .models import UserRole


class _RoleRequired(BasePermission):
    required_role: str = ''

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.role == self.required_role)


class IsPassenger(_RoleRequired):
    required_role = UserRole.PASSENGER


class IsRestaurantStaff(_RoleRequired):
    required_role = UserRole.RESTAURANT_STAFF


class IsBusOperator(_RoleRequired):
    required_role = UserRole.BUS_OPERATOR


class IsAdmin(_RoleRequired):
    required_role = UserRole.ADMIN


class IsAdminOrOperator(BasePermission):
    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.role in (UserRole.ADMIN, UserRole.BUS_OPERATOR)
        )
