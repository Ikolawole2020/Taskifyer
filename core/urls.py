from django.urls import path
from . import queue_views

urlpatterns = [
    path('outbound/', queue_views.outbound_pushes),
    path('report-failures/', queue_views.report_failures),
]
