from django.contrib import admin
from django.utils.html import format_html
from config.admin_site import admin_site
from .models import User, CustomerProfile, ProviderProfile, PushToken, Notification, PortfolioImage


@admin.action(description="Mark selected users as email-verified")
def make_verified(modeladmin, request, queryset):
    queryset.update(is_verified=True)


@admin.action(description="Un-verify selected users")
def make_unverified(modeladmin, request, queryset):
    queryset.update(is_verified=False)


class UserAdmin(admin.ModelAdmin):
    list_display = ("avatar", "username", "email", "role", "is_verified", "date_joined")
    list_filter = ("role", "is_verified", "is_active", "date_joined")
    search_fields = ("username", "email", "phone_number")
    list_per_page = 25
    actions = [make_verified, make_unverified]
    readonly_fields = ("last_login", "date_joined")
    fieldsets = (
        ("Account", {"fields": ("username", "email", "role", "phone_number", "profile_picture")}),
        ("Verification", {"fields": ("is_verified", "verification_code", "reset_code")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
                         "classes": ("collapse",)}),
        ("Dates", {"fields": ("last_login", "date_joined"), "classes": ("collapse",)}),
    )

    @admin.display(description="")
    def avatar(self, obj):
        if obj.profile_picture:
            return format_html('<img src="{}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" />', obj.profile_picture.url)
        return format_html('<div style="width:36px;height:36px;border-radius:50%;background:#e2e8f0;color:#64748b;text-align:center;line-height:36px;font-weight:700;">{}</div>', obj.username[:1].upper())


class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "created_at")
    search_fields = ("user__username", "user__email", "city")
    list_filter = ("city",)


VERIFICATION_BADGE_COLORS = {
    "APPROVED": "#16a34a", "PENDING": "#d97706", "REJECTED": "#dc2626", "UNVERIFIED": "#64748b",
}


class PortfolioInline(admin.TabularInline):
    model = PortfolioImage
    extra = 0


class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "city", "verification_badge", "payout_ready", "average_rating", "total_jobs_completed", "is_available")
    list_filter = ("verification_status", "payout_ready", "is_available", "city")
    search_fields = ("user__username", "user__email", "bank_name", "account_name")
    list_per_page = 25
    inlines = [PortfolioInline]
    readonly_fields = ("average_rating", "total_reviews", "total_jobs_completed", "recipient_code")
    fieldsets = (
        ("Provider", {"fields": ("user", "bio", "years_of_experience", "is_available", "city", "address")}),
        ("KYC Verification", {"fields": ("verification_status", "id_document_type", "id_document", "verification_note")}),
        ("Payout Account (Paystack)", {"fields": ("bank_name", "bank_code", "account_number_last4", "account_name", "recipient_code", "payout_ready")}),
        ("Stats (auto)", {"fields": ("average_rating", "total_reviews", "total_jobs_completed"), "classes": ("collapse",)}),
    )

    @admin.display(description="Verification")
    def verification_badge(self, obj):
        color = VERIFICATION_BADGE_COLORS.get(obj.verification_status, "#64748b")
        return format_html('<span style="background:{};color:#fff;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;">{}</span>', color, obj.verification_status.replace("_", " ").title())

    @admin.action(description="✓ Approve verification (badge ON)")
    def approve_verification(self, request, queryset):
        queryset.update(verification_status="APPROVED", is_verified=True, verification_note="")

    @admin.action(description="✗ Reject verification")
    def reject_verification(self, request, queryset):
        queryset.update(verification_status="REJECTED", is_verified=False,
                        verification_note="Document could not be validated. Please resubmit a clearer ID.")

    actions = [approve_verification, reject_verification]


class PushTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "token", "created_at")
    list_filter = ("platform",)
    search_fields = ("user__username", "token")


class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("title", "user__username")


class PortfolioImageAdmin(admin.ModelAdmin):
    list_display = ("provider", "caption", "created_at")
    search_fields = ("provider__user__username",)


admin_site.register(User, UserAdmin)
admin_site.register(CustomerProfile, CustomerProfileAdmin)
admin_site.register(ProviderProfile, ProviderProfileAdmin)
admin_site.register(PushToken, PushTokenAdmin)
admin_site.register(Notification, NotificationAdmin)
admin_site.register(PortfolioImage, PortfolioImageAdmin)
