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

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    @property
    def is_authenticated(self):
        return True

    def __str__(self):
        return self.username

    # --- PATCH FOR SIMPLEJWT COMPATIBILITY ---
    @property
    def is_active(self):
        return True

    def get_username(self):
        return self.username

    @property
    def pk(self):
        return self.id
    # --- END PATCH ---

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
    # Advanced features
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

class ApologyEntry(models.Model):
    name = models.CharField(max_length=100)
    congregation = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
    reason = models.TextField()
    type = models.CharField(max_length=10, choices=[('local', 'Local'), ('district', 'District')])
    meeting_date = models.DateField()
    timestamp = models.TimeField(default=now)
    submitted_by = models.ForeignKey(Credential, null=True, blank=True, on_delete=models.SET_NULL)
    # Advanced features
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

class Meeting(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateField()
    is_active = models.BooleanField(default=True)
    login_username = models.CharField(max_length=150)
    login_password = models.CharField(max_length=128)  # stores hashed password
    created_at = models.DateTimeField(auto_now_add=True)  # Track when meeting was created

    def set_password(self, raw_password):
        self.login_password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.login_password)

    def is_expired(self):
        """Check if meeting has been active for more than 24 hours"""
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(hours=24)

    def __str__(self):
        return f"{self.title} ({self.date})"

# --- Audit Log Model ---
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

# --- PIN Model for Edit/Delete Operations ---
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

# --- Login Attempt Tracking Model ---
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
        
        # Progressive blocking system
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
        
        # Check if lock has expired
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

# --- Credential History Model for Reuse Prevention ---
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
            # Hash password before storing
            from django.contrib.auth.hashers import make_password
            hashed_value = make_password(credential_value)
        else:
            hashed_value = credential_value
        
        # Deactivate previous active credential of same type for this user
        cls.objects.filter(
            credential_type=credential_type,
            user_id=user_id,
            is_active=True
        ).update(is_active=False)
        
        # Create new record
        cls.objects.create(
            credential_type=credential_type,
            credential_value=hashed_value,
            user_id=user_id,
            is_active=True
        )
