"""
Expo push notification helper.
Sends push messages via Expo's push API (plain HTTPS — no SMTP/websockets needed,
so it works on PythonAnywhere free tier once exp.host is reachable; the Expo push
API domain is https://exp.host — add it to your allowlist if blocked).
"""
import requests
from django.conf import settings

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"


def send_push_to_user(user, title, body, data=None):
    """
    Fire-and-forget push to all devices registered for `user`.
    Never raises — push failures must not break API requests.
    Returns number of pushes attempted.
    """
    from users.models import PushToken

    tokens = list(PushToken.objects.filter(user=user).values_list('token', flat=True))
    if not tokens:
        return 0

    sent = 0
    for token in tokens:
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
            if response.status_code == 200:
                sent += 1
        except Exception:
            # Silently ignore network errors — in-app Notification already exists.
            pass
    return sent
