from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Count, Q
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.contrib.auth import logout, login as django_login, authenticate
from django.utils import timezone
from .models import (
    AttendanceEntry,
    ApologyEntry,
    Credential,
    PasswordResetToken,
    Meeting,
    AuditLog,
    SecurityPIN,
    DataBackup
)
from django.http import HttpResponse, FileResponse
from django.core.serializers.json import DjangoJSONEncoder
from .serializers import (
    AttendanceEntrySerializer, ApologyEntrySerializer, MeetingSerializer, AuditLogSerializer,
    BulkIdSerializer, NotesTagsUpdateSerializer, SecurityPINSerializer, PINVerificationSerializer, PINChangeSerializer
)
import csv
import json
from datetime import datetime
from rest_framework.pagination import PageNumberPagination
import io
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
except ImportError:
    canvas = None  
from django.utils.deprecation import MiddlewareMixin
from .validators import validate_password_custom
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import logging
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_attendance(request):
    user_id = request.user.id
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    serializer = AttendanceEntrySerializer(data=request.data, many=True)

    if serializer.is_valid():
        names_seen = set()
        phones_seen = set()

        for item in serializer.validated_data:
            name_key = item['name'].strip().lower()
            phone = item['phone'].strip()

            if name_key in names_seen:
                pass
            else:
                names_seen.add(name_key)

            if phone in phones_seen:
                return Response({'error': f"Duplicate phone number in submission: {phone}"}, status=400)
            phones_seen.add(phone)

            existing = AttendanceEntry.objects.filter(
                phone=phone,
                meeting_date=item['meeting_date'],
                type=item['type']
            ).exists()
            if existing:
                return Response({'error': f"Phone number {phone} already submitted for this meeting and type."}, status=400)

            existing_phone = AttendanceEntry.objects.filter(
                phone=phone,
                meeting_date=item['meeting_date'],
                type=item['type']
            ).exclude(congregation=item['congregation']).first()

            if existing_phone:
                return Response({
                    'error': f"Phone number {phone} has already been used for {existing_phone.congregation} in this meeting."
                }, status=400)

            try:
                meeting = Meeting.objects.get(date=item['meeting_date'], is_active=True)

                if meeting.custom_participant_limit is not None:
                    limit = meeting.custom_participant_limit
                    limit_type = "custom"
                elif meeting.meeting_type == 'general':
                    limit = 5
                    limit_type = "General"
                elif meeting.meeting_type == 'council':
                    limit = 2
                    limit_type = "Council"
                else:
                    limit = None

                if limit is not None:
                    congregation_count = AttendanceEntry.objects.filter(
                        meeting_date=item['meeting_date'],
                        congregation=item['congregation'],
                        is_deleted=False
                    ).count()

                    if congregation_count >= limit:
                        return Response({
                            'error': f"Maximum attendance limit of {limit} members reached for {item['congregation']} for this {limit_type} Meeting."
                        }, status=400)
            except Meeting.DoesNotExist:
                return Response({
                    'error': 'No active meeting set for this date. Please set a meeting before taking attendance.'
                }, status=400)

            item.pop('timestamp', None)

            AttendanceEntry.objects.create(**item, submitted_by_id=user_id)

        return Response({'message': 'Attendance submitted successfully!'}, status=201)

    return Response(serializer.errors, status=400)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def submit_apologies(request):
    if request.method == 'GET':
        user_id = request.user.id
        if not user_id:
            return Response({'error': 'Not authenticated'}, status=401)

        try:
            user = Credential.objects.get(id=user_id)
            if user.role in ['admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary', 'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer']:
                apologies = ApologyEntry.objects.filter(is_deleted=False).order_by('-timestamp')
            else:
                apologies = ApologyEntry.objects.filter(submitted_by=user_id, is_deleted=False).order_by('-timestamp')

            serializer = ApologyEntrySerializer(apologies, many=True)
            return Response(serializer.data)
        except Credential.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)

    elif request.method == 'POST':
        user_id = request.user.id
        if not user_id:
            return Response({'error': 'Not authenticated'}, status=401)

        try:
            user = Credential.objects.get(id=user_id)

            admin_username = request.data.get('admin_username')
            admin_password = request.data.get('admin_password')
            apologies_data = request.data.get('apologies', [])

            if not (admin_username and admin_password):
                return Response({'error': 'Admin credentials required'}, status=401)
            if not isinstance(apologies_data, list) or len(apologies_data) == 0:
                return Response({'error': 'Apologies must be a non-empty array'}, status=400)
            try:
                admin_user = Credential.objects.get(username=admin_username, role='admin')
                if not admin_user.check_password(admin_password):
                    return Response({'error': 'Invalid admin credentials'}, status=401)
            except Credential.DoesNotExist:
                return Response({'error': 'Invalid admin credentials'}, status=401)

            created_apologies = []
            for apology_data in apologies_data:
                apology_data['submitted_by'] = user_id
                serializer = ApologyEntrySerializer(data=apology_data)
                if serializer.is_valid():
                    serializer.save()
                    created_apologies.append(serializer.data)
                else:
                    return Response({'error': f'Invalid apology data: {serializer.errors}'}, status=400)
            return Response({
                'success': True,
                'message': f'Successfully submitted {len(created_apologies)} apologies',
                'apologies': created_apologies
            }, status=201)

        except Credential.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_summary(request):
    year = request.GET.get('year')
    congregation = request.GET.get('congregation')
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    executive_roles = [
        'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
        'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
    ]

    try:
        user = Credential.objects.get(id=user_id)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    if user.role in executive_roles:
        entries = AttendanceEntry.objects.all()
    else:
        entries = AttendanceEntry.objects.filter(submitted_by_id=user_id)

    if year:
        entries = entries.filter(meeting_date__year=year)
    if congregation:
        entries = entries.filter(congregation__icontains=congregation)

    serializer = AttendanceEntrySerializer(entries, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_apology_summary(request):
    year = request.GET.get('year')
    congregation = request.GET.get('congregation')
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    executive_roles = [
        'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
        'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
    ]

    try:
        user = Credential.objects.get(id=user_id)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    if user.role in executive_roles:
        entries = ApologyEntry.objects.all()
    else:
        entries = ApologyEntry.objects.filter(submitted_by_id=user_id)

    if year:
        entries = entries.filter(meeting_date__year=year)
    if congregation:
        entries = entries.filter(congregation__icontains=congregation)

    serializer = ApologyEntrySerializer(entries, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def local_attendance(request):
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    executive_roles = [
        'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
        'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
    ]
    if user.role in executive_roles:
        entries = AttendanceEntry.objects.filter(type='local')
    else:
        entries = AttendanceEntry.objects.filter(type='local', submitted_by_id=user_id)

    meeting_titles = dict(Meeting.objects.filter(is_active=True).values_list('date', 'title'))

    data = []
    for entry in entries:
        data.append({
            "id": entry.id, 
            "congregation": entry.congregation, 
            "timestamp": entry.timestamp,
            "meeting_title": meeting_titles.get(entry.meeting_date, "Unknown Meeting"),
            "meeting_date": entry.meeting_date
        })

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def district_attendance(request):
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    executive_roles = [
        'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
        'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
    ]
    if user.role in executive_roles:
        entries = AttendanceEntry.objects.filter(type='district')
    else:
        entries = AttendanceEntry.objects.filter(type='district', submitted_by_id=user_id)

    meeting_titles = dict(Meeting.objects.filter(is_active=True).values_list('date', 'title'))

    data = []
    for entry in entries:
        data.append({
            "id": entry.id, 
            "congregation": entry.congregation, 
            "timestamp": entry.timestamp,
            "meeting_title": meeting_titles.get(entry.meeting_date, "Unknown Meeting"),
            "meeting_date": entry.meeting_date
        })

    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_attendance(request, pk):
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
        executive_roles = [
            'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
            'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
        ]
        if user.role in executive_roles:
            pin = request.query_params.get('pin')
            from .models import SecurityPIN
            if not pin or not SecurityPIN.verify_pin(pin):
                return Response({'error': 'Valid PIN required for this action.'}, status=403)
            entry = AttendanceEntry.objects.get(pk=pk)
        else:
            entry = AttendanceEntry.objects.get(pk=pk, submitted_by_id=user_id)
        entry.delete()
        return Response({'message': 'Attendance record deleted successfully.'})
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)
    except AttendanceEntry.DoesNotExist:
        return Response({'error': 'Record not found or not authorized'}, status=404)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def edit_attendance(request, pk):
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
        executive_roles = [
            'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
            'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
        ]
        if user.role in executive_roles:
            pin = request.data.get('pin')
            from .models import SecurityPIN
            if not pin or not SecurityPIN.verify_pin(pin):
                return Response({'error': 'Valid PIN required for this action.'}, status=403)
            entry = AttendanceEntry.objects.get(pk=pk)
        else:
            entry = AttendanceEntry.objects.get(pk=pk, submitted_by_id=user_id)
        if 'name' in request.data:
            entry.name = request.data['name']
        if 'phone' in request.data:
            entry.phone = request.data['phone']
        if 'email' in request.data:
            entry.email = request.data['email']
        if 'congregation' in request.data:
            entry.congregation = request.data['congregation']
        if 'position' in request.data:
            entry.position = request.data['position']
        if 'type' in request.data:
            entry.type = request.data['type']
        if 'meeting_date' in request.data:
            entry.meeting_date = request.data['meeting_date']
        entry.save()
        return Response({'message': 'Attendance updated successfully', 'data': AttendanceEntrySerializer(entry).data})
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)
    except AttendanceEntry.DoesNotExist:
        return Response({'error': 'Record not found or not authorized'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_by_meeting_title(request):
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    year = request.GET.get('year')
    congregation = request.GET.get('congregation')

    executive_roles = [
        'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
        'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
    ]
    if user.role in executive_roles:
        entries = AttendanceEntry.objects.all()
    else:
        entries = AttendanceEntry.objects.filter(submitted_by_id=user_id)

    if year:
        entries = entries.filter(meeting_date__year=year)
    if congregation:
        entries = entries.filter(congregation__icontains=congregation)

    meeting_counts = entries.values('meeting_date').annotate(count=Count('id'))
    return Response(meeting_counts)


@api_view(['POST'])
@permission_classes([AllowAny])
def change_password(request):
    user_id = request.session.get('user_id')

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({'error': 'Current password and new password are required'}, status=400)

    if not user.check_password(current_password):
        return Response({'error': 'Current password is incorrect'}, status=400)

    is_valid, error_message = validate_password_custom(new_password)
    if not is_valid:
        return Response({'error': error_message}, status=400)

    user.set_password(new_password)
    user.save()

    return Response({'message': 'Password changed successfully'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_credentials(request):
    user_id = request.user.id
    role = request.user.role if hasattr(request.user, 'role') else 'unknown'

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    pin = request.data.get('pin')
    from .models import SecurityPIN, LoginAttempt

    if not pin:
        return Response({'error': 'PIN is required to change credentials.'}, status=400)

    client_ip = request.META.get('REMOTE_ADDR', 'unknown')

    pin_attempt = LoginAttempt.get_or_create_attempt(client_ip, 'pin')

    if pin_attempt.is_locked_out():
        remaining_time = pin_attempt.get_remaining_lock_time()
        if pin_attempt.failed_attempts >= 6:
            return Response({
                'error': f'Maximum attempts reached. Please try again in the next 24 hours.'
            }, status=429)
        else:
            return Response({
                'error': f'Maximum attempts reached. Please try again in the next 30 minutes.'
            }, status=429)

    is_valid = SecurityPIN.verify_pin(pin)

    if not is_valid:
        pin_attempt.record_failed_attempt()

        if pin_attempt.failed_attempts >= 6:
            return Response({
                'error': 'Maximum attempts reached. Please try again in the next 24 hours.'
            }, status=429)
        elif pin_attempt.failed_attempts >= 3:
            return Response({
                'error': 'Maximum attempts reached. Please try again in the next 30 minutes.'
            }, status=429)

        attempts_remaining = 3 - pin_attempt.failed_attempts
        return Response({
            'error': f'Invalid PIN. {attempts_remaining} attempts remaining.'
        }, status=403)

    pin_attempt.reset_attempts()

    try:
        current_user = Credential.objects.get(id=user_id)  # type: ignore
    except Credential.DoesNotExist:  # type: ignore
        return Response({'error': f'User not found in Credential model. User ID: {user_id}, Role: {role}.'}, status=401)

    target_user_id = request.data.get('target_user_id')
    is_admin_changing_other_user = (
        current_user.role == 'admin' and 
        target_user_id and 
        str(target_user_id) != str(user_id)
    )

    if is_admin_changing_other_user:
        try:
            target_user = Credential.objects.get(id=target_user_id)  # type: ignore
        except Credential.DoesNotExist:  # type: ignore
            return Response({'error': 'Target user not found'}, status=404)

        new_username = request.data.get('new_username')
        new_password = request.data.get('new_password')

        if not new_username or not new_password:
            return Response({'error': 'New username and new password are required'}, status=400)

        is_valid, error_message = validate_password_custom(new_password)
        if not is_valid:
            return Response({'error': error_message}, status=400)

        if Credential.objects.filter(username=new_username).exclude(id=target_user.id).exists():  # type: ignore
            return Response({'error': 'Username already exists'}, status=400)

        target_user.username = new_username
        target_user.set_password(new_password)
        target_user.save()

        return Response({
            'message': f'Successfully updated credentials for user: {target_user.username}',
            'updated_user': {
                'id': target_user.id,
                'username': target_user.username,
                'role': target_user.role
            }
        })

    else:
        current_password = request.data.get('current_password')
        current_username = request.data.get('current_username')  # Optional validation
        new_username = request.data.get('new_username')
        new_password = request.data.get('new_password')

        if not current_password or not new_username or not new_password:
            return Response({'error': 'Current password, new username, and new password are required'}, status=400)

        if current_username and current_username != current_user.username:
            return Response({'error': f'Current username does not match your account. Your username is: {current_user.username}'}, status=400)

        if not current_user.check_password(current_password):
            return Response({'error': 'Current password is incorrect. Please verify your current password.'}, status=400)

        is_valid, error_message = validate_password_custom(new_password)
        if not is_valid:
            return Response({'error': error_message}, status=400)

        if Credential.objects.filter(username=new_username).exclude(id=current_user.id).exists():  # type: ignore
            return Response({'error': 'Username already exists'}, status=400)

        current_user.username = new_username
        current_user.set_password(new_password)
        current_user.save()

        request.session['username'] = new_username
        request.session.save()

        return Response({'message': 'Credentials changed successfully'})

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    identifier = request.data.get('username')

    try:
        user = Credential.objects.get(username=identifier)
    except Credential.DoesNotExist:
        # Generic response so attackers can't probe which usernames exist.
        return Response({'message': 'Reset code sent to email'})

    PasswordResetToken.objects.filter(user=user).delete()

    token = get_random_string(length=6, allowed_chars='1234567890')
    PasswordResetToken.objects.create(user=user, token=token)

    try:
        send_mail(
            'Your YPG Reset Code',
            f'Your password reset code is: {token}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except Exception:
        return Response({'error': 'Could not send reset email. Please try again later.'}, status=500)

    return Response({'message': 'Reset code sent to email'})

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    identifier = request.data.get('username')  
    token = request.data.get('code')
    new_password = request.data.get('new_password')

    try:
        user = Credential.objects.get(username=identifier)
    except Credential.DoesNotExist:
        return Response({'error': 'Invalid reset code'}, status=400)

    reset_entry = PasswordResetToken.objects.filter(user=user, token=token).first()
    if not reset_entry:
        return Response({'error': 'Invalid reset code'}, status=400)
    if reset_entry.is_expired():
        reset_entry.delete()
        return Response({'error': 'Reset code expired'}, status=400)

    is_valid, error_message = validate_password_custom(new_password)
    if not is_valid:
        return Response({'error': error_message}, status=400)

    user.set_password(new_password)
    user.save()
    reset_entry.delete()

    return Response({'message': 'Password reset successfully'})

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=400)

        from .models import LoginAttempt
        login_attempt = LoginAttempt.get_or_create_attempt(username, 'username_password')

        if login_attempt.is_locked_out():
            remaining_time = login_attempt.get_remaining_lock_time()
            if login_attempt.failed_attempts >= 6:
                return Response({
                    'error': f'Maximum attempts reached. Please try again in the next 24 hours.'
                }, status=429)
            else:
                return Response({
                    'error': f'Maximum attempts reached. Please try again in the next 30 minutes.'
                }, status=429)

        try:
            user = Credential.objects.get(username=username, role__in=['admin', 'user'])
            if user.check_password(password):
                login_attempt.reset_attempts()

                request.session.flush()
                request.session['user_id'] = user.id
                request.session['username'] = user.username
                request.session['role'] = user.role
                request.session.set_expiry(86400)
                request.session.save()

                return Response({'success': True, 'message': 'Login successful', 'role': user.role})
        except Credential.DoesNotExist:
            pass

        meeting = Meeting.objects.filter(is_active=True, login_username=username).order_by('-date').first()
        if meeting:
            from django.utils import timezone
            from datetime import date
            today = timezone.now().date()

            if meeting.date != today:
                return Response({'error': 'Invalid credentials'}, status=400)

            if not meeting.has_started():
                return Response({'error': f'Meeting starts at {meeting.start_time.strftime("%H:%M")}, please wait'}, status=400)

            if meeting.is_expired():
                meeting.is_active = False
                meeting.save()
                Credential.objects.filter(meeting=meeting, role='meeting_user').delete()
                return Response({'error': 'Meeting has expired'}, status=400)

            if meeting.check_password(password):
                login_attempt.reset_attempts()

                request.session.flush()
                request.session['meeting_id'] = meeting.id
                request.session['username'] = username
                request.session['role'] = 'meeting_user'
                request.session.set_expiry(86400)
                request.session.save()

                return Response({'success': True, 'message': 'Login successful', 'role': 'meeting_user'})

        login_attempt.record_failed_attempt()

        if login_attempt.failed_attempts >= 6:
            return Response({
                'error': 'Maximum attempts reached. Please try again in the next 24 hours.'
            }, status=429)
        elif login_attempt.failed_attempts >= 3:
            return Response({
                'error': 'Maximum attempts reached. Please try again in the next 30 minutes.'
            }, status=429)

        attempts_remaining = 3 - login_attempt.failed_attempts
        return Response({
            'error': f'Invalid credentials. {attempts_remaining} attempts remaining.'
        }, status=400)

    except Exception as e:
        return Response({'error': 'Login failed. Please try again.'}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_status(request):
    user = request.user
    return Response({
        'loggedIn': True,
        'username': user.username,
        'role': getattr(user, 'role', 'user') if hasattr(user, 'role') else 'user',
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def current_user_info(request):
    """Get current user information for debugging"""
    user_id = request.session.get('user_id')

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
        return Response({
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'email': user.email
        })
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_meeting(request):
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    if not hasattr(request.user, 'role') or request.user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)

    active_meeting = Meeting.objects.filter(is_active=True).first()
    if active_meeting and not active_meeting.is_expired():
        return Response({
            'error': 'There is an active meeting. New meeting cannot be initiated. Deactivate the current meeting before you can set another one.'
        }, status=400)
    elif active_meeting and active_meeting.is_expired():
        active_meeting.is_active = False
        active_meeting.save()
        Credential.objects.filter(meeting=active_meeting, role='meeting_user').delete()

    login_username = request.data.get('login_username')
    login_password = request.data.get('login_password')
    if not login_username or not login_password:
        return Response({
            'error': 'Meeting username and password are required for members to log in.'
        }, status=400)

    date_raw = request.data.get('date')
    if not date_raw:
        return Response({'error': 'Meeting date is required.'}, status=400)
    try:
        from datetime import datetime as dt
        meeting_date = dt.strptime(date_raw, '%Y-%m-%d').date()
    except (ValueError, TypeError, AttributeError):
        return Response({'error': 'Date must be in YYYY-MM-DD format.'}, status=400)

    start_time_raw = request.data.get('start_time', '08:00')
    try:
        start_time = dt.strptime(start_time_raw, '%H:%M').time()
    except (ValueError, TypeError, AttributeError):
        return Response({
            'error': 'Start time must be in HH:MM format.'
        }, status=400)

    duration_hours = request.data.get('duration_hours', 24)
    try:
        duration_hours = int(duration_hours)
        if duration_hours < 1 or duration_hours > 72:
            raise ValueError
    except (ValueError, TypeError):
        return Response({
            'error': 'Duration must be a whole number between 1 and 72 hours.'
        }, status=400)

    if Credential.objects.filter(username=login_username).exclude(role='meeting_user').exists():
        return Response({
            'error': 'This username is already used by an admin or executive account. Choose a different meeting username.'
        }, status=400)

    Meeting.objects.filter(is_active=True).update(is_active=False)

    try:
        meeting = Meeting.objects.create(
            title=request.data.get('title'),
            date=meeting_date,
            meeting_type=request.data.get('meeting_type', 'general'),
            custom_participant_limit=request.data.get('custom_participant_limit'),
            login_username=login_username,
            start_time=start_time,
            duration_hours=duration_hours,
            is_active=True
        )
        meeting.set_password(login_password)
        meeting.save()

        # Remove any existing meeting-member credential using the same username to avoid unique conflicts
        Credential.objects.filter(username=login_username, role='meeting_user').delete()
        member_credential = Credential.objects.create(
            username=login_username,
            role='meeting_user',
            meeting=meeting
        )
        member_credential.set_password(login_password)
        member_credential.save()

        return Response({
            'message': 'Meeting set successfully',
            'meeting': {
                'id': meeting.id,
                'title': meeting.title,
                'date': meeting.date,
                'meeting_type': meeting.meeting_type,
                'custom_participant_limit': meeting.custom_participant_limit,
                'login_username': meeting.login_username,
                'start_time': meeting.start_time.strftime('%H:%M'),
                'duration_hours': meeting.duration_hours,
                'end_time': meeting.get_end_datetime().strftime('%Y-%m-%d %H:%M')
            }
        }, status=201)
    except Exception as e:
        print(f"Error creating meeting: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to create meeting: {str(e)}'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_meeting(request):
    active_meetings = Meeting.objects.filter(is_active=True)

    for meeting in active_meetings:
        if meeting.is_expired():
            meeting.is_active = False
            meeting.save()
            Credential.objects.filter(meeting=meeting, role='meeting_user').delete()

    meeting = Meeting.objects.filter(is_active=True).order_by('-date').first()
    if not meeting:
        return Response({'error': 'No active meeting set.'}, status=404)
    serializer = MeetingSerializer(meeting)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def deactivate_meeting(request):
    user = request.user
    if not user or not user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=401)

    if not hasattr(user, 'role') or user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)

    pin = request.data.get('pin')
    from .models import SecurityPIN
    if not pin or not SecurityPIN.verify_pin(pin):
        return Response({'error': 'Valid PIN required for this action.'}, status=403)

    active_meetings = Meeting.objects.filter(is_active=True)
    from .models import Credential
    Credential.objects.filter(meeting__in=active_meetings, role='meeting_user').delete()
    count = active_meetings.update(is_active=False)
    return Response({'message': f'Deactivated {count} meeting(s)'}, status=200)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def edit_meeting(request):
    user = request.user
    if not user or not user.is_authenticated:
        return Response({'error': 'Authentication required'}, status=401)

    if not hasattr(user, 'role') or user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)

    pin = request.data.get('pin')
    from .models import SecurityPIN
    if not pin or not SecurityPIN.verify_pin(pin):
        return Response({'error': 'Valid PIN required for this action.'}, status=403)

    meeting = Meeting.objects.filter(is_active=True).first()
    if not meeting:
        return Response({'error': 'No active meeting to edit.'}, status=404)

    from datetime import datetime as dt

    if 'title' in request.data:
        meeting.title = request.data.get('title')

    if 'date' in request.data:
        date_raw = request.data.get('date')
        try:
            meeting_date = dt.strptime(date_raw, '%Y-%m-%d').date()
            meeting.date = meeting_date
        except (ValueError, TypeError, AttributeError):
            return Response({'error': 'Date must be in YYYY-MM-DD format.'}, status=400)

    if 'meeting_type' in request.data:
        meeting.meeting_type = request.data.get('meeting_type')

    if 'custom_participant_limit' in request.data:
        custom_limit = request.data.get('custom_participant_limit')
        if custom_limit:
            try:
                meeting.custom_participant_limit = int(custom_limit)
            except (ValueError, TypeError):
                return Response({'error': 'Custom participant limit must be a number.'}, status=400)
        else:
            meeting.custom_participant_limit = None

    if 'start_time' in request.data:
        start_time_raw = request.data.get('start_time')
        try:
            start_time = dt.strptime(start_time_raw, '%H:%M').time()
            meeting.start_time = start_time
        except (ValueError, TypeError, AttributeError):
            return Response({'error': 'Start time must be in HH:MM format.'}, status=400)

    if 'duration_hours' in request.data:
        duration_hours = request.data.get('duration_hours')
        try:
            duration_hours = int(duration_hours)
            if duration_hours < 1 or duration_hours > 72:
                raise ValueError
            meeting.duration_hours = duration_hours
        except (ValueError, TypeError):
            return Response({'error': 'Duration must be a whole number between 1 and 72 hours.'}, status=400)

    if 'login_username' in request.data:
        login_username = request.data.get('login_username')
        if not login_username:
            return Response({'error': 'Meeting username cannot be empty.'}, status=400)

        if Credential.objects.filter(username=login_username).exclude(role='meeting_user').exists():
            return Response({
                'error': 'This username is already used by an admin or executive account. Choose a different meeting username.'
            }, status=400)

        if meeting.login_username != login_username:
            Credential.objects.filter(username=meeting.login_username, role='meeting_user', meeting=meeting).delete()
            meeting.login_username = login_username

    if 'login_password' in request.data:
        login_password = request.data.get('login_password')
        if login_password:
            meeting.set_password(login_password)
            Credential.objects.filter(username=meeting.login_username, role='meeting_user', meeting=meeting).update(
                password=meeting.login_password
            )

    meeting.save()

    if not Credential.objects.filter(username=meeting.login_username, role='meeting_user', meeting=meeting).exists():
        member_credential = Credential.objects.create(
            username=meeting.login_username,
            role='meeting_user',
            meeting=meeting
        )
        member_credential.set_password(meeting.login_password)
        member_credential.save()

    try:
        from .models import AuditLog
        AuditLog.objects.create(
            user=user,
            action='edit',
            model='Meeting',
            object_id=meeting.id,
            details=f'Edited meeting: {meeting.title}'
        )
    except Exception as e:
        logger.warning(f'Failed to log audit entry: {str(e)}')

    return Response({
        'message': 'Meeting updated successfully',
        'meeting': {
            'id': meeting.id,
            'title': meeting.title,
            'date': meeting.date,
            'meeting_type': meeting.meeting_type,
            'custom_participant_limit': meeting.custom_participant_limit,
            'login_username': meeting.login_username,
            'start_time': meeting.start_time.strftime('%H:%M'),
            'duration_hours': meeting.duration_hours,
            'end_time': meeting.get_end_datetime().strftime('%Y-%m-%d %H:%M')
        }
    }, status=200)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_apology(request, pk):
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
        executive_roles = [
            'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
            'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
        ]
        if user.role in executive_roles:
            pin = request.query_params.get('pin')
            from .models import SecurityPIN
            if not pin or not SecurityPIN.verify_pin(pin):
                return Response({'error': 'Valid PIN required for this action.'}, status=403)
            entry = ApologyEntry.objects.get(pk=pk)
        else:
            entry = ApologyEntry.objects.get(pk=pk, submitted_by_id=user_id)
        entry.delete()
        return Response({'message': 'Apology record deleted successfully.'})
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)
    except ApologyEntry.DoesNotExist:
        return Response({'error': 'Record not found or not authorized'}, status=404)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def edit_apology(request, pk):
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        user = Credential.objects.get(id=user_id)
        executive_roles = [
            'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
            'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
        ]
        if user.role in executive_roles:
            pin = request.data.get('pin')
            from .models import SecurityPIN
            if not pin or not SecurityPIN.verify_pin(pin):
                return Response({'error': 'Valid PIN required for this action.'}, status=403)
            entry = ApologyEntry.objects.get(pk=pk)
        else:
            entry = ApologyEntry.objects.get(pk=pk, submitted_by_id=user_id)
        if 'name' in request.data:
            entry.name = request.data['name']
        if 'congregation' in request.data:
            entry.congregation = request.data['congregation']
        if 'position' in request.data:
            entry.position = request.data['position']
        if 'reason' in request.data:
            entry.reason = request.data['reason']
        if 'type' in request.data:
            entry.type = request.data['type']
        if 'meeting_date' in request.data:
            entry.meeting_date = request.data['meeting_date']
        entry.save()
        return Response({'message': 'Apology updated successfully', 'data': ApologyEntrySerializer(entry).data})
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)
    except ApologyEntry.DoesNotExist:
        return Response({'error': 'Record not found or not authorized'}, status=404)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view_django(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=400)

        try:
            user = Credential.objects.get(username=username)
            if user.check_password(password):
                request.session.flush()
                request.session['user_id'] = user.id
                request.session['username'] = user.username
                request.session['role'] = user.role
                request.session.set_expiry(86400)
                request.session.save()

                return Response({'message': 'Login successful', 'role': user.role})
        except Credential.DoesNotExist:
            pass

        meeting = Meeting.objects.filter(is_active=True, login_username=username).order_by('-date').first()
        if meeting and meeting.check_password(password):
            request.session.flush()
            request.session['meeting_id'] = meeting.id
            request.session['username'] = username
            request.session['role'] = 'meeting_user'
            request.session.set_expiry(86400)
            request.session.save()

            return Response({'message': 'Login successful', 'role': 'meeting_user'})

        return Response({'error': 'Invalid credentials'}, status=400)

    except Exception as e:
        return Response({'error': 'Login failed. Please try again.'}, status=500)


def get_combined_records(record_type):
    if record_type == 'local':
        attendance = AttendanceEntry.objects.filter(type='local')
        apology = ApologyEntry.objects.filter(type='local')
    else:
        attendance = AttendanceEntry.objects.filter(type='district')
        apology = ApologyEntry.objects.filter(type='district')
    att_data = AttendanceEntrySerializer(attendance, many=True).data
    apo_data = ApologyEntrySerializer(apology, many=True).data
    for r in att_data:
        r['record_kind'] = 'attendance'
    for r in apo_data:
        r['record_kind'] = 'apology'
    return att_data + apo_data

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def records_list(request, record_type):
    start = request.GET.get('start')
    end = request.GET.get('end')
    records = get_combined_records(record_type)
    if start:
        records = [r for r in records if r['meeting_date'] >= start]
    if end:
        records = [r for r in records if r['meeting_date'] <= end]
    return Response(records)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def record_edit_delete(request, record_type, pk):
    if request.method == 'PUT':
        try:
            if record_type == 'local':
                obj = AttendanceEntry.objects.get(pk=pk, type='local')
                serializer = AttendanceEntrySerializer(obj, data=request.data, partial=True)
            else:
                obj = AttendanceEntry.objects.get(pk=pk, type='district')
                serializer = AttendanceEntrySerializer(obj, data=request.data, partial=True)
        except AttendanceEntry.DoesNotExist:
            try:
                if record_type == 'local':
                    obj = ApologyEntry.objects.get(pk=pk, type='local')
                    serializer = ApologyEntrySerializer(obj, data=request.data, partial=True)
                else:
                    obj = ApologyEntry.objects.get(pk=pk, type='district')
                    serializer = ApologyEntrySerializer(obj, data=request.data, partial=True)
            except ApologyEntry.DoesNotExist:
                return Response({'error': 'Record not found'}, status=404)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    elif request.method == 'DELETE':
        try:
            if record_type == 'local':
                obj = AttendanceEntry.objects.get(pk=pk, type='local')
            else:
                obj = AttendanceEntry.objects.get(pk=pk, type='district')
            obj.delete()
            return Response({'message': 'Deleted'}, status=204)
        except AttendanceEntry.DoesNotExist:
            try:
                if record_type == 'local':
                    obj = ApologyEntry.objects.get(pk=pk, type='local')
                else:
                    obj = ApologyEntry.objects.get(pk=pk, type='district')
                obj.delete()
                return Response({'message': 'Deleted'}, status=204)
            except ApologyEntry.DoesNotExist:
                return Response({'error': 'Record not found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def records_export(request, record_type):
    records = get_combined_records(record_type)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename=\"{record_type}_records_{datetime.now().date()}.csv\"'
    writer = csv.writer(response)
    if records:
        writer.writerow(records[0].keys())
        for r in records:
            writer.writerow([r[k] for k in r])
    return response

def log_action(user, action, model, object_id=None, details=''):
    AuditLog.objects.create(user=user, action=action, model=model, object_id=object_id, details=details)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def soft_delete_record(request, record_type, pk):
    user = request.user if hasattr(request, 'user') else None
    try:
        if record_type == 'attendance':
            obj = AttendanceEntry.objects.get(pk=pk)
        else:
            obj = ApologyEntry.objects.get(pk=pk)
        obj.soft_delete()
        log_action(user, 'delete', record_type, pk)
        return Response({'message': 'Record soft-deleted'})
    except (AttendanceEntry.DoesNotExist, ApologyEntry.DoesNotExist):
        return Response({'error': 'Record not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def restore_record(request, record_type, pk):
    user = request.user if hasattr(request, 'user') else None
    try:
        if record_type == 'attendance':
            obj = AttendanceEntry.objects.get(pk=pk)
        else:
            obj = ApologyEntry.objects.get(pk=pk)
        obj.restore()
        log_action(user, 'restore', record_type, pk)
        return Response({'message': 'Record restored'})
    except (AttendanceEntry.DoesNotExist, ApologyEntry.DoesNotExist):
        return Response({'error': 'Record not found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_soft_delete(request, record_type):
    serializer = BulkIdSerializer(data=request.data)
    if serializer.is_valid():
        ids = serializer.validated_data['ids']
        Model = AttendanceEntry if record_type == 'attendance' else ApologyEntry
        Model.objects.filter(id__in=ids).update(is_deleted=True, deleted_at=timezone.now())
        for pk in ids:
            log_action(request.user, 'delete', record_type, pk)
        return Response({'message': 'Bulk soft-delete complete'})
    return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_restore(request, record_type):
    serializer = BulkIdSerializer(data=request.data)
    if serializer.is_valid():
        ids = serializer.validated_data['ids']
        Model = AttendanceEntry if record_type == 'attendance' else ApologyEntry
        Model.objects.filter(id__in=ids).update(is_deleted=False, deleted_at=None)
        for pk in ids:
            log_action(request.user, 'restore', record_type, pk)
        return Response({'message': 'Bulk restore complete'})
    return Response(serializer.errors, status=400)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_notes_tags(request, record_type, pk):
    serializer = NotesTagsUpdateSerializer(data=request.data)
    if serializer.is_valid():
        Model = AttendanceEntry if record_type == 'attendance' else ApologyEntry
        try:
            obj = Model.objects.get(pk=pk)
            if 'notes' in serializer.validated_data:
                obj.notes = serializer.validated_data['notes']
            if 'tags' in serializer.validated_data:
                obj.tags = serializer.validated_data['tags']
            obj.save()
            log_action(request.user, 'edit', record_type, pk, details='Notes/Tags updated')
            return Response({'message': 'Notes/Tags updated'})
        except Model.DoesNotExist:
            return Response({'error': 'Record not found'}, status=404)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_record_pdf(request, record_type, pk):
    if not canvas:
        return Response({'error': 'PDF export not available. Install reportlab.'}, status=500)
    Model = AttendanceEntry if record_type == 'attendance' else ApologyEntry
    try:
        obj = Model.objects.get(pk=pk)
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        y = 750
        for field in obj._meta.fields:
            value = getattr(obj, field.name)
            p.drawString(50, y, f"{field.name}: {value}")
            y -= 20
        p.save()
        buffer.seek(0)
        log_action(request.user, 'export', record_type, pk, details='PDF export')
        return FileResponse(buffer, as_attachment=True, filename=f'{record_type}_{pk}.pdf')
    except Model.DoesNotExist:
        return Response({'error': 'Record not found'}, status=404)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def advanced_records_list(request, record_type):
    Model = AttendanceEntry if record_type == 'attendance' else ApologyEntry
    queryset = Model.objects.all()
    if 'is_deleted' in request.GET:
        queryset = queryset.filter(is_deleted=request.GET['is_deleted'] == 'true')
    if 'start' in request.GET:
        queryset = queryset.filter(meeting_date__gte=request.GET['start'])
    if 'end' in request.GET:
        queryset = queryset.filter(meeting_date__lte=request.GET['end'])
    if 'search' in request.GET:
        search = request.GET['search']
        queryset = queryset.filter(
            Q(name__icontains=search) | Q(congregation__icontains=search) | Q(position__icontains=search)
        )
    ordering = request.GET.get('ordering', '-meeting_date')
    queryset = queryset.order_by(ordering)
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = AttendanceEntrySerializer(page, many=True) if record_type == 'attendance' else ApologyEntrySerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_log_list(request):
    logs = AuditLog.objects.all().order_by('-timestamp')[:100]
    serializer = AuditLogSerializer(logs, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_pin(request):
    try:
        pin = request.data.get('pin')

        if not pin:
            return Response({'error': 'PIN is required'}, status=400)

        try:
            client_ip = request.META.get('REMOTE_ADDR', 'unknown')

            from .models import LoginAttempt
            pin_attempt = LoginAttempt.get_or_create_attempt(client_ip, 'pin')

            if pin_attempt.is_locked_out():
                remaining_time = pin_attempt.get_remaining_lock_time()
                return Response({
                    'error': 'Access denied. You have tried 3 times, the maximum number of attempts has been reached. Please wait for 10 minutes before trying again.'
                }, status=429)
        except Exception as e:
            logger.warning(f"LoginAttempt tracking disabled: {str(e)}")
            pin_attempt = None

        is_valid = SecurityPIN.verify_pin(pin)

        if is_valid:
            if pin_attempt:
                try:
                    pin_attempt.reset_attempts()
                except Exception as e:
                    logger.warning(f"Could not reset attempts: {str(e)}")

            serializer = PINVerificationSerializer(data={'pin': pin, 'is_valid': is_valid})
            if serializer.is_valid():
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=400)
        else:
            if pin_attempt:
                try:
                    pin_attempt.record_failed_attempt()

                    if pin_attempt.failed_attempts >= 3:
                        return Response({
                            'error': 'Access denied. You have tried 3 times, the maximum number of attempts has been reached. Please wait for 10 minutes before trying again.'
                        }, status=429)

                    attempts_remaining = 3 - pin_attempt.failed_attempts
                    return Response({
                        'error': f'Invalid PIN. {attempts_remaining} attempts remaining.'
                    }, status=400)
                except Exception as e:
                    logger.warning(f"Could not record failed attempt: {str(e)}")

            return Response({
                'error': 'Invalid PIN.'
            }, status=400)
    except Exception as e:
        logger.error(f"Error in verify_pin: {str(e)}")
        return Response({'error': 'Internal server error'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_pin(request):
    """Change the security PIN"""
    if getattr(request.user, 'role', None) != 'admin':
        return Response({'error': 'Admin access required'}, status=403)
    try:
        serializer = PINChangeSerializer(data=request.data)
        if serializer.is_valid():
            current_pin = serializer.validated_data['current_pin']
            new_pin = serializer.validated_data['new_pin']

            try:
                client_ip = request.META.get('REMOTE_ADDR', 'unknown')

                from .models import LoginAttempt
                pin_attempt = LoginAttempt.get_or_create_attempt(client_ip, 'pin')

                if pin_attempt.is_locked_out():
                    remaining_time = pin_attempt.get_remaining_lock_time()
                    if pin_attempt.failed_attempts >= 6:
                        return Response({
                            'error': 'Maximum attempts reached. Please try again in the next 24 hours.'
                        }, status=429)
                    else:
                        return Response({
                            'error': 'Maximum attempts reached. Please try again in the next 30 minutes.'
                        }, status=429)
            except Exception as e:
                logger.warning(f"LoginAttempt tracking disabled in change_pin: {str(e)}")
                pin_attempt = None

            is_valid = SecurityPIN.verify_pin(current_pin)

            if not is_valid:
                if pin_attempt:
                    try:
                        pin_attempt.record_failed_attempt()

                        if pin_attempt.failed_attempts >= 6:
                            return Response({
                                'error': 'Maximum attempts reached. Please try again in the next 24 hours.'
                            }, status=429)
                        elif pin_attempt.failed_attempts >= 3:
                            return Response({
                                'error': 'Maximum attempts reached. Please try again in the next 30 minutes.'
                            }, status=429)

                        attempts_remaining = 3 - pin_attempt.failed_attempts
                        return Response({
                            'error': f'Current PIN is incorrect. {attempts_remaining} attempts remaining.'
                        }, status=400)
                    except Exception as e:
                        logger.warning(f"Could not record failed attempt in change_pin: {str(e)}")

                return Response({
                    'error': 'Current PIN is incorrect.'
                }, status=400)

            if pin_attempt:
                try:
                    pin_attempt.reset_attempts()
                except Exception as e:
                    logger.warning(f"Could not reset attempts in change_pin: {str(e)}")

        SecurityPIN.objects.filter(is_active=True).update(is_active=False)
        SecurityPIN.objects.create(pin=new_pin, is_active=True)

        return Response({'message': 'PIN changed successfully'})
    except Exception as e:
        logger.error(f"Error in change_pin: {str(e)}")
        return Response({'error': 'Internal server error'}, status=500)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pin_status(request):
    """Check if PIN is set up"""
    active_pin = SecurityPIN.get_active_pin()
    return Response({'pin_setup': active_pin is not None})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def setup_initial_pin(request):
    """Setup initial PIN if none exists"""
    if getattr(request.user, 'role', None) != 'admin':
        return Response({'error': 'Admin access required'}, status=403)
    serializer = PINVerificationSerializer(data=request.data)
    if serializer.is_valid():
        pin = serializer.validated_data['pin']

        if SecurityPIN.get_active_pin():
            return Response({'error': 'PIN already exists'}, status=400)

        SecurityPIN.objects.create(pin=pin, is_active=True)
        return Response({'message': 'Initial PIN set successfully'})
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def advanced_combined_records_list(request, record_type):
    """Advanced records list that combines attendance and apology records with search and filtering"""
    records = get_combined_records(record_type)

    if 'search' in request.GET:
        search = request.GET['search'].lower()
        records = [r for r in records if (
            (r.get('name', '').lower().find(search) != -1) or
            (r.get('congregation', '').lower().find(search) != -1) or
            (r.get('position', '').lower().find(search) != -1)
        )]

    if 'start' in request.GET:
        start_date = request.GET['start']
        records = [r for r in records if r.get('meeting_date', '') >= start_date]

    if 'end' in request.GET:
        end_date = request.GET['end']
        records = [r for r in records if r.get('meeting_date', '') <= end_date]

    if 'type' in request.GET:
        type_filter = request.GET['type']
        records = [r for r in records if r.get('type', '') == type_filter]

    if 'year' in request.GET:
        year_filter = request.GET['year']
        records = [r for r in records if r.get('meeting_date', '').startswith(year_filter)]

    ordering = request.GET.get('ordering', '-meeting_date')
    reverse_sort = ordering.startswith('-')
    sort_field = ordering[1:] if reverse_sort else ordering

    records.sort(key=lambda x: x.get(sort_field, ''), reverse=reverse_sort)

    page_size = int(request.GET.get('page_size', 20))
    page = int(request.GET.get('page', 1))

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated_records = records[start_idx:end_idx]

    return Response({
        'count': len(records),
        'next': f"?page={page + 1}" if end_idx < len(records) else None,
        'previous': f"?page={page - 1}" if page > 1 else None,
        'results': paginated_records
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_all_data(request):
    """Clear all attendance and apology data with PIN verification and backup"""
    if getattr(request.user, 'role', None) != 'admin':
        return Response({'error': 'Admin access required'}, status=403)
    try:
        pin = request.data.get('pin')
        if not pin:
            return Response({'error': 'PIN is required to clear all data'}, status=400)

        if not SecurityPIN.verify_pin(pin):
            return Response({'error': 'Invalid PIN'}, status=401)

        user = request.user

        attendance_records = list(AttendanceEntry.objects.all().values())
        apology_records = list(ApologyEntry.objects.all().values())

        attendance_count = len(attendance_records)
        apology_count = len(apology_records)

        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'user_id': getattr(user, 'id', None),
            'username': getattr(user, 'username', 'unknown'),
            'attendance_records': attendance_records,
            'apology_records': apology_records,
            'total_attendance': attendance_count,
            'total_apologies': apology_count
        }

        DataBackup.objects.create(
            created_by=user,
            attendance_count=attendance_count,
            apology_count=apology_count,
            payload=json.loads(json.dumps(backup_data, cls=DjangoJSONEncoder))
        )
        log_action(user, 'backup', 'system', None,
                   f"Backup created before clearing {attendance_count} attendance and {apology_count} apology records")

        AttendanceEntry.objects.all().delete()
        ApologyEntry.objects.all().delete()

        log_action(user, 'clear_all', 'system', None, f'Cleared all data: {attendance_count} attendance, {apology_count} apologies')

        return Response({
            'message': f'Successfully cleared all data',
            'deleted_attendance': attendance_count,
            'deleted_apologies': apology_count,
            'backup_created': True,
            'backup_timestamp': backup_data['timestamp']
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'Failed to clear data: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    """Get list of all users (admin only) for credential management"""
    user_id = request.user.id

    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    try:
        current_user = Credential.objects.get(id=user_id)  # type: ignore
    except Credential.DoesNotExist:  # type: ignore
        return Response({'error': 'User not found'}, status=401)

    if current_user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)

    users = Credential.objects.exclude(role='meeting_user').values('id', 'username', 'role')  # type: ignore

    return Response({
        'users': list(users),
        'total_users': len(users)
    })

@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def get_csrf_token(request):
    return Response({'detail': 'CSRF cookie set'})

class CustomTokenObtainPairView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            logger.warning(f"CustomTokenObtainPairView called with username: {username}")
            if not username or not password:
                logger.warning("Missing username or password")
                return Response({'detail': 'Username and password required.'}, status=400)

            from .models import Credential, Meeting
            from django.utils import timezone
            from datetime import date

            user = None

            try:
                user = Credential.objects.get(username=username, role__in=['admin', 'user'])
                logger.warning(f"User found: {user.username}, checking password...")
                if not user.check_password(password):
                    logger.warning("Password check failed")
                    user = None
                else:
                    logger.warning("Password check passed")
            except Credential.DoesNotExist:
                logger.warning("Executive user not found, trying meeting login")
                pass

            if user is None:
                meeting = Meeting.objects.filter(is_active=True, login_username=username).order_by('-date').first()
                if meeting:
                    today = timezone.now().date()

                    if meeting.date != today:
                        return Response({'detail': 'Invalid credentials'}, status=400)

                    if not meeting.has_started():
                        return Response({'detail': f'Meeting starts at {meeting.start_time.strftime("%H:%M")}, please wait'}, status=400)

                    if meeting.is_expired():
                        meeting.is_active = False
                        meeting.save()
                        Credential.objects.filter(meeting=meeting, role='meeting_user').delete()
                        return Response({'detail': 'Meeting has expired'}, status=400)

                    if meeting.check_password(password):
                        logger.warning(f"Meeting login successful for {username}")
                        try:
                            user = Credential.objects.get(username=username, role='meeting_user', meeting=meeting)
                        except Credential.DoesNotExist:
                            user = Credential.objects.create(
                                username=username,
                                password=meeting.login_password,
                                role='meeting_user',
                                meeting=meeting
                            )
                    else:
                        logger.warning("Meeting password check failed")

            if user is None:
                logger.warning("No valid user found for credentials")
                return Response({'detail': 'No active account for the given credentials'}, status=401)

            refresh = RefreshToken.for_user(user)
            refresh['username'] = user.username
            refresh['role'] = user.role
            refresh['user_id'] = user.id
            access = refresh.access_token
            access['username'] = user.username
            access['role'] = user.role
            access['user_id'] = user.id
            return Response({
                'refresh': str(refresh),
                'access': str(access),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'role': user.role,
                }
            })
        except Exception as e:
            import traceback
            logger.error(traceback.format_exc())
            return Response({'detail': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([AllowAny])
def cron_meeting_reminders(request):
    """Daily/hourly trigger for external cron services.

    Set CRON_SECRET in the environment and call:
    /api/cron/meeting-reminders/?token=<secret>
    """
    import os
    secret = os.getenv('CRON_SECRET', '')
    token = request.query_params.get('token', '')
    if not secret or token != secret:
        return Response({'error': 'Unauthorized'}, status=403)

    from django.core.management import call_command
    out = io.StringIO()
    call_command('send_meeting_absence_reminders', stdout=out)
    return Response({'success': True, 'output': out.getvalue()})
