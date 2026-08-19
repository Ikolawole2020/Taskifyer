from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer', 'provider', 'rating', 'booking', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('customer__username', 'provider__user__username', 'comment')
    list_select_related = ('customer', 'provider', 'booking')
    readonly_fields = ('created_at', 'updated_at')