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
    SecurityPIN
)
from django.http import HttpResponse, FileResponse
from .serializers import (
    AttendanceEntrySerializer, ApologyEntrySerializer, MeetingSerializer, AuditLogSerializer,
    BulkIdSerializer, NotesTagsUpdateSerializer, SecurityPINSerializer, PINVerificationSerializer, PINChangeSerializer
)
import csv
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

            # 🔒 Check for duplicates within the submission
            if name_key in names_seen:
                pass
            else:
                names_seen.add(name_key)

            # 🔒 Check for duplicate phone numbers within the submission
            if phone in phones_seen:
                return Response({'error': f"Duplicate phone number in submission: {phone}"}, status=400)
            phones_seen.add(phone)

            # 🔒 Check for existing record in the DB (same phone, meeting, type)
            existing = AttendanceEntry.objects.filter(
                phone=phone,
                meeting_date=item['meeting_date'],
                type=item['type']
            ).exists()
            if existing:
                return Response({'error': f"Phone number {phone} already submitted for this meeting and type."}, status=400)

            # 🔒 Check for phone number already used in a different congregation
            existing_phone = AttendanceEntry.objects.filter(
                phone=phone,
                meeting_date=item['meeting_date'],
                type=item['type']
            ).exclude(congregation=item['congregation']).first()

            if existing_phone:
                return Response({
                    'error': f"Phone number {phone} has already been used for {existing_phone.congregation} in this meeting."
                }, status=400)

            # Optional: Remove timestamp from item if you're auto-generating it
            item.pop('timestamp', None)

            # 🛠 Create entry
            AttendanceEntry.objects.create(**item, submitted_by_id=user_id)

        return Response({'message': 'Attendance submitted successfully!'}, status=201)

    return Response(serializer.errors, status=400)



@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def submit_apologies(request):
    if request.method == 'GET':
        # Return existing apologies for the current user
        user_id = request.user.id
        if not user_id:
            return Response({'error': 'Not authenticated'}, status=401)
        
        try:
            user = Credential.objects.get(id=user_id)
            # Executives can see all apologies, regular users only see their own
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
            
            # Require admin credentials and apologies array for all submissions
            admin_username = request.data.get('admin_username')
            admin_password = request.data.get('admin_password')
            apologies_data = request.data.get('apologies', [])

            # Require admin credentials and apologies array for all submissions
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

            # Process all apologies
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

    # List of executive roles that can see all data
    executive_roles = [
        'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
        'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
    ]

    # Filter by user's role - executives can see all, others see only their own
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

    # List of executive roles that can see all data
    executive_roles = [
        'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
        'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
    ]

    # Filter by user's role - executives can see all, others see only their own
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

    # Filter by user's role - admins can see all, others see only their own
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
    
    data = []
    for entry in entries:
        # Get meeting title for this entry
        try:
            meeting = Meeting.objects.get(date=entry.meeting_date, is_active=True)
            meeting_title = meeting.title
        except Meeting.DoesNotExist:
            meeting_title = "Unknown Meeting"
        
        data.append({
            "id": entry.id, 
            "congregation": entry.congregation, 
            "timestamp": entry.timestamp,
            "meeting_title": meeting_title,
            "meeting_date": entry.meeting_date
        })
    
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def district_attendance(request):
    user_id = request.user.id
    
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)

    # Filter by user's role - admins can see all, others see only their own
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
    
    data = []
    for entry in entries:
        # Get meeting title for this entry
        try:
            meeting = Meeting.objects.get(date=entry.meeting_date, is_active=True)
            meeting_title = meeting.title
        except Meeting.DoesNotExist:
            meeting_title = "Unknown Meeting"
        
        data.append({
            "id": entry.id, 
            "congregation": entry.congregation, 
            "timestamp": entry.timestamp,
            "meeting_title": meeting_title,
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
            # Require PIN for executive actions
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
            # Require PIN for executive actions
            pin = request.data.get('pin')
            from .models import SecurityPIN
            if not pin or not SecurityPIN.verify_pin(pin):
                return Response({'error': 'Valid PIN required for this action.'}, status=403)
            entry = AttendanceEntry.objects.get(pk=pk)
        else:
            entry = AttendanceEntry.objects.get(pk=pk, submitted_by_id=user_id)
        # Update fields if provided
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
    
    # Filter by user's role - executives can see all, others see only their own
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

    # Group by meeting title and count
    meeting_counts = entries.values('meeting_date').annotate(count=Count('id'))
    return Response(meeting_counts)

# ------------------ Auth & Password Views ------------------

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
    
    # Use custom password validation
    is_valid, error_message = validate_password_custom(new_password)
    if not is_valid:
        return Response({'error': error_message}, status=400)
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})

