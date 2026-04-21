from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS += ['drf_spectacular_sidecar']  # noqa

# Relax CORS in dev
CORS_ALLOW_ALL_ORIGINS = True
