from django.db import models
from bookings.models import Booking
from users.models import ProviderProfile


class Payment(models.Model):
    """A customer's payment for a booking (held by the platform until release)."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"

    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name='payment'
    )
    reference = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    paystack_paid_at = models.DateTimeField(blank=True, null=True)
    raw_response = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment #{self.id} for booking {self.booking_id} ({self.status})"


class Payout(models.Model):
    """The 90% provider share released after job confirmation."""

    class Status(models.TextChoices):
        PENDING_RELEASE = "PENDING_RELEASE", "Awaiting Release"
        TRANSFER_INITIATED = "TRANSFER_INITIATED", "Transfer Initiated"
        PAID = "PAID", "Paid"
        FAILED = "FAILED", "Failed"

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payout')
    provider = models.ForeignKey(ProviderProfile, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # 90% of payment
    platform_fee = models.DecimalField(max_digits=10, decimal_places=2)  # 10%
    status = models.CharField(
        max_length=25, choices=Status.choices, default=Status.PENDING_RELEASE
    )
    transfer_code = models.CharField(max_length=50, blank=True, null=True)
    transfer_reference = models.CharField(max_length=100, blank=True, null=True)
    failure_reason = models.TextField(blank=True, null=True)
    released_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payout #{self.id} booking {self.booking_id} -> {self.provider} ({self.status})"
