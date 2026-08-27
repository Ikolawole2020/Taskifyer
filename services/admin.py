from django.contrib import admin
from config.admin_site import admin_site
from .models import Category, Service


@admin.register(Category, site=admin_site)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Service, site=admin_site)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "provider", "category", "price", "duration_hours", "is_active", "created_at")
    list_filter = ("is_active", "category", "created_at")
    search_fields = ("title", "provider__user__username")
    list_per_page = 25
    date_hierarchy = "created_at"
