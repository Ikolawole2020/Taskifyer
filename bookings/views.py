from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Booking, ChatRoom, Message
from .serializers import BookingSerializer, ChatRoomSerializer, MessageSerializer
from users.models import Notification


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

        return Response({"message": "Booking rejected", "status": booking.status})

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        booking = self.get_object()
        if request.user.role != 'PROVIDER' or booking.provider.user != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)
        
        booking.status = Booking.Status.COMPLETED
        booking.completed_at = timezone.now()
        booking.save()

        # Update provider's completed jobs count
        provider = booking.provider
        provider.total_jobs_completed += 1
        provider.save(update_fields=['total_jobs_completed'])

        # Notify the customer
        Notification.objects.create(
            user=booking.customer,
            title="Job Completed",
            message=f"Your booking for '{booking.title or booking.service.title}' has been marked as completed."
        )

        return Response({"message": "Booking marked as completed", "status": booking.status})


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