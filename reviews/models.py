from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User, ProviderProfile
from bookings.models import Booking


class Review(models.Model):
    booking = models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='review'
    )
    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given',
        limit_choices_to={'role': 'CUSTOMER'}
    )
    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name='reviews_received'
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        # Prevent a customer from reviewing the same provider multiple times for different bookings? 
        # We allow one review per booking (already enforced by OneToOne)

    def __str__(self):
        return f"Review {self.rating}★ by {self.customer.username} for {self.provider.user.username}"