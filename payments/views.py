import hashlib
import hmac
import json
import logging

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from bookings.models import Booking
from users.models import Notification
from . import paystack
from .models import Payment, Payout
from .services import get_or_create_payment, mark_payment_paid, release_for_booking

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def banks(request):
    """Proxy Paystack's bank list for the provider onboarding UI."""
    try:
        return Response({'banks': paystack.list_banks()})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resolve_account(request):
    account_number = request.data.get('account_number', '').strip()
    bank_code = request.data.get('bank_code', '').strip()
    if not account_number or not bank_code:
        return Response(
            {'error': 'account_number and bank_code are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    try:
        return Response(paystack.resolve_account(account_number, bank_code))
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def setup_payout(request):
    """
    Provider payout onboarding: validates the bank account via /bank/resolve,
    creates a transfer recipient, and stores everything on the profile.
    Body: { bank_name, bank_code, account_number }
    """
    user = request.user
    if user.role != 'PROVIDER':
        return Response({'error': 'Only providers can set up payouts.'}, status=status.HTTP_403_FORBIDDEN)
    provider = getattr(user, 'provider_profile', None)
    if not provider:
        return Response({'error': 'Provider profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    bank_name = request.data.get('bank_name', '').strip()
    bank_code = request.data.get('bank_code', '').strip()
    account_number = request.data.get('account_number', '').strip()
    if not all([bank_name, bank_code, account_number]):
        return Response({'error': 'bank_name, bank_code and account_number are required.'},
                        status=status.HTTP_400_BAD_REQUEST)

    try:
        resolved = paystack.resolve_account(account_number, bank_code)
        recipient_code = paystack.create_transfer_recipient(
            name=resolved['account_name'],
            account_number=account_number,
            bank_code=bank_code,
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    provider.bank_name = bank_name
    provider.bank_code = bank_code
    provider.account_number_last4 = account_number[-4:]
    provider.account_name = resolved['account_name']
    provider.recipient_code = recipient_code
    provider.payout_ready = True
    provider.save(update_fields=[
        'bank_name', 'bank_code', 'account_number_last4',
        'account_name', 'recipient_code', 'payout_ready',
    ])

    Notification.objects.create(
        user=user,
        title='Payout Account Linked',
        message=f'Payouts will be sent to your {bank_name} account ending in {account_number[-4:]}.'
    )
    return Response({
        'message': 'Payout account verified and linked successfully.',
        'account_name': resolved['account_name'],
        'bank_name': bank_name,
        'payout_ready': True,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def initialize(request, booking_id):
    """Customer initiates payment for a booking. Returns Paystack checkout URL."""
    try:
        booking = Booking.objects.get(pk=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.customer != request.user:
        return Response({'error': 'Only the customer can pay for this booking.'},
                        status=status.HTTP_403_FORBIDDEN)
    if booking.status == Booking.Status.CANCELLED:
        return Response({'error': 'This booking was cancelled.'}, status=status.HTTP_400_BAD_REQUEST)

    existing_payment = getattr(booking, 'payment', None)
    if existing_payment and existing_payment.status == Payment.Status.PAID:
        return Response({'error': 'This booking is already paid.'}, status=status.HTTP_400_BAD_REQUEST)

    payment = get_or_create_payment(booking)
    callback_url = f'{settings.SITE_URL}/booking-detail?ref={payment.reference}'
    try:
        data = paystack.initialize_transaction(
            email=request.user.email,
            amount_naira=booking.price,
            reference=payment.reference,
            callback_url=callback_url,
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'authorization_url': data['authorization_url'],
        'reference': payment.reference,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def payment_status(request, booking_id):
    """Payment/payout status for a booking; verifies with Paystack if still pending."""
    try:
        booking = Booking.objects.get(pk=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    payment = getattr(booking, 'payment', None)
    if payment and payment.status == Payment.Status.PENDING:
        # Fallback: webhook may have missed — ask Paystack directly
        try:
            data = paystack.verify_transaction(payment.reference)
            if data.get('status') == 'success':
                mark_payment_paid(payment, data)
        except Exception:
            pass

    payout = getattr(booking, 'payout', None)
    return Response({
        'payment_status': payment.status if payment else Payment.Status.PENDING,
        'payout_status': payout.status if payout else None,
        'reference': payment.reference if payment else None,
    })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def webhook(request):
    """
    Paystack webhook. Signature-verified with HMAC SHA512 of the raw body
    using the secret key. Handles charge.success, transfer.success,
    transfer.failed and transfer.reversed.
    """
    raw_body = request.body
    signature = request.headers.get('x-paystack-signature', '')
    computed = hmac.new(
        settings.PAYSTACK_SECRET_KEY.encode(), raw_body, hashlib.sha512
    ).hexdigest()
    if not hmac.compare_digest(computed, signature):
        logger.warning('Paystack webhook: invalid signature')
        return HttpResponse(status=401)

    event = json.loads(raw_body)
    event_type = event.get('event')
    data = event.get('data') or {}
    logger.info(f'Paystack webhook: {event_type} ref={data.get("reference")}')

    if event_type == 'charge.success':
        reference = data.get('reference')
        payment = Payment.objects.filter(reference=reference).select_related('booking').first()
        if payment:
            mark_payment_paid(payment, data)
            Notification.objects.create(
                user=payment.booking.customer,
                title='Payment Confirmed',
                message=f'Your payment for booking #{payment.booking_id} was received.'
            )

    elif event_type in ('transfer.success', 'transfer.failed', 'transfer.reversed'):
        transfer_code = data.get('transfer_code')
        payout = Payout.objects.filter(
            transfer_code=transfer_code
        ).select_related('booking', 'provider__user').first()

        if event_type == 'transfer.success':
            if payout and payout.status != Payout.Status.PAID:
                payout.status = Payout.Status.PAID
                payout.save(update_fields=['status'])
                booking = payout.booking
                provider = booking.provider
                provider.total_jobs_completed += 1
                provider.save(update_fields=['total_jobs_completed'])
                Notification.objects.create(
                    user=payout.provider.user,
                    title='Payout Complete',
                    message=f'Your earnings for booking #{booking.id} have been deposited.'
                )
        else:
            reason = data.get('reason') or 'Transfer failed'
            if payout:
                # Re-queue for retry by the scheduled task
                payout.status = Payout.Status.PENDING_RELEASE
                payout.failure_reason = f'{reason} (queued for retry)'
                payout.save(update_fields=['status', 'failure_reason'])
                Notification.objects.create(
                    user=payout.provider.user,
                    title='Payout Failed',
                    message=f'The payout for booking #{payout.booking_id} failed ({reason}). It will be retried.'
                )

    return HttpResponse(status=200)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_completion(request, booking_id):
    """
    Customer confirms the job is done -> releases escrow to the provider.
    Also called automatically after 48h by release_pending_payouts.
    """
    try:
        booking = Booking.objects.select_related('provider').get(pk=booking_id)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found.'}, status=status.HTTP_404_NOT_FOUND)

    if booking.customer != request.user:
        return Response({'error': 'Only the customer can confirm completion.'},
                        status=status.HTTP_403_FORBIDDEN)
    if booking.status != Booking.Status.AWAITING_CONFIRMATION:
        return Response(
            {'error': f'Cannot confirm a booking that is {booking.status.lower()}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    from django.db.models import F
    booking.status = Booking.Status.COMPLETED
    booking.completed_at = timezone.now()
    booking.customer_confirmed_at = timezone.now()
    booking.save(update_fields=['status', 'completed_at', 'customer_confirmed_at'])

    payout = release_for_booking(booking)

    # Jobs counter increments when payout settles (webhook) OR immediately if no payout possible
    if not payout or payout.status != Payout.Status.TRANSFER_INITIATED:
        booking.provider.total_jobs_completed = F('total_jobs_completed') + 1
        booking.provider.save(update_fields=['total_jobs_completed'])

    return Response({
        'message': 'Completion confirmed. Provider payout has been released.',
        'payout_status': payout.status if payout else None,
    })


