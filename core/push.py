"""
Expo push notification helper.

Strategy (set-and-forget):
1. Try sending directly via exp.host. On PythonAnywhere free tier this is
   blocked by the proxy — once api domains are allowlisted, pushes become
   instant again automatically with zero code changes.
2. If direct send fails, enqueue the message in QueuedPush. A free GitHub
   Actions cron worker polls /api/push-queue/outbound/ every 5 minutes and
   dispatches queued pushes to exp.host from GitHub's servers.

In-app Notifications are always created by callers regardless, so users
never miss anything even while pushes are in flight.
"""
import requests
from django.conf import settings

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def _send_direct(token: str, title: str, body: str, data: dict | None) -> bool:
    """Attempt a direct push. Returns True on success."""
    try:
        response = requests.post(
            EXPO_PUSH_URL,
            json={
                "to": token,
                "title": title,
                "body": body,
                "data": data or {},
                "sound": "default",
            },
            timeout=5,
        )
        return response.status_code == 200
    except Exception:
        return False


def send_push_to_user(user, title, body, data=None):
    """
    Fire-and-forget push to all devices registered for `user`.
    Tries direct delivery first; falls back to the GitHub Actions relay queue.
    Never raises — push failures must not break API requests.
    Returns number of pushes handled.
    """
    from users.models import PushToken

    tokens = list(PushToken.objects.filter(user=user).values_list('token', flat=True))
    if not tokens:
        return 0

    handled = 0
    for token in tokens:
        if _send_direct(token, title, body, data):
            handled += 1
        else:
            _enqueue(token, title, body, data)
            handled += 1
    return handled


def _enqueue(token: str, title: str, body: str, data: dict | None):
    from .models import QueuedPush

    try:
        QueuedPush.objects.create(
            token=token,
            title=title,
            body=body,
            payload=data or {},
        )
    except Exception:
        pass  # never break the request over queuing

