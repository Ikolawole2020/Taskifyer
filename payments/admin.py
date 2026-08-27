from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum
from config.admin_site import admin_site
from .models import Payment, Payout

PAY_COLORS = {"PAID": "#16a34a", "PENDING": "#d97706", "FAILED": "#dc2626"}
PO_COLORS = {"PAID": "#16a34a", "PENDING_RELEASE": "#d97706", "TRANSFER_INITIATED": "#2563eb", "FAILED": "#dc2626"}


@admin.register(Payment, site=admin_site)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("reference", "booking", "amount", "status_badge", "paystack_paid_at", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("reference", "booking__title")
    date_hierarchy = "created_at"
    readonly_fields = ("reference", "raw_response", "created_at")

    @admin.display(description="Status")
    def status_badge(self, obj):
        color = PAY_COLORS.get(obj.status, "#64748b")
        return format_html('<span style="background:{};color:#fff;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">{}</span>', color, obj.status)


@admin.register(Payout, site=admin_site)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ("booking", "provider", "amount", "platform_fee", "status_badge", "released_at")
    list_filter = ("status", "created_at")
    search_fields = ("provider__user__username", "transfer_reference")
    date_hierarchy = "created_at"
    readonly_fields = ("transfer_code", "transfer_reference", "failure_reason", "released_at", "created_at")

    @admin.display(description="Status")
    def status_badge(self, obj):
        color = PO_COLORS.get(obj.status, "#64748b")
        return format_html('<span style="background:{};color:#fff;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">{}</span>', color, obj.status.replace("_", " ").title())

    def changelist_view(self, request, extra_context=None):
        resp = super().changelist_view(request, extra_context)
        try:
            qs = resp.context_data["cl"].queryset
            resp.context_data["payouts_total"] = qs.aggregate(t=Sum("amount"))["t"] or 0
        except (AttributeError, KeyError):
            pass
        return resp
