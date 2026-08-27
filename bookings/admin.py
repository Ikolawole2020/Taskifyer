from django.contrib import admin
from django.utils.html import format_html
from config.admin_site import admin_site
from .models import Booking, ChatRoom, Message

STATUS_COLORS = {
    "PENDING": "#d97706", "ACCEPTED": "#2563eb", "IN_PROGRESS": "#7c3aed",
    "AWAITING_CONFIRMATION": "#0891b2", "COMPLETED": "#16a34a",
    "CANCELLED": "#64748b", "DISPUTED": "#dc2626",
}


@admin.register(Booking, site=admin_site)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "customer", "provider", "status_badge", "price", "scheduled_date", "city", "created_at")
    list_filter = ("status", "city", "created_at")
    search_fields = ("title", "customer__username", "provider__user__username", "id")
    list_per_page = 25
    date_hierarchy = "created_at"
    readonly_fields = ("customer_confirmed_at", "created_at", "updated_at", "completed_at")
    fieldsets = (
        ("Parties", {"fields": ("customer", "provider", "service")}),
        ("Job", {"fields": ("title", "description", "status")}),
        ("Schedule & Location", {"fields": ("scheduled_date", "scheduled_time", "address", "city")}),
        ("Pricing & Notes", {"fields": ("price", "customer_note", "provider_note")}),
        ("Timestamps", {"fields": ("customer_confirmed_at", "completed_at", "created_at", "updated_at"), "classes": ("collapse",)}),
    )

    @admin.display(description="Status")
    def status_badge(self, obj):
        color = STATUS_COLORS.get(obj.status, "#64748b")
        return format_html('<span style="background:{};color:#fff;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">{}</span>', color, obj.status.replace("_", " ").title())


@admin.register(ChatRoom, site=admin_site)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ("id", "booking", "created_at")
    search_fields = ("booking__title",)


@admin.register(Message, site=admin_site)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("room", "sender", "short_content", "is_read", "timestamp")
    list_filter = ("is_read",)
    search_fields = ("sender__username", "content")

    @admin.display(description="Content")
    def short_content(self, obj):
        return obj.content[:60] + ("…" if len(obj.content) > 60 else "")
