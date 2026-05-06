"""
Test settings — minimal, no optional apps that require extra packages.
"""
from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ['*']

# Remove drf_spectacular_sidecar which is not installed in CI/test environments
# Remove django.contrib.gis to avoid GDAL dependency in local test runs
INSTALLED_APPS = [  # noqa
    app for app in INSTALLED_APPS  # noqa
    if app not in ('drf_spectacular_sidecar', 'django.contrib.gis')
]

# Use standard PostgreSQL backend (no PostGIS/GDAL required for unit tests)
DATABASES['default']['ENGINE'] = 'django.db.backends.postgresql'  # noqa

# Relax CORS in tests
CORS_ALLOW_ALL_ORIGINS = True

# Use a fast password hasher in tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]
