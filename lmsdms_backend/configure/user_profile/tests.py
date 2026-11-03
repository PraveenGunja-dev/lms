from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone

from user_profile.models import CustomUser
from user_profile.testing import Fixtures

PASSWORD = "Str0ng!Passw0rd"


@mock.patch("user_profile.views.send_email_with_credentials")
class UserManagementSecurityTests(TestCase):
    def setUp(self):
        self.f = Fixtures()

    def test_anonymous_cannot_create_user(self, _mail):
        response = self.f.client().post("/api/user_profile/user_create", {
            "email": "x@example.com", "username": "x", "user_role": [self.f.groups["Admin"].id]}, format="json")
        self.assertEqual(response.status_code, 401)
        self.assertFalse(CustomUser.objects.filter(username="x").exists())

    def test_non_admin_cannot_create_or_escalate(self, _mail):
        response = self.f.client(self.f.author).post("/api/user_profile/user_create", {
            "email": "x@example.com", "username": "x", "user_role": [self.f.groups["Author"].id]}, format="json")
        self.assertEqual(response.status_code, 403)
        response = self.f.client(self.f.author).put(f"/api/user_profile/user_update/{self.f.author.id}", {
            "groups": [self.f.groups["Admin"].id]}, format="json")
        self.assertEqual(response.status_code, 403)

    def test_admin_creates_user_with_department(self, mail):
        response = self.f.client(self.f.admin).post("/api/user_profile/user_create", {
            "email": "New@Example.com", "username": "newuser", "first_name": "New",
            "user_role": [self.f.groups["Author"].id], "department_id": self.f.qa.id}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        user = CustomUser.objects.get(username="newuser")
        self.assertEqual(user.department, self.f.qa)
        self.assertEqual(user.email, "new@example.com")
        self.assertFalse(user.is_reset_password)  # must change temporary password
        mail.assert_called_once()

    def test_only_admin_can_reset_other_passwords(self, _mail):
        url = f"/api/user_profile/admin_can_reset_passowrd/{self.f.reviewer1.id}"
        response = self.f.client(self.f.author).put(url, {"password": "An0ther!Strong1"}, format="json")
        self.assertEqual(response.status_code, 403)
        response = self.f.client(self.f.admin).put(url, {"password": "An0ther!Strong1"}, format="json")
        self.assertEqual(response.status_code, 200, response.data)


class LoginTests(TestCase):
    def setUp(self):
        cache.clear()
        self.f = Fixtures()
        self.group_id = self.f.groups["Author"].id

    def login(self, password):
        return self.f.client().post("/api/user_profile/login", {
            "username": "author", "password": password, "group_id": self.group_id}, format="json").data

    def test_successful_login_returns_token(self):
        data = self.login(PASSWORD)
        self.assertTrue(data["status"])
        self.assertIn("token", data["data"])
        self.assertFalse(data["data"]["is_password_expired"])

    @override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
    def test_account_locks_after_failed_attempts(self):
        for _ in range(3):
            self.assertFalse(self.login("wrong")["status"])
        data = self.login(PASSWORD)  # correct password no longer works
        self.assertFalse(data["status"])
        self.assertTrue(data.get("is_locked"))

    @override_settings(LOGIN_MAX_FAILED_ATTEMPTS=3)
    def test_role_lookup_shares_lockout(self):
        client = self.f.client()
        for _ in range(3):
            client.post("/api/user_profile/group_list", {"username": "author", "password": "bad"}, format="json")
        self.assertFalse(self.login(PASSWORD)["status"])

    def test_expired_password_is_rejected(self):
        self.f.author.password_updated_at = timezone.now() - timedelta(days=200)
        self.f.author.save()
        data = self.login(PASSWORD)
        self.assertFalse(data["status"])
        self.assertTrue(data["is_password_expired"])


@mock.patch("user_profile.views.send_email_forgot_password")
class ForgotPasswordOtpTests(TestCase):
    def setUp(self):
        cache.clear()
        self.f = Fixtures()

    def request_otp(self, mail):
        self.f.client().post("/api/user_profile/request_forgot_password_otp", {"email": "author@example.com"}, format="json")
        return mail.call_args[0][2]

    def reset(self, otp, password="N3w!Password99"):
        return self.f.client().post("/api/user_profile/forgot_password_otp", {
            "email": "author@example.com", "otp": otp, "password": password, "confirm_password": password}, format="json").data

    def test_otp_is_hashed_and_single_use(self, mail):
        otp = self.request_otp(mail)
        self.f.author.refresh_from_db()
        self.assertNotEqual(self.f.author.otp, otp)
        self.assertTrue(self.reset(otp)["status"])
        self.assertFalse(self.reset(otp, "Other!Passw0rd77")["status"])

    def test_unknown_email_gets_generic_response(self, mail):
        data = self.f.client().post("/api/user_profile/request_forgot_password_otp", {"email": "nobody@example.com"}, format="json").data
        self.assertTrue(data["status"])
        mail.assert_not_called()

    @override_settings(OTP_MAX_ATTEMPTS=3)
    def test_otp_attempt_limit(self, mail):
        otp = self.request_otp(mail)
        for _ in range(3):
            self.assertFalse(self.reset("000000" if otp != "000000" else "111111")["status"])
        self.assertFalse(self.reset(otp)["status"])  # invalidated after too many attempts

    def test_otp_expires(self, mail):
        otp = self.request_otp(mail)
        CustomUser.objects.filter(id=self.f.author.id).update(otp_created_at=timezone.now() - timedelta(hours=1))
        self.assertIn("expired", self.reset(otp)["message"])

    def test_first_login_change_needs_no_otp_and_stores_hash(self, _mail):
        self.f.author.is_reset_password = False
        self.f.author.save()
        response = self.f.client(self.f.author).put("/api/user_profile/otp_resetpassword", {
            "password": "N3w!Password99", "confirm_password": "N3w!Password99"}, format="json")
        self.assertTrue(response.data["status"], response.data)
        self.f.author.refresh_from_db()
        self.assertTrue(self.f.author.check_password("N3w!Password99"))
        self.assertTrue(self.f.author.old_password.startswith(("pbkdf2_", "argon2", "bcrypt")))
