import random
import requests
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User, CustomerProfile, ProviderProfile, PortfolioImage, Notification
from .serializers import (
    CustomerProfileSerializer,
    ProviderProfileSerializer,
    RegisterSerializer,
    UserSerializer,
    PortfolioImageSerializer,
    NotificationSerializer,
    CustomTokenObtainPairSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
)


class ProviderProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve provider profiles (public).
    """
    queryset = ProviderProfile.objects.all().select_related('user')
    serializer_class = ProviderProfileSerializer
    permission_classes = [AllowAny]


class CustomerProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Only the logged-in customer can see their own profile.
    """
    queryset = CustomerProfile.objects.all()
    serializer_class = CustomerProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerProfile.objects.filter(user=self.request.user)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "message": "User registered successfully",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role
                }
            }, status=status.HTTP_201_CREATED)
        
        # This will print the exact validation error to your terminal
        print("VALIDATION ERROR DETAILS:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        user.delete()
        return Response({"message": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class MyProviderProfileView(APIView):
    """
    Allows a provider to view and update their own profile
    (bio, city, years_of_experience, etc.)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'PROVIDER':
            return Response(
                {"error": "Only providers can access this"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            profile = request.user.provider_profile
            serializer = ProviderProfileSerializer(profile)
            return Response(serializer.data)
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    def patch(self, request):
        if request.user.role != 'PROVIDER':
            return Response(
                {"error": "Only providers can access this"},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            profile = request.user.provider_profile
            serializer = ProviderProfileSerializer(
                profile,
                data=request.data,
                partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except ProviderProfile.DoesNotExist:
            return Response(
                {"error": "Provider profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PortfolioImageViewSet(viewsets.ModelViewSet):
    serializer_class = PortfolioImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            return PortfolioImage.objects.filter(provider_id=provider_id)
        return PortfolioImage.objects.all()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'PROVIDER':
            raise ValidationError("Only service providers can upload portfolio images.")
        
        try:
            provider_profile = user.provider_profile
        except ProviderProfile.DoesNotExist:
            raise ValidationError("Provider profile not found.")
            
        serializer.save(provider=provider_profile)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response(
                {"error": "Email and verification code are required."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        user = get_object_or_404(User, email=email)

        if user.is_verified:
            return Response({"message": "Email is already verified."}, status=status.HTTP_200_OK)

        if user.verification_code == code:
            user.is_verified = True
            user.verification_code = None  # Clear the code after successful verification
            user.save()
            return Response({"message": "Email verified successfully! You can now log in."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = User.objects.get(email=email)
            
            # Generate a 6-digit reset code
            code = str(random.randint(100000, 999999))
            user.reset_code = code
            user.save()

            # Send the reset email via EmailJS
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
                return Response({"error": f"Email delivery failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"message": "Password reset code sent to your email."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']
            new_password = serializer.validated_data['new_password']

            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            if user.reset_code != code:
                return Response({"error": "Invalid reset code."}, status=status.HTTP_400_BAD_REQUEST)

            # Set new password and clear the reset code
            user.set_password(new_password)
            user.reset_code = None
            user.save()

            return Response({"message": "Password reset successfully! You can now log in with your new password."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)    
    
    
    
    