from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'
    label = 'notifications'
    verbose_name = 'Notifications'

    def ready(self):
        # Import signal handlers so order state changes dispatch notifications.
        from . import signals  # noqa: F401
