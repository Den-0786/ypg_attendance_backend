from datetime import datetime, time

from django.db import IntegrityError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AttendanceEntry, Credential, DataBackup, Meeting, SecurityPIN


def make_credential(username, role):
    cred = Credential.objects.create(username=username, role=role)
    cred.set_password("Passw0rd!")
    cred.save()
    return cred


def auth_client(credential):
    client = APIClient()
    refresh = RefreshToken.for_user(credential)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


class BaseAttendanceTestCase(TestCase):
    def setUp(self):
        self.admin = make_credential("adminuser", "admin")
        self.member = make_credential("plainuser", "user")
        self.meeting = Meeting.objects.create(
            title="Sunday General",
            date=timezone.now().date(),
            meeting_type="general",
            is_active=True,
            start_time=time(0, 0),
            duration_hours=24,
        )
        SecurityPIN.objects.create(pin="1234", is_active=True)
        self.client = auth_client(self.member)

    def entry_payload(self, phone="0244000000", name="Kofi Mensah", **overrides):
        payload = {
            "name": name,
            "phone": phone,
            "congregation": "Emmanuel Congregation Ahinsan",
            "position": "President",
            "type": "local",
            "meeting_date": str(self.meeting.date),
        }
        payload.update(overrides)
        return payload


class AttendanceSubmissionTests(BaseAttendanceTestCase):
    def submit(self, items):
        return self.client.post("/api/submit-attendance", items, format="json")

    def test_general_meeting_allows_five_per_congregation(self):
        for i in range(5):
            res = self.submit([self.entry_payload(phone=f"024400000{i}")])
            self.assertEqual(res.status_code, 201)

    def test_general_meeting_rejects_sixth_member(self):
        for i in range(5):
            self.submit([self.entry_payload(phone=f"024400000{i}")])
        res = self.submit([self.entry_payload(phone="0244009999")])
        self.assertEqual(res.status_code, 400)
        self.assertIn("Maximum attendance limit", res.data["error"])

    def test_council_meeting_cap_is_two(self):
        self.meeting.meeting_type = "council"
        self.meeting.save()
        for i in range(2):
            res = self.submit([self.entry_payload(phone=f"024400000{i}")])
            self.assertEqual(res.status_code, 201)
        res = self.submit([self.entry_payload(phone="0244009999")])
        self.assertEqual(res.status_code, 400)

    def test_emergency_meeting_has_no_cap(self):
        self.meeting.meeting_type = "emergency"
        self.meeting.save()
        for i in range(7):
            res = self.submit([self.entry_payload(phone=f"024400000{i}")])
            self.assertEqual(res.status_code, 201)

    def test_custom_participant_limit_overrides_default(self):
        self.meeting.custom_participant_limit = 1
        self.meeting.save()
        res = self.submit([self.entry_payload()])
        self.assertEqual(res.status_code, 201)
        res = self.submit([self.entry_payload(phone="0244009999")])
        self.assertEqual(res.status_code, 400)

    def test_duplicate_phone_within_submission_rejected(self):
        res = self.submit([
            self.entry_payload(),
            self.entry_payload(name="Ama Owusu"),
        ])
        self.assertEqual(res.status_code, 400)
        self.assertIn("Duplicate phone number", res.data["error"])

    def test_phone_already_submitted_for_meeting_rejected(self):
        res = self.submit([self.entry_payload()])
        self.assertEqual(res.status_code, 201)
        res = self.submit([self.entry_payload(name="Ama Owusu")])
        self.assertEqual(res.status_code, 400)

    def test_no_active_meeting_rejects_submission(self):
        self.meeting.is_active = False
        self.meeting.save()
        res = self.submit([self.entry_payload()])
        self.assertEqual(res.status_code, 400)
        self.assertIn("No active meeting", res.data["error"])


class AttendanceUniqueConstraintTests(BaseAttendanceTestCase):
    def test_database_rejects_duplicate_active_entry(self):
        AttendanceEntry.objects.create(**self.entry_payload())
        with self.assertRaises(IntegrityError):
            AttendanceEntry.objects.create(**self.entry_payload())

    def test_soft_deleted_entry_does_not_block_new_entry(self):
        first = AttendanceEntry.objects.create(**self.entry_payload())
        first.soft_delete()
        second = AttendanceEntry.objects.create(**self.entry_payload())
        self.assertTrue(AttendanceEntry.objects.filter(is_deleted=False).count() == 1)
        self.assertNotEqual(first.id, second.id)


