from django.contrib import admin
from .models import QueuedPush


@admin.register(QueuedPush)
class QueuedPushAdmin(admin.ModelAdmin):
    list_display = ('id', 'token', 'title', 'status', 'attempts', 'created_at')
    list_filter = ('status',)

