from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import datetime
from django.utils.timezone import now


from django.contrib.auth.hashers import make_password, check_password

class Credential(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # stores hashed password

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.username

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
