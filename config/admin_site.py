"""
Custom BookNfix admin: branded header, KPI dashboard and cleaner navigation.
Single AdminSite instance shared by every app's admin module.
"""
from django.contrib.admin import AdminSite
from django.db.models import Sum, Count


class BookNfixAdminSite(AdminSite):
    site_header = "BookNfix Admin Portal"
    site_title = "BookNfix Admin"
    index_title = "Overview"
    enable_nav_sidebar = True
    # Hide the default "View site" link pointing at the API root
    site_url = None

    def index(self, request, extra_context=None):
        from users.models import User, ProviderProfile
        from bookings.models import Booking
        from payments.models import Payment, Payout
        from services.models import Service
        from reviews.models import Review

        context = extra_context or {}

        paid_amount = Payment.objects.filter(status="PAID").aggregate(t=Sum("amount"))["t"] or 0
        pending_payout_qs = Payout.objects.filter(status="PENDING_RELEASE")
        pending_payout_sum = pending_payout_qs.aggregate(t=Sum("amount"))["t"] or 0
        pending_payout_count = pending_payout_qs.count()

        from django.utils.formats import number_format

        def naira(d, places=2):
            return f"₦{number_format(d, decimal_pos=places, use_l10n=False)}"

        context["kpis"] = [
            {"label": "Total Users", "value": User.objects.count(),
             "accent": "blue", "icon": "person"},
            {"label": "Customers", "value": User.objects.filter(role="CUSTOMER").count(),
             "accent": "teal", "icon": "people"},
            {"label": "Providers", "value": User.objects.filter(role="PROVIDER").count(),
             "accent": "orange", "icon": "build"},
            {"label": "Pending Verifications",
             "value": ProviderProfile.objects.filter(is_verified=False)
             .exclude(verification_status="UNVERIFIED").count(),
             "accent": "amber", "icon": "verified"},
            {"label": "Total Bookings", "value": Booking.objects.count(),
             "accent": "blue", "icon": "calendar"},
            {"label": "Live Bookings",
             "value": Booking.objects.exclude(status__in=["COMPLETED", "CANCELLED"]).count(),
             "accent": "teal", "icon": "bolt"},
            {"label": "Awaiting Confirmation",
             "value": Booking.objects.filter(status="AWAITING_CONFIRMATION").count(),
             "accent": "cyan", "icon": "done"},
            {"label": "Escrow Collected", "value": naira(paid_amount),
             "accent": "green", "icon": "payments"},
            {"label": "Pending Payouts",
             "value": f"{pending_payout_count} · {naira(pending_payout_sum)}",
             "accent": "orange", "icon": "pay"},
            {"label": "Reward Points / Reviews",
             "value": Review.objects.count(), "accent": "purple", "icon": "star"},
            {"label": "Listed Services",
             "value": Service.objects.filter(is_active=True).count(),
             "accent": "purple", "icon": "list"},
        ]

        context["recent_bookings"] = Booking.objects.select_related(
            "customer", "provider", "service"
        ).order_by("-created_at")[:6]

        context["pending_verifications_list"] = (
            ProviderProfile.objects.select_related("user")
            .filter(is_verified=False)
            .exclude(verification_status="UNVERIFIED")
            .order_by("-created_at")[:6]
        )

        return super().index(request, extra_context=context)


admin_site = BookNfixAdminSite(name="booknfix_admin")