from django.contrib import admin
from config.admin_site import admin_site
from .models import Review


@admin.register(Review, site=admin_site)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("stars", "customer", "provider", "short_comment", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("customer__username", "provider__user__username", "comment")
    date_hierarchy = "created_at"

    @admin.display(description="Rating")
    def stars(self, obj):
        return "★" * obj.rating + "☆" * (5 - obj.rating)

    @admin.display(description="Comment")
    def short_comment(self, obj):
        if not obj.comment:
            return "—"
        return obj.comment[:50] + ("…" if len(obj.comment) > 50 else "")
