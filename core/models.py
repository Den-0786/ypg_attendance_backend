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
        active_pin = cls.objects.filter(is_active=True).first()
        if not active_pin:
            return False
        
        result = active_pin.pin == pin
        return result
