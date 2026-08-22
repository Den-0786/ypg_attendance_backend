from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime
from django.utils.timezone import now


from django.contrib.auth.hashers import make_password, check_password


class Credential(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # stores hashed password
    role = models.CharField(max_length=20, default='user')
    meeting = models.ForeignKey(
        'Meeting',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='member_credentials',
        help_text='Set when this credential is for meeting-member login'
    )

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return self.username

    @property
    def is_active(self):
        return True

    def get_username(self):
        return self.username

    @property
    def pk(self):
        return self.id

class AttendanceEntry(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    congregation = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=[('local', 'Local'), ('district', 'District')])
    meeting_date = models.DateField()
    timestamp = models.TimeField(default=now)
    submitted_by = models.ForeignKey(Credential, null=True, blank=True, on_delete=models.SET_NULL)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    tags = models.CharField(max_length=255, blank=True, default='')  # Comma-separated tags

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()

    def __str__(self):
        return f"{self.name} - {self.congregation} ({self.type})"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['phone', 'meeting_date', 'type'],
                condition=models.Q(is_deleted=False),
                name='unique_active_phone_meeting_type',
            )
        ]

class ApologyEntry(models.Model):
    name = models.CharField(max_length=100)
    congregation = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    reason = models.TextField()
    type = models.CharField(max_length=10, choices=[('local', 'Local'), ('district', 'District')])
    meeting_date = models.DateField()
    timestamp = models.TimeField(default=now)
    submitted_by = models.ForeignKey(Credential, null=True, blank=True, on_delete=models.SET_NULL)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    tags = models.CharField(max_length=255, blank=True, default='')

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save()

    def __str__(self):
        return f"{self.name} - {self.congregation} (Apology)"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + datetime.timedelta(minutes=5)

    def __str__(self):
        return f"{self.user.username} - {self.token}"

class LocalContact(models.Model):
    """Leader phone number for a local congregation, used for absence SMS."""
    name = models.CharField(max_length=100, unique=True)
    phone = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.name} ({self.phone})"


class Meeting(models.Model):
    MEETING_TYPE_CHOICES = [
        ('general', 'General Meeting'),
        ('council', 'Council Meeting'),
        ('emergency', 'Emergency Meeting'),
    ]
    title = models.CharField(max_length=200)
    date = models.DateField()
    meeting_type = models.CharField(max_length=20, choices=MEETING_TYPE_CHOICES, default='general')
    custom_participant_limit = models.IntegerField(null=True, blank=True, help_text="Custom limit per local. If null, uses default: General=5, Council=2, Emergency=unlimited")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Track when meeting was created

    login_username = models.CharField(max_length=150, blank=True, null=True)
    login_password = models.CharField(max_length=128, blank=True, null=True)  # hashed

    start_time = models.TimeField(default=datetime.time(8, 0))
    duration_hours = models.IntegerField(default=24)
    absence_reminder_sent_at = models.DateTimeField(null=True, blank=True)

    def set_password(self, raw_password):
        self.login_password = make_password(raw_password)

    def check_password(self, raw_password):
        if not self.login_password:
            return False
        return check_password(raw_password, self.login_password)

    def get_end_datetime(self):
        """Return the datetime when this meeting ends."""
        from django.utils import timezone
        from datetime import datetime, timedelta
        naive_start = datetime.combine(self.date, self.start_time)
        aware_start = timezone.make_aware(naive_start, timezone.get_current_timezone())
        return aware_start + timedelta(hours=self.duration_hours)

    def is_expired(self):
        """Check if the meeting's scheduled duration has passed."""
        from django.utils import timezone
        return timezone.now() > self.get_end_datetime()

    def has_started(self):
        """Check if the meeting's scheduled start time has passed."""
        from django.utils import timezone
        from datetime import datetime
        naive_start = datetime.combine(self.date, self.start_time)
        aware_start = timezone.make_aware(naive_start, timezone.get_current_timezone())
        return timezone.now() >= aware_start

    def __str__(self):
        return f"{self.title} ({self.date})"

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("edit", "Edit"),
        ("delete", "Delete"),
        ("restore", "Restore"),
        ("export", "Export"),
        ("view", "View"),
    ]
    user = models.ForeignKey(Credential, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model = models.CharField(max_length=50)
    object_id = models.IntegerField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.user} {self.action} {self.model} {self.object_id} at {self.timestamp}"

class SecurityPIN(models.Model):
    pin = models.CharField(max_length=4, help_text="4-digit PIN for edit/delete operations")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"PIN: {'*' * 4} (Active: {self.is_active})"

    @classmethod
    def get_active_pin(cls):
        """Get the currently active PIN"""
        return cls.objects.filter(is_active=True).first()

    @classmethod
    def verify_pin(cls, pin):
        """Verify if the provided PIN matches the active PIN"""
        try:
            active_pin = cls.objects.filter(is_active=True).first()
            if not active_pin:
                return False

            result = active_pin.pin == pin
            return result
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in SecurityPIN.verify_pin: {str(e)}")
            return False

