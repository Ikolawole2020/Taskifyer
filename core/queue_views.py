import json

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


def _queue_token_valid(request) -> bool:
    token = request.headers.get('X-Queue-Token', '')
    expected = getattr(settings, 'PUSH_QUEUE_TOKEN', '')
    return bool(expected) and token == expected


@api_view(['GET'])
@permission_classes([AllowAny])
def outbound_pushes(request):
    """
    Polled by the external relay (GitHub Actions). Returns and claims pending
    pushes. Protected by a shared secret header — not user-facing.
    """
    from .models import QueuedPush

    if not _queue_token_valid(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    batch = list(QueuedPush.objects.filter(status='PENDING')[:50])
    ids = [q.id for q in batch]
    # Claim immediately so the next poll doesn't double-send; relay reports back.
    if ids:
        QueuedPush.objects.filter(id__in=ids).update(
            status='SENT', sent_at=timezone.now()
        )

    return JsonResponse({
        'count': len(batch),
        'pushes': [
            {
                'id': q.id,
                'to': q.token,
                'title': q.title,
                'body': q.body,
                'data': q.payload,
            }
            for q in batch
        ],
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def report_failures(request):
    """Relay reports Expo receipt failures so we can mark them FAILED."""
    from .models import QueuedPush

    if not _queue_token_valid(request):
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    failed_ids = request.data.get('failed_ids', [])
    if isinstance(failed_ids, list) and failed_ids:
        QueuedPush.objects.filter(id__in=failed_ids).update(status='FAILED')
    return JsonResponse({'reported': len(failed_ids)})
