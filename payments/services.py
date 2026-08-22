"""
Escrow release logic: moves a confirmed booking's provider share (90%)
out of the platform balance via Paystack Transfer. The 10% platform fee
simply stays in the platform balance.
"""
import uuid
from decimal import Decimal
from django.utils import timezone

from .models import Payment, Payout
from . import paystack
from users.models import Notification

PROVIDER_SHARE = Decimal('0.90')
PLATFORM_SHARE = Decimal('0.10')


def get_or_create_payment(booking) -> Payment:
    payment, created = Payment.objects.get_or_create(
        booking=booking,
        defaults={
            'reference': f'BKF-{booking.id}-{uuid.uuid4().hex[:10].upper()}',
            'amount': booking.price,
        },
    )
    return payment


def mark_payment_paid(payment: Payment, raw: dict | None = None):
    """Called by webhook / verify when charge.success arrives."""
    if payment.status == Payment.Status.PAID:
        return payment
    payment.status = Payment.Status.PAID
    payment.paystack_paid_at = timezone.now()
    if raw:
        payment.raw_response = raw
    payment.save(update_fields=['status', 'paystack_paid_at', 'raw_response'])
    return payment


def release_for_booking(booking) -> Payout:
    """
    Creates the 90% payout for a confirmed booking and initiates the
    Paystack transfer if the provider has completed payout onboarding.
    Idempotent: safe to call multiple times.
    """
    payout, created = Payout.objects.get_or_create(
        booking=booking,
        defaults={
            'provider': booking.provider,
            'amount': (booking.price * PROVIDER_SHARE).quantize(Decimal('0.01')),
            'platform_fee': (booking.price * PLATFORM_SHARE).quantize(Decimal('0.01')),
            'status': Payout.Status.PENDING_RELEASE,
        },
    )
    if not created and payout.status in [Payout.Status.TRANSFER_INITIATED, Payout.Status.PAID]:
        return payout  # already sent or in-flight

    provider = booking.provider
    try:
        if not provider.recipient_code:
            raise Exception('Provider has not completed payout setup.')

        reference = f'BKF-PO-{booking.id}-{uuid.uuid4().hex[:8].upper()}'
        result = paystack.initiate_transfer(
            amount_naira=payout.amount,
            recipient_code=provider.recipient_code,
            reference=reference,
            reason=f'BookNfix payout for booking #{booking.id}',
        )
        payout.status = Payout.Status.TRANSFER_INITIATED
        payout.transfer_code = result.get('transfer_code')
        payout.transfer_reference = result.get('reference', reference)
        payout.failure_reason = None
        Notification.objects.create(
            user=provider.user,
            title='Payout Initiated',
            message=f'Your earnings for booking #{booking.id} are on the way to your bank account.'
        )
    except Exception as e:
        payout.status = Payout.Status.PENDING_RELEASE
        payout.failure_reason = str(e)
        Notification.objects.create(
            user=provider.user,
            title='Payout Delayed',
            message=f'Payout for booking #{booking.id} could not be sent yet. Our team will retry automatically.'
        )

    payout.released_at = timezone.now()
    payout.save()
    return payout
