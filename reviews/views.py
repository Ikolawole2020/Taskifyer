from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db.models import Avg, Count
from .models import Review
from .serializers import ReviewSerializer
from bookings.models import Booking
from users.models import create_notification


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all().select_related('customer', 'provider__user', 'booking')
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Review.objects.all().select_related('customer', 'provider__user', 'booking')

        provider_id = self.request.query_params.get('provider')
        if provider_id:
            return queryset.filter(provider_id=provider_id)

        user = self.request.user
        if user.is_authenticated:
            if user.role == 'PROVIDER':
                return queryset.filter(provider__user=user)
            return queryset.filter(customer=user)

        return queryset.none()

    def create(self, request, *args, **kwargs):
        booking_id = request.data.get('booking')

        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)

        if booking.customer != request.user:
            return Response({"error": "Not allowed"}, status=status.HTTP_403_FORBIDDEN)

        if booking.status != Booking.Status.COMPLETED:
            return Response(
                {"error": "You can only review completed bookings"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if hasattr(booking, 'review'):
            return Response(
                {"error": "You have already reviewed this booking"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(
            customer=request.user,
            provider=booking.provider
        )

        # Update provider rating
        provider = booking.provider
        stats = Review.objects.filter(provider=provider).aggregate(
            avg_rating=Avg('rating'),
            total=Count('id')
        )

        provider.average_rating = round(stats['avg_rating'] or 0, 2)
        provider.total_reviews = stats['total'] or 0
        provider.save(update_fields=['average_rating', 'total_reviews'])

        # Notify the provider
        create_notification(
            user=provider.user,
            title="New Review Received",
            message=f"{request.user.username} left a {review.rating}-star review on your service."
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)