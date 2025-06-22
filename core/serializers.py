from rest_framework import serializers
from .models import AttendanceEntry, ApologyEntry
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
