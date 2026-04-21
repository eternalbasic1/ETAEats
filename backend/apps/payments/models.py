"""
Raw webhook audit log. Payment state lives on the Order (payment_status +
razorpay_* ids) — this table just preserves raw events for replay/debugging.
"""
import uuid

from django.db import models

from apps.accounts.models import TimeStampedModel


class WebhookEvent(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.CharField(max_length=30, default='razorpay')
    event_id = models.CharField(max_length=200, unique=True)
    event_type = models.CharField(max_length=100)
    order = models.ForeignKey(
        'orders.Order',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='webhook_events',
    )
    payload = models.JSONField()
    signature_valid = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Webhook Event'
        verbose_name_plural = 'Webhook Events'
        indexes = [
            models.Index(fields=['provider', 'event_type']),
        ]

    def __str__(self) -> str:
        return f'{self.provider}:{self.event_type}:{self.event_id}'
