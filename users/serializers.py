import random
import traceback
import requests
from django.conf import settings
from rest_framework import serializers
from .models import User, CustomerProfile, ProviderProfile, PortfolioImage


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'phone_number',
            'role',
            'profile_picture',
            'is_verified',
        ]
        read_only_fields = ['id', 'username', 'email', 'role', 'is_verified']


class CustomerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CustomerProfile
        fields = ['id', 'user', 'address', 'city', 'created_at']


class SimpleServiceSerializer(serializers.ModelSerializer):
    """Lightweight service serializer to avoid circular imports"""
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        from services.models import Service
        model = Service
        fields = [
            'id', 'title', 'description', 'price',
            'duration_hours', 'category_name', 'is_active'
        ]


class PortfolioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioImage
        fields = ['id', 'provider', 'image', 'caption', 'created_at']
        read_only_fields = ['provider', 'created_at']


class ProviderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    services = serializers.SerializerMethodField()
    portfolio_images = PortfolioImageSerializer(many=True, read_only=True)

    class Meta:
        model = ProviderProfile
        fields = [
            'id', 'user', 'bio', 'years_of_experience', 'is_available',
            'is_verified', 'city', 'address', 'average_rating',
            'total_reviews', 'total_jobs_completed', 'created_at', 'services', 'portfolio_images'
        ]

    def get_services(self, obj):
        services = obj.services.filter(is_active=True)
        return SimpleServiceSerializer(services, many=True).data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=User.Role.choices)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'role']

    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')

        # If a user exists but is NOT verified, delete the old unverified account so they can re-register cleanly
        if email and User.objects.filter(email=email, is_verified=False).exists():
            User.objects.filter(email=email, is_verified=False).delete()
        if username and User.objects.filter(username=username, is_verified=False).exists():
            User.objects.filter(username=username, is_verified=False).delete()

        return attrs

    def create(self, validated_data):
        role = validated_data.get('role', User.Role.CUSTOMER)
        
        # Generate a random 6-digit code
        code = str(random.randint(100000, 999999))
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            role=role,
            is_verified=False,
            verification_code=code
        )
        
        if role == User.Role.CUSTOMER:
            CustomerProfile.objects.create(user=user)
        elif role == User.Role.PROVIDER:
            ProviderProfile.objects.create(user=user)

        # Send the verification email via EmailJS REST API
        try:
            url = "https://api.emailjs.com/api/v1.0/email/send"
            payload = {
                "service_id": getattr(settings, 'EMAILJS_SERVICE_ID', ''),
                "template_id": getattr(settings, 'EMAILJS_TEMPLATE_ID', ''),
                "user_id": getattr(settings, 'EMAILJS_PUBLIC_KEY', ''),
                "template_params": {
                    "to_email": user.email,
                    "to_name": user.username,
                    "code": code,
                }
            }
            response = requests.post(url, json=payload)
            if response.status_code != 200:
                raise Exception(f"EmailJS error: {response.text}")
        except Exception as e:
            traceback.print_exc()
            print(f"EMAILJS ERROR: {repr(e)}")
            raise serializers.ValidationError(f"Email delivery failed: {str(e)}")

        return user


from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at']


from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import AuthenticationFailed

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Check if the user is verified
        if not self.user.is_verified:
            raise AuthenticationFailed(
                "Please verify your email address before logging in. Check your inbox for the verification code.",
                code="email_not_verified"
            )
            
        # Include user details in the token response if helpful
        data['role'] = self.user.role
        data['username'] = self.user.username
        data['email'] = self.user.email
        return data
    
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    new_password = serializers.CharField(min_length=8, write_only=True)    
    
