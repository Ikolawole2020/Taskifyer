from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, CustomerProfile, ProviderProfile, PushToken


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'is_verified', 'is_staff')
    list_filter = ('role', 'is_verified', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Info', {'fields': ('role', 'phone_number', 'is_verified')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Extra Info', {'fields': ('role', 'phone_number', 'is_verified')}),
    )


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'created_at')
    search_fields = ('user__username', 'user__email', 'city')


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'city', 'is_verified', 'verification_status', 'is_available', 'average_rating', 'total_jobs_completed')
    list_filter = ('verification_status', 'is_verified', 'is_available', 'city')
    search_fields = ('user__username', 'user__email', 'city')
    readonly_fields = ('id_document',)
    actions = ['approve_verification', 'reject_verification']

    @admin.action(description='Approve verification (marks provider verified)')
    def approve_verification(self, request, queryset):
        for provider in queryset:
            provider.verification_status = ProviderProfile.VerificationStatus.APPROVED
            provider.is_verified = True
            provider.save(update_fields=['verification_status', 'is_verified'])
        self.message_user(request, f"{queryset.count()} provider(s) approved.")

    @admin.action(description='Reject verification')
    def reject_verification(self, request, queryset):
        for provider in queryset:
            provider.verification_status = ProviderProfile.VerificationStatus.REJECTED
            provider.verification_note = "Document could not be validated. Please resubmit."
            provider.save(update_fields=['verification_status', 'verification_note'])
        self.message_user(request, f"{queryset.count()} provider(s) rejected.")


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token', 'platform', 'created_at')
    search_fields = ('user__username', 'token')