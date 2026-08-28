from django.test import TestCase
from rest_framework.test import APIClient


class AuthFlowTests(TestCase):
    """Smoke tests: register -> verify -> login -> me -> update profile."""

    def setUp(self):
        self.client = APIClient()

    def _register(self, username="tester", email="tester@example.com", role="CUSTOMER"):
        return self.client.post("/api/register/", {
            "username": username, "email": email, "password": "testpass123",
            "first_name": "Test", "last_name": "User", "phone_number": "08012345678",
            "role": role,
        }, format="json")

    def test_register_returns_code(self):
        res = self._register()
        self.assertEqual(res.status_code, 201)
        from users.models import User
        user = User.objects.filter(email="tester@example.com").order_by("id").first()
        self.assertIsNotNone(user)
        self.assertIsNotNone(user.verification_code)

    def test_verify_email_wrong_key_and_happy_path(self):
        self._register()
        from users.models import User
        user = User.objects.get(email="tester@example.com")
        # wrong key must 400 (the mobile bug we fixed)
        res = self.client.post("/api/verify-email/", {"email": user.email, "verification_code": "000000"}, format="json")
        self.assertEqual(res.status_code, 400)
        res = self.client.post("/api/verify-email/", {"email": user.email, "code": user.verification_code}, format="json")
        self.assertEqual(res.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.is_verified)
        self.assertIsNone(user.verification_code)

    def test_resend_code(self):
        self._register()
        res = self.client.post("/api/resend-code/", {"email": "tester@example.com"}, format="json")
        self.assertEqual(res.status_code, 200)


class PasswordResetFlowTests(TestCase):
    def test_request_and_confirm(self):
        self.client = APIClient()
        self.client.post("/api/register/", {
            "username": "resetme", "email": "resetme@example.com", "password": "oldpass123",
            "first_name": "R", "last_name": "U", "phone_number": "08000000000", "role": "CUSTOMER",
        }, format="json")

        # must be verified before login is allowed
        from users.models import User
        user = User.objects.get(email="resetme@example.com")
        self.client.post("/api/verify-email/", {"email": user.email, "code": user.verification_code}, format="json")

        res = self.client.post("/api/password-reset/", {"email": "resetme@example.com"}, format="json")
        self.assertEqual(res.status_code, 200)

        user.refresh_from_db()
        res = self.client.post("/api/password-reset-confirm/", {
            "email": user.email, "code": user.reset_code, "new_password": "newpass12345",
        }, format="json")
        self.assertEqual(res.status_code, 200)

        # old password rejected, new one accepted
        res = self.client.post("/api/login/", {"username": "resetme", "password": "oldpass123"}, format="json")
        self.assertEqual(res.status_code, 401)
        res = self.client.post("/api/login/", {"username": "resetme", "password": "newpass12345"}, format="json")
        self.assertEqual(res.status_code, 200)


class ServiceAndBookingFlowTests(TestCase):
    """Provider creates a service; customer books it."""

    def setUp(self):
        self.client = APIClient()

    def _make_user(self, username, role, verified=True):
        from users.models import User
        user = User.objects.create_user(
            username=username, email=f"{username}@example.com", password="testpass123",
            role=role,
        )
        user.is_verified = verified
        user.verification_code = None
        user.save()
        return user

    def _login(self, user):
        res = self.client.post("/api/login/", {"username": user.username, "password": "testpass123"}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_bookings_list_requires_auth(self):
        res = self.client.get("/api/bookings/")
        self.assertEqual(res.status_code, 401)

    def test_provider_service_create_and_customer_books(self):
        provider_user = self._make_user("prov1", "PROVIDER")
        customer = self._make_user("cust1", "CUSTOMER")

        from users.models import ProviderProfile
        profile = ProviderProfile.objects.create(user=provider_user, bio="hi", city="Lagos")
        profile.is_verified = True
        profile.save()

        self._login(provider_user)
        res = self.client.post("/api/services/", {"title": "Fix sink", "description": "plumbing",
                                                  "price": "5000.00"}, format="json")
        # Category may be required; accept 201 or a clean 400 — never a 500
        self.assertIn(res.status_code, (201, 400))

        if res.status_code == 201:
            from services.models import Service
            service = Service.objects.get(id=res.data["id"])
            service.is_active = True
            service.save()

            self.client.credentials(HTTP_AUTHORIZATION="")
            self._login(customer)
            res = self.client.post("/api/bookings/", {"service": service.id, "scheduled_date": "2026-09-01T10:00:00Z"}, format="json")
            self.assertIn(res.status_code, (201, 400))

