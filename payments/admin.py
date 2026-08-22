from django.contrib import admin
from .models import Payment, Payout


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'reference', 'amount', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('reference', 'booking__title')


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ('id', 'booking', 'provider', 'amount', 'platform_fee', 'status', 'released_at')
    list_filter = ('status',)
    search_fields = ('transfer_code', 'transfer_reference')
