from rest_framework import serializers
from .models import Booking, ChatRoom, Message
from users.models import ProviderProfile
from users.serializers import UserSerializer, ProviderProfileSerializer
from services.serializers import ServiceSerializer
from services.models import Service


class BookingSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    provider = ProviderProfileSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)

    # Write-only fields for creating a booking
    # NOTE: query full set here and validate verification/availability manually below,
    # so unverified/offline providers get a clear, friendly error instead of a raw
    # "Invalid pk" DRF message.

    provider_id = serializers.PrimaryKeyRelatedField(
        queryset=ProviderProfile.objects.all(),
        source='provider',
        write_only=True
    )
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.filter(is_active=True),
        source='service',
        write_only=True,
        required=False,
        allow_null=True
    )

    def validate(self, attrs):
        provider = attrs.get('provider')
        if provider and not provider.is_verified:
            raise serializers.ValidationError(
                {'provider_id': 'This provider is not verified yet. Please try another provider.'}
            )
        if provider and not provider.is_available:
            raise serializers.ValidationError(
                {'provider_id': 'This provider is currently unavailable. Please try another provider.'}
            )
        return attrs

    class Meta:
        model = Booking
        fields = [
            'id',
            'customer',
            'provider',
            'provider_id',
            'service',
            'service_id',
            'title',
            'description',
            'status',
            'scheduled_date',
            'scheduled_time',
            'address',
            'city',
            'price',
            'customer_note',
            'provider_note',
            'chat_room',
            'created_at',
            'updated_at',
            'completed_at'
        ]
        read_only_fields = ['customer', 'status', 'completed_at', 'chat_room']


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.email')

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'sender_name', 'content', 'timestamp', 'is_read']
        read_only_fields = ['sender', 'timestamp']


class ChatRoomSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    booking_title = serializers.ReadOnlyField(source='booking.title')

    class Meta:
        model = ChatRoom
        fields = ['id', 'booking', 'booking_title', 'created_at', 'messages']