from django.apps import AppConfig


class AppConfigConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.appconfig'
    label = 'appconfig'
    verbose_name = 'App Config'
