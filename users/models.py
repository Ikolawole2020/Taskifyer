from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        PROVIDER = "PROVIDER", "Provider"
        ADMIN = "ADMIN", "Admin"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER
    )

    phone_number = models.CharField(max_length=20, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    profile_picture = models.ImageField(
    upload_to='profiles/',
    blank=True,
    null=True
    )
    # Add this inside your User model in users/models.py
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    # Add this field to your custom User model if it's not already there
    reset_code = models.CharField(max_length=6, blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"


class CustomerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, default='Lagos')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Customer: {self.user.username}"


class ProviderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    
    bio = models.TextField(blank=True, null=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    
    city = models.CharField(max_length=100, default='Lagos')
    address = models.TextField(blank=True, null=True)
    
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_reviews = models.PositiveIntegerField(default=0)
    total_jobs_completed = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Provider: {self.user.username}"
    
class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.user.username}"

def create_notification(user, title, message):
    """
    Helper to create a notification for a user
    """
    from .models import Notification
    Notification.objects.create(
        user=user,
        title=title,
        message=message
    )


class PortfolioImage(models.Model):
    provider = models.ForeignKey(
        ProviderProfile, 
        on_delete=models.CASCADE, 
        related_name='portfolio_images'
    )
    image = models.ImageField(upload_to='portfolio/')
    caption = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Portfolio for {self.provider.user.username} - {self.id}"

