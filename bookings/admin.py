from django.contrib import admin
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'title', 'customer', 'provider', 'status',
        'scheduled_date', 'price', 'city', 'created_at'
    )
    list_filter = ('status', 'city', 'scheduled_date', 'created_at')
    search_fields = ('title', 'customer__username', 'provider__user__username', 'address')
    list_select_related = ('customer', 'provider', 'service')
    readonly_fields = ('created_at', 'updated_at', 'completed_at')