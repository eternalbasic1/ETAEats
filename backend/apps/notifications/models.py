"""Persistent notification log (in-app inbox). FCM dispatch is fire-and-forget."""
import uuid

from django.db import models

from apps.accounts.models import TimeStampedModel


class Notification(TimeStampedModel):
    class Channel(models.TextChoices):
        PUSH = 'PUSH', 'Push'
        WEBSOCKET = 'WEBSOCKET', 'WebSocket'
        IN_APP = 'IN_APP', 'In-App'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    channel = models.CharField(max_length=20, choices=Channel.choices, default=Channel.IN_APP)
    data = models.JSONField(default=dict, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'{self.channel}:{self.title} → {self.user}'
