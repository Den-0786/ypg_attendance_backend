from django.urls import path
from .views import (
    get_attendance_summary, get_apology_summary, submit_attendance, submit_apologies,
    delete_attendance, delete_apology, edit_attendance, edit_apology,
    login_view, logout_view, session_status, change_credentials, request_password_reset,
    reset_password_confirm, verify_pin, clear_all_data,
    set_meeting, current_meeting, deactivate_meeting,
    soft_delete_record, restore_record, bulk_soft_delete, bulk_restore,
    update_notes_tags, export_record_pdf, advanced_records_list, advanced_combined_records_list, audit_log_list,
    local_attendance, district_attendance, attendance_by_meeting_title,
    change_password, login_view_django, change_pin, get_pin_status, setup_initial_pin,
    current_user_info, get_all_users, get_csrf_token, CustomTokenObtainPairView
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from core import views as core_views

urlpatterns = [
    # Attendance & Apology
    path('submit-attendance', submit_attendance, name='submit_attendance'),
    path('api/submit-attendance', submit_attendance, name='api_submit_attendance'),
    path('submit-apologies', submit_apologies, name='submit_apologies'),
    path('api/submit-apologies', submit_apologies, name='api_submit_apologies'),
    path('attendance-summary', get_attendance_summary, name='attendance_summary'),
    path('apology-summary', get_apology_summary, name='apology_summary'),
    path('local-attendance', local_attendance, name='local_attendance'),
    path('district-attendance', district_attendance, name='district_attendance'),
    path('delete-attendance/<int:pk>', delete_attendance, name='delete_attendance'),
    path('edit-attendance/<int:pk>', edit_attendance, name='edit_attendance'),
    path('delete-apology/<int:pk>', delete_apology, name='delete_apology'),
    path('edit-apology/<int:pk>', edit_apology, name='edit_apology'),
    path('attendance-by-meeting-title', attendance_by_meeting_title, name='attendance_by_meeting_title'),
    path('clear-all-data', clear_all_data, name='clear_all_data'),

    # Authentication & Password
    path('change-password', change_password, name='change_password'),
    path('change-credentials', change_credentials, name='change_credentials'),
    path('get-all-users', get_all_users, name='get_all_users'),
    path('request-password-reset', request_password_reset, name='request_password_reset'),
    path('reset-password-confirm', reset_password_confirm, name='reset_password_confirm'),
    path('login', login_view, name='login'),
    path('logout', logout_view, name='logout'),
    path('session-status', session_status, name='session_status'),
    path('current-user-info', current_user_info, name='current_user_info'),
    path('login-django', login_view_django, name='login_django'),

    # JWT tokens (now at /api/token and /api/token/refresh)
    path('token', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh', TokenRefreshView.as_view(), name='token_refresh'),

    # Meeting management
    path('set-meeting', set_meeting, name='set_meeting'),
    path('current-meeting', current_meeting, name='current_meeting'),
    path('deactivate-meeting', deactivate_meeting, name='deactivate_meeting'),

    #Records management
    path('records/<str:record_type>', core_views.records_list, name='records-list'),
    path('records/<str:record_type>/<int:pk>', core_views.record_edit_delete, name='record-edit-delete'),
    path('records/<str:record_type>/export', core_views.records_export, name='records-export'),
    
    
    #Manipulations
    path('records/<str:record_type>/<int:pk>/soft-delete/', soft_delete_record),
    path('records/<str:record_type>/<int:pk>/restore/', restore_record),
    path('records/<str:record_type>/bulk-soft-delete/', bulk_soft_delete),
    path('records/<str:record_type>/bulk-restore/', bulk_restore),
    path('records/<str:record_type>/<int:pk>/notes-tags/', update_notes_tags),
    path('records/<str:record_type>/<int:pk>/export-pdf/', export_record_pdf),
    path('records/<str:record_type>/advanced/', advanced_records_list),
    path('records/<str:record_type>/advanced-combined/', advanced_combined_records_list),
    path('audit-log/', audit_log_list),
    
    # PIN Management
    path('pin/verify/', verify_pin, name='verify_pin'),
    path('pin/verify', verify_pin, name='verify_pin_no_slash'),
    path('pin/change/', change_pin, name='change_pin'),
    path('pin/change', change_pin, name='change_pin_no_slash'),
    path('pin/status/', get_pin_status, name='get_pin_status'),
    path('pin/status', get_pin_status, name='get_pin_status_no_slash'),
    path('pin/setup/', setup_initial_pin, name='setup_initial_pin'),
    path('pin/setup', setup_initial_pin, name='setup_initial_pin_no_slash'),
    path('csrf/', get_csrf_token, name='get_csrf_token'),
]