@api_view(['POST'])
@permission_classes([AllowAny])
def change_credentials(request):
    user_id = request.session.get('user_id')
    role = request.session.get('role', 'unknown')
    
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)
    
    # --- PIN check here ---
    pin = request.data.get('pin')
    from .models import SecurityPIN
    if not pin or not SecurityPIN.verify_pin(pin):
        return Response({'error': 'Valid PIN required to change credentials.'}, status=403)
    
    try:
        current_user = Credential.objects.get(id=user_id)  # type: ignore
    except Credential.DoesNotExist:  # type: ignore
        return Response({'error': f'User not found in Credential model. User ID: {user_id}, Role: {role}.'}, status=401)
    
    # Check if admin is changing another user's credentials
    target_user_id = request.data.get('target_user_id')
    is_admin_changing_other_user = (
        current_user.role == 'admin' and 
        target_user_id and 
        str(target_user_id) != str(user_id)
    )
    
    if is_admin_changing_other_user:
        # Admin changing another user's credentials
        try:
            target_user = Credential.objects.get(id=target_user_id)  # type: ignore
        except Credential.DoesNotExist:  # type: ignore
            return Response({'error': 'Target user not found'}, status=404)
        
        new_username = request.data.get('new_username')
        new_password = request.data.get('new_password')
        
        if not new_username or not new_password:
            return Response({'error': 'New username and new password are required'}, status=400)
        
        # Use custom password validation
        is_valid, error_message = validate_password_custom(new_password)
        if not is_valid:
            return Response({'error': error_message}, status=400)
        
        # Check if new username already exists (excluding target user)
        if Credential.objects.filter(username=new_username).exclude(id=target_user.id).exists():  # type: ignore
            return Response({'error': 'Username already exists'}, status=400)
        
        # Update target user's credentials
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
        # User changing their own credentials (existing logic)
        current_password = request.data.get('current_password')
        current_username = request.data.get('current_username')  # Optional validation
        new_username = request.data.get('new_username')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_username or not new_password:
            return Response({'error': 'Current password, new username, and new password are required'}, status=400)
        
        # Validate current username if provided (optional check)
        if current_username and current_username != current_user.username:
            return Response({'error': f'Current username does not match your account. Your username is: {current_user.username}'}, status=400)
        
        if not current_user.check_password(current_password):
            return Response({'error': 'Current password is incorrect. Please verify your current password.'}, status=400)
        
        # Use custom password validation
        is_valid, error_message = validate_password_custom(new_password)
        if not is_valid:
            return Response({'error': error_message}, status=400)
        
        # Check if new username already exists (excluding current user)
        if Credential.objects.filter(username=new_username).exclude(id=current_user.id).exists():  # type: ignore
            return Response({'error': 'Username already exists'}, status=400)
        
        # Update username and password
        current_user.username = new_username
        current_user.set_password(new_password)
        current_user.save()
        
        # Update session with new username
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
        return Response({'error': 'User not found'}, status=404)

    PasswordResetToken.objects.filter(user=user).delete()

    token = get_random_string(length=6, allowed_chars='1234567890')
    PasswordResetToken.objects.create(user=user, token=token)

    send_mail(
        'Your YPG Reset Code',
        f'Your password reset code is: {token}',
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )

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
        return Response({'error': 'User not found'}, status=404)

    reset_entry = PasswordResetToken.objects.filter(user=user, token=token).first()
    if not reset_entry:
        return Response({'error': 'Invalid reset code'}, status=400)
    if reset_entry.is_expired():
        reset_entry.delete()
        return Response({'error': 'Reset code expired'}, status=400)

    # Use custom password validation
    is_valid, error_message = validate_password_custom(new_password)
    if not is_valid:
        return Response({'error': error_message}, status=400)

    user.set_password(new_password)
    user.save()
    reset_entry.delete()

    return Response({'message': 'Password reset successfully'})

