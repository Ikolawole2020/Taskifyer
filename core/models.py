from django.db import models


class QueuedPush(models.Model):
    """
    Push messages queued for delivery by the external GitHub Actions relay
    (used when the PythonAnywhere proxy blocks direct exp.host calls).
    """
    token = models.CharField(max_length=255)
    title = models.CharField(max_length=200)
    body = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=10,
        choices=[('PENDING', 'Pending'), ('SENT', 'Sent'), ('FAILED', 'Failed')],
        default='PENDING',
    )
    attempts = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"QueuedPush #{self.id} -> {self.token[:25]}..."

