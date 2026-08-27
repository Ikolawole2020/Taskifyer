from django.contrib import admin
from config.admin_site import admin_site
from .models import QueuedPush


@admin.register(QueuedPush, site=admin_site)
class QueuedPushAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "token", "status", "attempts", "created_at", "sent_at")
    list_filter = ("status",)
    search_fields = ("title", "token")
    readonly_fields = ("created_at", "sent_at")
