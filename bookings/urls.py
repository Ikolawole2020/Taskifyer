from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, ChatRoomViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'chat-rooms', ChatRoomViewSet, basename='chatroom')
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
]