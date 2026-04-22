from django.contrib.auth.backends import ModelBackend
from django.conf import settings

try:
    import phonenumbers
    from phonenumbers import NumberParseException
except ImportError:
    phonenumbers = None


def _normalize_phone(raw: str) -> str:
    """
    Convert any reasonable phone string to E.164 so it matches what
    PhoneNumberField stores.  Falls back to the raw value on parse failure.
    """
    if phonenumbers is None:
        return raw
    region = getattr(settings, 'PHONENUMBER_DEFAULT_REGION', 'IN')
    try:
        parsed = phonenumbers.parse(raw, region)
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except NumberParseException:
        return raw


class PhoneNumberBackend(ModelBackend):
    """
    Authenticate with phone_number + password.
    Normalises the input to E.164 before the DB lookup so users can type
    '9876543210' or '+91-9876543210' and both match '+919876543210'.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        from .models import User  # local import to avoid circular imports

        if username is None:
            return None

        normalized = _normalize_phone(str(username))

        try:
            user = User.objects.get(phone_number=normalized)
        except User.DoesNotExist:
            # Run the default password hasher to resist timing attacks.
            User().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
