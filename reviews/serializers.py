from rest_framework import serializers
from .models import Review
from users.serializers import UserSerializer


class ReviewSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    customer_name = serializers.CharField(source='customer.username', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'booking',
            'customer',
            'customer_name',
            'provider',
            'rating',
            'comment',
            'created_at'
        ]
        read_only_fields = ['customer', 'provider']