#
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=400)

        # 1. Try executive login (Credential model)
        try:
            user = Credential.objects.get(username=username)
            if user.check_password(password):
                
                request.session.flush()
                request.session['user_id'] = user.id
                request.session['username'] = user.username
                request.session['role'] = user.role
                request.session.set_expiry(86400)
                request.session.save()
                
                return Response({'success': True, 'message': 'Login successful', 'role': user.role})
        except Credential.DoesNotExist:
            pass

        # 2. Try meeting login (Meeting model, only active meeting)
        meeting = Meeting.objects.filter(is_active=True, login_username=username).order_by('-date').first()
        if meeting and meeting.check_password(password):
            request.session.flush()
            request.session['meeting_id'] = meeting.id
            request.session['username'] = username
            request.session['role'] = 'meeting_user'
            request.session.set_expiry(86400)
            request.session.save()
            
            return Response({'success': True, 'message': 'Login successful', 'role': 'meeting_user'})

        return Response({'error': 'Invalid credentials'}, status=400)
    
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
        # Add more user info if needed
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

# --- Meeting Endpoints ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_meeting(request):
    user_id = request.user.id
    
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)
    
    # Verify admin credentials from request
    admin_username = request.data.get('admin_username')
    admin_password = request.data.get('admin_password')
    
    if not admin_username or not admin_password:
        return Response({'error': 'Admin credentials required'}, status=400)
    
    try:
        admin_user = Credential.objects.get(username=admin_username, role='admin')
        if not admin_user.check_password(admin_password):
            return Response({'error': 'Invalid admin credentials'}, status=401)
    except Credential.DoesNotExist:
        return Response({'error': 'Invalid admin credentials'}, status=401)

    # Check if there's already an active and non-expired meeting on the same date
    meeting_date = request.data.get('date')
    if meeting_date:
        existing_meeting = Meeting.objects.filter(date=meeting_date, is_active=True).first()
        if existing_meeting and not existing_meeting.is_expired():
            return Response({
                'error': 'Cannot set two meetings same day, deactivate the current meeting details before you can set another one.'
            }, status=400)
        elif existing_meeting and existing_meeting.is_expired():
            # Auto-deactivate expired meeting
            existing_meeting.is_active = False
            existing_meeting.save()

    # Deactivate all existing meetings
    Meeting.objects.filter(is_active=True).update(is_active=False)
    
    # Create new meeting
    try:
        meeting = Meeting.objects.create(
            title=request.data.get('title'),
            date=request.data.get('date'),
            is_active=True
        )
        
        return Response({
            'message': 'Meeting set successfully',
            'meeting': {
                'id': meeting.id,
                'title': meeting.title,
                'date': meeting.date
            }
        }, status=201)
    except Exception as e:
        return Response({'error': 'Failed to create meeting'}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_meeting(request):
    # First, check for and deactivate any expired meetings
    active_meetings = Meeting.objects.filter(is_active=True)
    expired_meetings = []
    
    for meeting in active_meetings:
        if meeting.is_expired():
            meeting.is_active = False
            meeting.save()
            expired_meetings.append(meeting)
    
    # If any meetings were deactivated, log it
    if expired_meetings:
        pass
    
    # Now get the current active meeting
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
    
    # Require PIN for meeting deactivation
    pin = request.data.get('pin')
    from .models import SecurityPIN
    if not pin or not SecurityPIN.verify_pin(pin):
        return Response({'error': 'Valid PIN required for this action.'}, status=403)
    
    count = Meeting.objects.filter(is_active=True).update(is_active=False)
    return Response({'message': f'Deactivated {count} meeting(s)'}, status=200)

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
            # Require PIN for executive actions
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
            # Require PIN for executive actions
            pin = request.data.get('pin')
            from .models import SecurityPIN
            if not pin or not SecurityPIN.verify_pin(pin):
                return Response({'error': 'Valid PIN required for this action.'}, status=403)
            entry = ApologyEntry.objects.get(pk=pk)
        else:
            entry = ApologyEntry.objects.get(pk=pk, submitted_by_id=user_id)
        # Update fields if provided
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

        # Try to authenticate with custom Credential model
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

        # Try meeting login (Meeting model, only active meeting)
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


# Helper to combine and serialize records
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
@permission_classes([AllowAny])
def records_list(request, record_type):
    # Optional: filter by date range
    start = request.GET.get('start')
    end = request.GET.get('end')
    records = get_combined_records(record_type)
    if start:
        records = [r for r in records if r['meeting_date'] >= start]
    if end:
        records = [r for r in records if r['meeting_date'] <= end]
    return Response(records)

@api_view(['PUT', 'DELETE'])
@permission_classes([AllowAny])
def record_edit_delete(request, record_type, pk):
    if request.method == 'PUT':
        # Try attendance first, then apology
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
@permission_classes([AllowAny])
def records_export(request, record_type):
    records = get_combined_records(record_type)
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename=\"{record_type}_records_{datetime.now().date()}.csv\"'
    writer = csv.writer(response)
    # Write header
    if records:
        writer.writerow(records[0].keys())
        for r in records:
            writer.writerow([r[k] for k in r])
    return response

# --- Utility: Audit Log ---
def log_action(user, action, model, object_id=None, details=''):
    AuditLog.objects.create(user=user, action=action, model=model, object_id=object_id, details=details)

# --- Soft Delete & Restore ---
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

# --- Bulk Actions ---
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

# --- Notes/Tags Update ---
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

# --- PDF Export (Single Record) ---
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

# --- Advanced Filtering, Sorting, Pagination ---
class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def advanced_records_list(request, record_type):
    Model = AttendanceEntry if record_type == 'attendance' else ApologyEntry
    queryset = Model.objects.all()
    # Filtering
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
    # Sorting
    ordering = request.GET.get('ordering', '-meeting_date')
    queryset = queryset.order_by(ordering)
    # Pagination
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(queryset, request)
    serializer = AttendanceEntrySerializer(page, many=True) if record_type == 'attendance' else ApologyEntrySerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)

