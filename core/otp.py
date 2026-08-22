import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from .models import PasswordChangeOTP
from .sms import send_sms

OTP_LIFETIME_MINUTES = 10
MAX_OTP_ATTEMPTS = 3
RESEND_COOLDOWN_SECONDS = 60


def _hash_code(code):
    return hashlib.sha256(code.encode()).hexdigest()


def normalize_recipient(recipient):
    clean = recipient.strip().replace(" ", "").replace("+", "")
    if clean.startswith("0"):
        clean = "233" + clean[1:]
    return clean


def otp_recipient():
    return getattr(settings, 'OTP_RECIPIENT', '') or '0245660786'


def masked_recipient():
    number = otp_recipient()
    if len(number) >= 5:
        return number[:3] + "****" + number[-2:]
    return number


def issue_otp(identifier, user=None, purpose='password_change'):
    """Generate an OTP, store its hash, and SMS it to the configured recipient.

    Returns (ok, error_message).
    """
    now = timezone.now()

    existing = PasswordChangeOTP.objects.filter(
        identifier=identifier, purpose=purpose
    ).order_by('-created_at').first()
    if existing and (now - existing.created_at).total_seconds() < RESEND_COOLDOWN_SECONDS:
        return False, 'Please wait a minute before requesting another code.'

    PasswordChangeOTP.objects.filter(identifier=identifier, purpose=purpose).delete()

    code = ''.join(secrets.choice('1234567890') for _ in range(6))
    PasswordChangeOTP.objects.create(
        user=user,
        identifier=identifier,
        code_hash=_hash_code(code),
        purpose=purpose,
        expires_at=now + timedelta(minutes=OTP_LIFETIME_MINUTES),
    )

    app_name = getattr(settings, 'APP_NAME', 'YPG')
    message = f"Your {app_name} password change code is {code}. It expires in {OTP_LIFETIME_MINUTES} minutes. Do not share it."
    sent = send_sms(normalize_recipient(otp_recipient()), message)
    if not sent:
        return False, 'Could not send the SMS code. Please try again later.'
    return True, None


def verify_otp(identifier, code, purpose='password_change'):
    """Validate a submitted OTP. Returns (ok, error_message)."""
    if not code:
        return False, 'SMS verification code is required.'

    entry = PasswordChangeOTP.objects.filter(
        identifier=identifier, purpose=purpose
    ).order_by('-created_at').first()
    if not entry:
        return False, 'No SMS code was requested. Please request a new code.'

    if entry.is_expired:
        entry.delete()
        return False, 'SMS code has expired. Please request a new one.'

    if entry.attempts >= MAX_OTP_ATTEMPTS:
        entry.delete()
        return False, 'Too many incorrect codes. Please request a new one.'

    entry.attempts += 1
    entry.save(update_fields=['attempts'])

    if entry.code_hash != _hash_code(str(code).strip()):
        remaining = MAX_OTP_ATTEMPTS - entry.attempts
        if remaining <= 0:
            entry.delete()
            return False, 'Too many incorrect codes. Please request a new one.'
        return False, f'Invalid SMS code. {remaining} attempt{"s" if remaining != 1 else ""} remaining.'

    entry.delete()
    return True, None
