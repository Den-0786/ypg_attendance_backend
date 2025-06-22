from django.contrib import admin
from .models import AttendanceEntry, ApologyEntry

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
