from django.urls import path
from . import views

urlpatterns = [
    path('banks/', views.banks),
    path('resolve-account/', views.resolve_account),
    path('setup-payout/', views.setup_payout),
    path('initialize/<int:booking_id>/', views.initialize),
    path('status/<int:booking_id>/', views.payment_status),
    path('confirm-completion/<int:booking_id>/', views.confirm_completion),
    path('webhook/', views.webhook),
]
