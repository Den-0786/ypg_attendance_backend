from rest_framework import serializers
from .models import AttendanceEntry, ApologyEntry, Meeting, AuditLog, SecurityPIN
import re

class AttendanceEntrySerializer(serializers.ModelSerializer):
    submitted_by = serializers.CharField(source='submitted_by.username', read_only=True)
    meeting_title = serializers.SerializerMethodField()

    class Meta:
        model = AttendanceEntry
        fields = '__all__'
        
    def validate_name(self, value):
            if not re.match(r"^[A-Za-z\s\-']+$", value):
                raise serializers.ValidationError("Name must contain only letters, spaces, hyphens or apostrophes.")
            return value

    def validate_phone(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        return value

    def get_meeting_title(self, obj):
        meeting = Meeting.objects.filter(date=obj.meeting_date).first()
        return meeting.title if meeting else ""

class ApologyEntrySerializer(serializers.ModelSerializer):
    submitted_by = serializers.CharField(source='submitted_by.username', read_only=True)

    class Meta:
        model = ApologyEntry
        fields = '__all__'
        
    def validate_name(self, value):
        if not re.match(r"^[A-Za-z\s\-']+$", value):
            raise serializers.ValidationError("Name must contain only letters, spaces, hyphens or apostrophes.")
        return value

class MeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = AuditLog
        fields = '__all__'

# Bulk action serializers
class BulkIdSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.IntegerField())

class NotesTagsUpdateSerializer(serializers.Serializer):
    notes = serializers.CharField(allow_blank=True, required=False)
    tags = serializers.CharField(allow_blank=True, required=False)

# PIN management serializers
class SecurityPINSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityPIN
        fields = ['pin', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class PINVerificationSerializer(serializers.Serializer):
    pin = serializers.CharField(max_length=4, min_length=4, help_text="4-digit PIN")
    is_valid = serializers.BooleanField(required=False, help_text="Whether the PIN is valid")

class PINChangeSerializer(serializers.Serializer):
    current_pin = serializers.CharField(max_length=4, min_length=4, help_text="Current 4-digit PIN")
    new_pin = serializers.CharField(max_length=4, min_length=4, help_text="New 4-digit PIN")