class LoginAttempt(models.Model):
    ATTEMPT_TYPE_CHOICES = [
        ('username_password', 'Username/Password'),
        ('pin', 'PIN'),
    ]

    identifier = models.CharField(max_length=150, help_text="Username or IP address for tracking")
    attempt_type = models.CharField(max_length=20, choices=ATTEMPT_TYPE_CHOICES)
    failed_attempts = models.IntegerField(default=0)
    first_failed_attempt = models.DateTimeField(auto_now_add=True)
    last_failed_attempt = models.DateTimeField(auto_now=True)
    is_locked = models.BooleanField(default=False)
    lock_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['identifier', 'attempt_type']

    def __str__(self):
        return f"{self.identifier} - {self.attempt_type} ({self.failed_attempts} attempts)"

    @classmethod
    def get_or_create_attempt(cls, identifier, attempt_type):
        """Get or create a login attempt record"""
        attempt, created = cls.objects.get_or_create(
            identifier=identifier,
            attempt_type=attempt_type,
            defaults={'failed_attempts': 0}
        )
        return attempt

    def record_failed_attempt(self):
        """Record a failed login attempt with progressive blocking"""
        self.failed_attempts += 1
        self.last_failed_attempt = timezone.now()

        if self.failed_attempts >= 6:
            # After 6 failed attempts, block for 24 hours
            self.is_locked = True
            self.lock_expires_at = timezone.now() + timezone.timedelta(hours=24)
        elif self.failed_attempts >= 3:
            # After 3 failed attempts, block for 30 minutes
            self.is_locked = True
            self.lock_expires_at = timezone.now() + timezone.timedelta(minutes=30)

        self.save()

    def reset_attempts(self):
        """Reset failed attempts after successful login"""
        self.failed_attempts = 0
        self.is_locked = False
        self.lock_expires_at = None
        self.save()

    def is_locked_out(self):
        """Check if the identifier is currently locked out"""
        if not self.is_locked:
            return False

        if self.lock_expires_at and timezone.now() > self.lock_expires_at:
            self.is_locked = False
            self.lock_expires_at = None
            self.save()
            return False

        return True

    def get_remaining_lock_time(self):
        """Get remaining lock time in minutes"""
        if not self.is_locked or not self.lock_expires_at:
            return 0

        remaining = self.lock_expires_at - timezone.now()
        if remaining.total_seconds() <= 0:
            return 0

        return int(remaining.total_seconds() / 60)

class CredentialHistory(models.Model):
    """Track used credentials to prevent reuse"""
    credential_type = models.CharField(max_length=20, choices=[
        ('username', 'Username'),
        ('password', 'Password'),
        ('pin', 'PIN'),
    ])
    credential_value = models.CharField(max_length=255)  # Hashed for passwords
    user_id = models.IntegerField()  # ID of the user who used this credential
    used_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)  # Current credential is active

    class Meta:
        unique_together = ['credential_type', 'credential_value', 'user_id']
        indexes = [
            models.Index(fields=['credential_type', 'user_id']),
        ]

    def __str__(self):
        return f"{self.credential_type} for user {self.user_id} at {self.used_at}"

    @classmethod
    def check_reuse(cls, credential_type, credential_value, user_id):
        """Check if credential has been used before by this user"""
        if credential_type == 'password':
            # For passwords, we need to check against hashed values
            from django.contrib.auth.hashers import make_password
            hashed_value = make_password(credential_value)
            return cls.objects.filter(
                credential_type=credential_type,
                credential_value=hashed_value,
                user_id=user_id
            ).exists()
        else:
            # For username and PIN, check exact match
            return cls.objects.filter(
                credential_type=credential_type,
                credential_value=credential_value,
                user_id=user_id
            ).exists()

    @classmethod
    def record_credential(cls, credential_type, credential_value, user_id):
        """Record a new credential usage"""
        if credential_type == 'password':
            from django.contrib.auth.hashers import make_password
            hashed_value = make_password(credential_value)
        else:
            hashed_value = credential_value

        cls.objects.filter(
            credential_type=credential_type,
            user_id=user_id,
            is_active=True
        ).update(is_active=False)

        cls.objects.create(
            credential_type=credential_type,
            credential_value=hashed_value,
            user_id=user_id,
            is_active=True
        )


class DataBackup(models.Model):
    """Snapshot of all records taken before a destructive clear-all operation."""
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(Credential, null=True, blank=True, on_delete=models.SET_NULL)
    attendance_count = models.IntegerField(default=0)
    apology_count = models.IntegerField(default=0)
    payload = models.JSONField()

    def __str__(self):
        return f"Backup {self.id} at {self.created_at} ({self.attendance_count}+{self.apology_count} records)"


class PasswordChangeOTP(models.Model):
    """One-time SMS code required before a password/credential change is applied."""
    PURPOSE_CHOICES = [
        ('password_change', 'Password Change'),
        ('password_reset', 'Password Reset'),
    ]

    user = models.ForeignKey(
        'Credential',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='otp_codes'
    )
    identifier = models.CharField(max_length=150, blank=True, default='')
    code_hash = models.CharField(max_length=64)
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES, default='password_change')
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.identifier or self.user_id} ({self.purpose})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at