from django.http import HttpResponse
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from . import views

def payment_callback(request):
    """Landing page Paystack redirects the customer's browser to after checkout.
    Payment status itself is confirmed via webhook / API verification — this
    page is purely informational."""
    ref = request.GET.get('reference', '')
    return HttpResponse(
        f"""
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body {{ font-family: -apple-system, sans-serif; background:#070b14;
                     color:#fff; display:flex; align-items:center;
                     justify-content:center; height:100vh; text-align:center; }}
              .box {{ max-width:400px; padding:20px; }}
              h1 {{ color:#34d399; font-size:22px; }}
              p {{ color:#94a3b8; font-size:14px; line-height:1.6; }}
            </style>
          </head>
          <body>
            <div class="box">
              <h1>✓ Payment Received</h1>
              <p>Your payment was processed successfully.</p>
              <p>You can close this page and return to the BookNfix app to see
                 your booking status.</p>
              <p style="font-size:11px;color:#475569">Ref: {ref}</p>
            </div>
          </body>
        </html>
        """,
        content_type='text/html',
    )

urlpatterns = [
    path('banks/', views.banks),
    path('callback/', payment_callback),
    path('resolve-account/', views.resolve_account),
    path('setup-payout/', views.setup_payout),
    path('initialize/<int:booking_id>/', views.initialize),
    path('status/<int:booking_id>/', views.payment_status),
    path('confirm-completion/<int:booking_id>/', views.confirm_completion),
    path('webhook/', views.webhook),
]
