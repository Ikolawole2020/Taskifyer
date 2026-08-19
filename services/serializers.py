from rest_framework import serializers
from .models import Category, Service
from users.serializers import ProviderProfileSerializer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description']


class ServiceSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    provider = ProviderProfileSerializer(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Service
        fields = [
            'id',
            'title',
            'description',
            'price',
            'duration_hours',
            'image',
            'is_active',
            'category',
            'category_id',
            'provider',
            'created_at',
        ]
        read_only_fields = ['provider']