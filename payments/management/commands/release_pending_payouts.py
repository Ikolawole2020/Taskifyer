from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from bookings.models import Booking


class Command(BaseCommand):
    help = (
        'Auto-confirms AWAITING_CONFIRMATION bookings older than 48 hours and '
        'releases/retries pending provider payouts. '
        'Run hourly via a PythonAnywhere scheduled task.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--hours', type=int, default=48)

    def handle(self, *args, **options):
        from payments.services import release_for_booking

        cutoff = timezone.now() - timedelta(hours=options['hours'])

        stale_bookings = Booking.objects.filter(
            status=Booking.Status.AWAITING_CONFIRMATION,
            updated_at__lte=cutoff,
        ).select_related('provider')

        confirmed = 0
        for booking in stale_bookings:
            booking.status = Booking.Status.COMPLETED
            booking.completed_at = timezone.now()
            booking.save(update_fields=['status', 'completed_at'])
            release_for_booking(booking)
            confirmed += 1
            self.stdout.write(f'Auto-confirmed booking #{booking.id}')

        # Retry payouts that failed earlier (e.g. Paystack downtime)
        retried = 0
        pending_payouts = Booking.objects.filter(
            status=Booking.Status.COMPLETED,
            payout__status='PENDING_RELEASE',
        ).select_related('provider')
        for booking in pending_payouts:
            release_for_booking(booking)
            retried += 1

        self.stdout.write(self.style.SUCCESS(
            f'Done: {confirmed} booking(s) auto-confirmed, {retried} payout(s) processed.'
        ))
