from django.db import models
from users.models import User, ProviderProfile, CustomerProfile
from services.models import Service


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        DISPUTED = "DISPUTED", "Disputed"

    customer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='customer_bookings',
        limit_choices_to={'role': 'CUSTOMER'}
    )
    provider = models.ForeignKey(
        ProviderProfile,
        on_delete=models.CASCADE,
        related_name='provider_bookings'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )

    # If the customer makes a custom request (not from a listed service)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    # Scheduling
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()

    # Location of the job
    address = models.TextField()
    city = models.CharField(max_length=100, default='Lagos')

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Extra
    customer_note = models.TextField(blank=True, null=True)
    provider_note = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Booking #{self.id} - {self.title} ({self.status})"


class ChatRoom(models.Model):
    booking = models.OneToOneField(
        Booking, 
        on_delete=models.CASCADE, 
        related_name='chat_room'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat for Booking #{self.booking.id}"


class Message(models.Model):
    room = models.ForeignKey(
        ChatRoom, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_messages'
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"Message from {self.sender.email} at {self.timestamp}"
    

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Booking)
def create_chat_room_for_booking(sender, instance, created, **kwargs):
    if created:
        ChatRoom.objects.create(booking=instance)

    
