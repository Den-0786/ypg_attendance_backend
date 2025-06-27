from rest_framework import serializers
from .models import AttendanceEntry, ApologyEntry, Meeting, AuditLog
import re

class AttendanceEntrySerializer(serializers.ModelSerializer):
    submitted_by = serializers.CharField(source='submitted_by.username', read_only=True)

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
