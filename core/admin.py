from django.contrib import admin
from .models import AttendanceEntry, ApologyEntry, Credential, Meeting

@admin.register(Credential)
class CredentialAdmin(admin.ModelAdmin):
    list_display = ('username', 'password', 'role')
    search_fields = ('username', 'role')
    list_filter = ('role',)
    
@admin.register(AttendanceEntry)
class AttendanceEntryAdmin(admin.ModelAdmin):
    list_display = ('name', 'congregation', 'position', 'type', 'meeting_date', 'timestamp')
    search_fields = ('name', 'congregation')
    list_filter = ('type', 'meeting_date')

@admin.register(ApologyEntry)
class ApologyEntryAdmin(admin.ModelAdmin):
    list_display = ('name', 'congregation', 'position', 'meeting_date', 'timestamp')
    search_fields = ('name', 'congregation')
    list_filter = ('meeting_date',)

@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'is_active')
    search_fields = ('title',)
    list_filter = ('is_active', 'date')