class EndpointPermissionTests(BaseAttendanceTestCase):
    def test_anonymous_cannot_list_records(self):
        anon = APIClient()
        res = anon.get("/api/records/local")
        self.assertEqual(res.status_code, 401)

    def test_anonymous_cannot_clear_all_data(self):
        anon = APIClient()
        res = anon.post("/api/clear-all-data", {"pin": "1234"}, format="json")
        self.assertEqual(res.status_code, 401)

    def test_anonymous_cannot_verify_pin(self):
        anon = APIClient()
        res = anon.post("/api/pin/verify/", {"pin": "1234"}, format="json")
        self.assertEqual(res.status_code, 401)

    def test_non_admin_cannot_clear_all_data(self):
        res = self.client.post("/api/clear-all-data", {"pin": "1234"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_non_admin_cannot_change_pin(self):
        res = self.client.post(
            "/api/pin/change/",
            {"current_pin": "1234", "new_pin": "5678"},
            format="json",
        )
        self.assertEqual(res.status_code, 403)

    def test_non_admin_cannot_setup_initial_pin(self):
        SecurityPIN.objects.all().delete()
        res = self.client.post("/api/pin/setup/", {"pin": "9999"}, format="json")
        self.assertEqual(res.status_code, 403)

    def test_authenticated_user_can_list_records(self):
        res = self.client.get("/api/records/local")
        self.assertEqual(res.status_code, 200)


class ClearAllDataTests(BaseAttendanceTestCase):
    def clear(self, pin="1234"):
        admin_client = auth_client(self.admin)
        return admin_client.post("/api/clear-all-data", {"pin": pin}, format="json")

    def test_admin_clear_creates_real_backup_and_deletes_records(self):
        AttendanceEntry.objects.create(**self.entry_payload())
        res = self.clear()
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["backup_created"])
        self.assertEqual(AttendanceEntry.objects.count(), 0)

        backup = DataBackup.objects.latest("id")
        self.assertEqual(backup.attendance_count, 1)
        self.assertEqual(len(backup.payload["attendance_records"]), 1)
        self.assertEqual(backup.created_by, self.admin)

    def test_wrong_pin_deletes_nothing(self):
        AttendanceEntry.objects.create(**self.entry_payload())
        res = self.clear(pin="0000")
        self.assertEqual(res.status_code, 401)
        self.assertEqual(AttendanceEntry.objects.count(), 1)


class LoginLockoutTests(BaseAttendanceTestCase):
    def test_three_failures_lock_account_for_30_minutes(self):
        anon = APIClient()
        for _ in range(2):
            res = anon.post(
                "/api/login",
                {"username": "lockuser", "password": "wrongpass"},
                format="json",
            )
            self.assertEqual(res.status_code, 400)
        res = anon.post(
            "/api/login",
            {"username": "lockuser", "password": "wrongpass"},
            format="json",
        )
        self.assertEqual(res.status_code, 429)
        self.assertIn("30 minutes", res.data["error"])

    def test_successful_login_resets_failed_attempts(self):
        anon = APIClient()
        anon.post("/api/login", {"username": "adminuser", "password": "wrongpass"}, format="json")
        res = anon.post("/api/login", {"username": "adminuser", "password": "Passw0rd!"}, format="json")
        self.assertEqual(res.status_code, 200)


class PINChangeTests(BaseAttendanceTestCase):
    def test_admin_can_change_pin(self):
        admin_client = auth_client(self.admin)
        res = admin_client.post(
            "/api/pin/change/",
            {"current_pin": "1234", "new_pin": "5678"},
            format="json",
        )
        self.assertEqual(res.status_code, 200)
        self.assertFalse(SecurityPIN.verify_pin("1234"))
        self.assertTrue(SecurityPIN.verify_pin("5678"))

    def test_change_with_wrong_current_pin_keeps_old_pin(self):
        admin_client = auth_client(self.admin)
        res = admin_client.post(
            "/api/pin/change/",
            {"current_pin": "0000", "new_pin": "5678"},
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.assertTrue(SecurityPIN.verify_pin("1234"))
