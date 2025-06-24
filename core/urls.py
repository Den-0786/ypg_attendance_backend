from django.urls import path
from .views import (
    login_view, logout_view, session_status, submit_attendance, submit_apologies,
    get_attendance_summary, get_apology_summary, local_attendance, district_attendance,
    delete_attendance, edit_attendance, attendance_by_meeting_title,
    change_password, request_password_reset, reset_password_confirm,
    set_meeting, current_meeting
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Attendance & Apology
    path('submit-attendance/', submit_attendance, name='submit_attendance'),
    path('submit-apologies/', submit_apologies, name='submit_apologies'),
    path('attendance-summary/', get_attendance_summary, name='attendance_summary'),
    path('apology-summary/', get_apology_summary, name='apology_summary'),
    path('local-attendance/', local_attendance, name='local_attendance'),
    path('district-attendance/', district_attendance, name='district_attendance'),
    path('delete-attendance/<int:pk>/', delete_attendance, name='delete_attendance'),
    path('edit-attendance/<int:pk>/', edit_attendance, name='edit_attendance'),
    path('attendance-by-meeting-title/', attendance_by_meeting_title, name='attendance_by_meeting_title'),

    # Authentication & Password
    path('change-password/', change_password, name='change_password'),
    path('request-password-reset/', request_password_reset, name='request_password_reset'),
    path('reset-password-confirm/', reset_password_confirm, name='reset_password_confirm'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('session-status/', session_status, name='session_status'),

    # JWT tokens (optional if you want to switch to token auth later)
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Meeting management
    path('set-meeting/', set_meeting, name='set_meeting'),
    path('current-meeting/', current_meeting, name='current_meeting'),
]