# --- Audit Log Viewing (Admin only) ---
@api_view(['GET'])
@permission_classes([IsAdminUser])
def audit_log_list(request):
    logs = AuditLog.objects.all().order_by('-timestamp')[:100]
    serializer = AuditLogSerializer(logs, many=True)
    return Response(serializer.data)

# --- PIN Management ---
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_pin(request):
    pin = request.data.get('pin')
    
    if not pin:
        return Response({'error': 'PIN is required'}, status=400)
    
    is_valid = SecurityPIN.verify_pin(pin)
    
    serializer = PINVerificationSerializer(data={'pin': pin, 'is_valid': is_valid})
    if serializer.is_valid():
        return Response(serializer.data)
    else:
        return Response(serializer.errors, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def change_pin(request):
    """Change the security PIN"""
    serializer = PINChangeSerializer(data=request.data)
    if serializer.is_valid():
        current_pin = serializer.validated_data['current_pin']
        new_pin = serializer.validated_data['new_pin']
        
        # Verify current PIN
        if not SecurityPIN.verify_pin(current_pin):
            return Response({'error': 'Current PIN is incorrect'}, status=400)
        
        # Deactivate current PIN and create new one
        SecurityPIN.objects.filter(is_active=True).update(is_active=False)
        SecurityPIN.objects.create(pin=new_pin, is_active=True)
        
        return Response({'message': 'PIN changed successfully'})
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_pin_status(request):
    """Check if PIN is set up"""
    active_pin = SecurityPIN.get_active_pin()
    return Response({'pin_setup': active_pin is not None})

@api_view(['POST'])
@permission_classes([AllowAny])
def setup_initial_pin(request):
    """Setup initial PIN if none exists"""
    serializer = PINVerificationSerializer(data=request.data)
    if serializer.is_valid():
        pin = serializer.validated_data['pin']
        
        # Check if PIN already exists
        if SecurityPIN.get_active_pin():
            return Response({'error': 'PIN already exists'}, status=400)
        
        # Create initial PIN
        SecurityPIN.objects.create(pin=pin, is_active=True)
        return Response({'message': 'Initial PIN set successfully'})
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def advanced_combined_records_list(request, record_type):
    """Advanced records list that combines attendance and apology records with search and filtering"""
    # Get combined records like the existing records_list function
    records = get_combined_records(record_type)
    
    # Apply search filter
    if 'search' in request.GET:
        search = request.GET['search'].lower()
        records = [r for r in records if (
            (r.get('name', '').lower().find(search) != -1) or
            (r.get('congregation', '').lower().find(search) != -1) or
            (r.get('position', '').lower().find(search) != -1)
        )]
    
    # Apply date range filters
    if 'start' in request.GET:
        start_date = request.GET['start']
        records = [r for r in records if r.get('meeting_date', '') >= start_date]
    
    if 'end' in request.GET:
        end_date = request.GET['end']
        records = [r for r in records if r.get('meeting_date', '') <= end_date]
    
    # Apply type filter
    if 'type' in request.GET:
        type_filter = request.GET['type']
        records = [r for r in records if r.get('type', '') == type_filter]
    
    # Apply year filter
    if 'year' in request.GET:
        year_filter = request.GET['year']
        records = [r for r in records if r.get('meeting_date', '').startswith(year_filter)]
    
    # Sorting
    ordering = request.GET.get('ordering', '-meeting_date')
    reverse_sort = ordering.startswith('-')
    sort_field = ordering[1:] if reverse_sort else ordering
    
    records.sort(key=lambda x: x.get(sort_field, ''), reverse=reverse_sort)
    
    # Pagination
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
@permission_classes([AllowAny])
def clear_all_data(request):
    """Clear all attendance and apology data with PIN verification and backup"""
    try:
        # Get PIN from request
        pin = request.data.get('pin')
        if not pin:
            return Response({'error': 'PIN is required to clear all data'}, status=400)
        
        # Verify PIN
        if not SecurityPIN.verify_pin(pin):
            return Response({'error': 'Invalid PIN'}, status=401)
        
        # Get user info for audit log
        user_id = request.session.get('user_id')
        user = None
        if user_id:
            try:
                user = Credential.objects.get(id=user_id)
            except Credential.DoesNotExist:
                pass
        
        # Get all attendance and apology records for backup
        attendance_records = list(AttendanceEntry.objects.all().values())
        apology_records = list(ApologyEntry.objects.all().values())
        
        attendance_count = len(attendance_records)
        apology_count = len(apology_records)
        
        # Create backup in database (store as JSON in a backup table or as a file)
        backup_data = {
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id,
            'username': user.username if user else 'unknown',
            'attendance_records': attendance_records,
            'apology_records': apology_records,
            'total_attendance': attendance_count,
            'total_apologies': apology_count
        }
        
        # Store backup in database (you can create a Backup model if needed)
        # For now, we'll log it as an audit entry
        backup_info = f"Backup created before clearing {attendance_count} attendance and {apology_count} apology records"
        if user:
            log_action(user, 'backup', 'system', None, backup_info)
        
        # Delete all records
        AttendanceEntry.objects.all().delete()
        ApologyEntry.objects.all().delete()
        
        # Log the clear action
        if user:
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
@permission_classes([AllowAny])
def get_all_users(request):
    """Get list of all users (admin only) for credential management"""
    user_id = request.session.get('user_id')
    
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)
    
    try:
        current_user = Credential.objects.get(id=user_id)  # type: ignore
    except Credential.DoesNotExist:  # type: ignore
        return Response({'error': 'User not found'}, status=401)
    
    # Only admins can see all users
    if current_user.role != 'admin':
        return Response({'error': 'Admin access required'}, status=403)
    
    # Get all users with basic info (excluding password)
    users = Credential.objects.all().values('id', 'username', 'role')  # type: ignore
    
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
        username = request.data.get('username')
        password = request.data.get('password')
        logger.warning(f"CustomTokenObtainPairView called with username: {username}")
        if not username or not password:
            logger.warning("Missing username or password")
            return Response({'detail': 'Username and password required.'}, status=400)
        from .models import Credential
        try:
            user = Credential.objects.get(username=username)
            logger.warning(f"User found: {user.username}, checking password...")
            if not user.check_password(password):
                logger.warning("Password check failed")
                return Response({'detail': 'No active account for the given credentials'}, status=401)
            logger.warning("Password check passed")
        except Credential.DoesNotExist:
            logger.warning("User not found")
            return Response({'detail': 'No active account for the given credentials'}, status=401)
        # Create JWT tokens
        refresh = RefreshToken.for_user(user)
        # Add custom claims
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