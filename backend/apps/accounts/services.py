"""
OTP service — single source of truth for generation, hashing, verification.

Replaces the four `otp_*` fields that were previously duplicated across
`PassengerProfile` and `RestaurantStaff` in v1.
"""
from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from datetime import timedelta
from typing import Tuple

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from .exceptions import OTPError, RoleMismatchError
from .models import OTPCode, OTPPurpose, User, UserRole

ALLOWED_ROLES: dict[str, list[str]] = {
    'passenger':  [UserRole.PASSENGER],
    'restaurant': [UserRole.RESTAURANT_STAFF],
    'admin':      [UserRole.ADMIN, UserRole.BUS_OPERATOR],
}

logger = logging.getLogger(__name__)


def _hash_code(code: str) -> str:
    """HMAC-SHA256 using SECRET_KEY as key. Cheap, constant-time compare-friendly."""
    key = settings.SECRET_KEY.encode('utf-8')
    return hmac.new(key, code.encode('utf-8'), hashlib.sha256).hexdigest()


def _generate_code() -> str:
    length = settings.OTP_LENGTH
    # Avoid `secrets.randbelow(10**length)` losing leading zeros
    return ''.join(secrets.choice('0123456789') for _ in range(length))


@transaction.atomic
def request_otp(phone_number: str, purpose: str = OTPPurpose.LOGIN) -> OTPCode:
    """
    Create a new OTP, invalidating any outstanding ones for the same phone+purpose.
    Returns the model (caller dispatches SMS). In DEBUG the code is logged.
    """
    now = timezone.now()

    # Reject unknown numbers for login. Signups must be done explicitly.
    if purpose == OTPPurpose.LOGIN:
        if not User.objects.filter(phone_number=phone_number).exists():
            raise OTPError(
                'No account found. Please contact Support.',
                code='user_not_found',
            )

    # Check lockout on most-recent outstanding OTP
    latest = (
        OTPCode.objects
        .filter(phone_number=phone_number, purpose=purpose)
        .order_by('-created_at')
        .first()
    )
    if latest and latest.is_locked():
        raise OTPError(
            'Too many attempts. Try again later.',
            code='otp_locked',
            details={'retry_after_seconds': int((latest.locked_until - now).total_seconds())},
        )

    # Consume / expire prior outstanding codes so only one active row exists
    OTPCode.objects.filter(
        phone_number=phone_number,
        purpose=purpose,
        consumed_at__isnull=True,
    ).update(consumed_at=now)

    code = _generate_code()
    otp = OTPCode.objects.create(
        phone_number=phone_number,
        purpose=purpose,
        code_hash=_hash_code(code),
        expires_at=now + timedelta(seconds=settings.OTP_TTL_SECONDS),
    )

    # Dispatch happens elsewhere (SMS provider); in dev we log it.
    if settings.DEBUG:
        logger.info('OTP for %s (%s): %s', phone_number, purpose, code)
    else:
        _dispatch_sms(phone_number, code)

    return otp


def _dispatch_sms(phone_number: str, code: str) -> None:
    """Hook for real SMS provider (Twilio, MSG91, etc). No-op for now."""
    logger.info('TODO: dispatch SMS to %s', phone_number)


@transaction.atomic
def verify_otp(
    phone_number: str,
    code: str,
    purpose: str = OTPPurpose.LOGIN,
    app_type: str | None = None,
) -> User:
    """
    Verify an OTP and return the matching User (created on first login
    for passengers; existing users returned for other roles).
    """
    now = timezone.now()
    otp = (
        OTPCode.objects
        .select_for_update()
        .filter(phone_number=phone_number, purpose=purpose, consumed_at__isnull=True)
        .order_by('-created_at')
        .first()
    )
    if not otp:
        raise OTPError('No OTP requested for this number.', code='otp_not_found')
    if otp.is_locked():
        raise OTPError('Too many attempts. Try again later.', code='otp_locked')
    if otp.is_expired():
        raise OTPError('OTP expired. Request a new one.', code='otp_expired')

    expected = otp.code_hash
    provided = _hash_code(code)
    if not hmac.compare_digest(expected, provided):
        otp.attempts += 1
        if otp.attempts >= settings.OTP_MAX_ATTEMPTS:
            otp.locked_until = now + timedelta(seconds=settings.OTP_LOCKOUT_SECONDS)
        otp.save(update_fields=['attempts', 'locked_until'])
        raise OTPError('Invalid OTP.', code='otp_invalid')

    otp.consumed_at = now
    otp.save(update_fields=['consumed_at'])

    user = User.objects.filter(phone_number=phone_number).first()
    if user is None:
        raise OTPError('No account for this phone number.', code='user_not_found')

    # Role check — after OTP is consumed, before tokens are issued
    if app_type is not None:
        allowed = ALLOWED_ROLES.get(app_type, [])
        if user.role not in allowed:
            raise RoleMismatchError(
                "You don't have access to this app. Please contact support.",
                code='role_mismatch',
            )

    user.last_login_at = now
    user.save(update_fields=['last_login_at'])
    return user


def issue_tokens(user: User) -> dict:
    """Create SimpleJWT refresh+access pair with role claim baked in."""
    refresh = RefreshToken.for_user(user)
    refresh['role'] = user.role
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }
