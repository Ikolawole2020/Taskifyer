from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Booking, ChatRoom, Message
from .serializers import BookingSerializer, ChatRoomSerializer, MessageSerializer
from users.models import Notification
from core.push import send_push_to_user


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.role == 'PROVIDER':
            return Booking.objects.filter(provider__user=user).select_related(
                'customer', 'provider__user', 'service'
            )
        
        return Booking.objects.filter(customer=user).select_related(
            'customer', 'provider__user', 'service'
        )

    def perform_create(self, serializer):
        booking = serializer.save(customer=self.request.user)

        # Notify the provider about the new booking request
        Notification.objects.create(
            user=booking.provider.user,
            title="New Booking Request",
            message=f"{self.request.user.username} requested your service: {booking.title or booking.service.title}"
        )
        send_push_to_user(booking.provider.user, "New Booking Request", f"{self.request.user.username} requested your service: {booking.title or booking.service.title}", {"bookingId": booking.id})

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        booking = self.get_object()
        if request.user.role != 'PROVIDER' or booking.provider.user != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        
        booking.status = Booking.Status.ACCEPTED
        booking.save()

        # Notify the customer
        Notification.objects.create(
            user=booking.customer,
            title="Booking Accepted",
            message=f"Your booking for '{booking.title or booking.service.title}' has been accepted."
        )
        send_push_to_user(booking.customer, "Booking Accepted", f"Your booking '{booking.title or booking.service.title}' has been accepted.", {"bookingId": booking.id})

        return Response({"message": "Booking accepted", "status": booking.status})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        if request.user.role != 'PROVIDER' or booking.provider.user != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        
        booking.status = Booking.Status.CANCELLED
        booking.save()

        # Notify the customer
        Notification.objects.create(
            user=booking.customer,
            title="Booking Declined",
            message=f"Your booking for '{booking.title or booking.service.title}' was declined."
        )
        send_push_to_user(booking.customer, "Booking Declined", f"Your booking '{booking.title or booking.service.title}' was declined.", {"bookingId": booking.id})

        return Response({"message": "Booking rejected", "status": booking.status})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Provider marks the job done. Status becomes AWAITING_CONFIRMATION —
        the customer confirms (or 48h auto-confirm) before payout is released.
        """
        booking = self.get_object()
        if request.user.role != 'PROVIDER' or booking.provider.user != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        if booking.status not in [Booking.Status.ACCEPTED, Booking.Status.IN_PROGRESS]:
            return Response(
                {"error": f"Cannot complete a booking that is {booking.status.lower()}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = Booking.Status.AWAITING_CONFIRMATION
        booking.completed_at = timezone.now()
        booking.save(update_fields=['status', 'completed_at'])

        # Notify the customer to confirm completion
        Notification.objects.create(
            user=booking.customer,
            title="Job Marked Complete",
            message=(f"The provider marked '{booking.title or booking.service.title}' as done. "
                     "Please confirm to release payment. Auto-confirms in 48 hours.")
        )
        from core.push import send_push_to_user
        send_push_to_user(booking.customer, "Confirm Job Completion",
                          f"Please confirm booking #{booking.id} to release payment.",
                          {"bookingId": booking.id})

        return Response({"message": "Job marked as done. Awaiting customer confirmation.",
                         "status": booking.status})

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Customer cancels their own booking (only while PENDING or ACCEPTED)."""
        booking = self.get_object()
        if booking.customer != request.user:
            return Response({"error": "Only the customer can cancel this booking."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status not in [Booking.Status.PENDING, Booking.Status.ACCEPTED]:
            return Response(
                {"error": f"Cannot cancel a booking that is {booking.status.lower()}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "")
        booking.status = Booking.Status.CANCELLED
        booking.customer_note = reason or booking.customer_note
        booking.save()

        # Notify the provider
        Notification.objects.create(
            user=booking.provider.user,
            title="Booking Cancelled",
            message=f"{request.user.username} cancelled the booking "
                    f"'{booking.title or (booking.service.title if booking.service else '')}'."
                    + (f" Reason: {reason}" if reason else "")
        )
        send_push_to_user(booking.provider.user, "Booking Cancelled", f"{request.user.username} cancelled booking #{booking.id}.", {"bookingId": booking.id})

        return Response({"message": "Booking cancelled", "status": booking.status})

    @action(detail=True, methods=['post'])
    def dispute(self, request, pk=None):
        """Either party can flag an active/completed booking as disputed."""
        booking = self.get_object()
        is_customer = booking.customer == request.user
        is_provider = request.user.role == 'PROVIDER' and booking.provider.user == request.user
        if not (is_customer or is_provider):
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        if booking.status == Booking.Status.DISPUTED:
            return Response({"error": "Booking is already disputed."}, status=status.HTTP_400_BAD_REQUEST)
        if booking.status == Booking.Status.CANCELLED:
            return Response({"error": "Cannot dispute a cancelled booking."}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get("reason", "")
        booking.status = Booking.Status.DISPUTED
        booking.save()

        # Notify the other party
        other_user = booking.provider.user if is_customer else booking.customer
        Notification.objects.create(
            user=other_user,
            title="Booking Disputed",
            message=f"A dispute was opened on booking #{booking.id}"
                    + (f". Reason: {reason}" if reason else ".")
        )
        send_push_to_user(other_user, "Booking Disputed", f"A dispute was opened on booking #{booking.id}.", {"bookingId": booking.id})

        return Response({"message": "Dispute opened. Our team will review it.", "status": booking.status})


class ChatRoomViewSet(viewsets.ModelViewSet):
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ChatRoom.objects.filter(
            Q(booking__customer=user) | Q(booking__provider__user=user)
        ).select_related('booking', 'booking__customer', 'booking__provider__user')


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_id = self.request.query_params.get('room')
        if room_id:
            return Message.objects.filter(room_id=room_id).select_related('sender')
        return Message.objects.none()

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)