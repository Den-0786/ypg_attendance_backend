from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.db.models import Count, Q
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.contrib.auth import logout, login as django_login, authenticate
from .models import (
    AttendanceEntry,
    ApologyEntry,
    Credential,
    PasswordResetToken,
    Meeting,
    AuditLog
)
from django.http import HttpResponse, FileResponse
from .serializers import AttendanceEntrySerializer, ApologyEntrySerializer, MeetingSerializer, AuditLogSerializer, BulkIdSerializer, NotesTagsUpdateSerializer
import csv
from datetime import datetime, timezone
from rest_framework.pagination import PageNumberPagination
import io
try:
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
except ImportError:
    canvas = None  
from django.utils.deprecation import MiddlewareMixin

class DebugPrintMiddleware(MiddlewareMixin):
    def process_request(self, request):
        print(f"[DEBUG] {request.method} {request.path}")

@api_view(['POST'])
@permission_classes([AllowAny])
def submit_attendance(request):
    user_id = request.session.get('user_id')
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
                return Response({'error': f"Duplicate name in submission: {item['name']}"}, status=400)
            names_seen.add(name_key)

            # 🔒 Check for duplicate phone numbers within the submission
            if phone in phones_seen:
                return Response({'error': f"Duplicate phone number in submission: {phone}"}, status=400)
            phones_seen.add(phone)

            # 🔒 Check for existing record in the DB (same name, meeting, type, user)
            existing = AttendanceEntry.objects.filter(
                name=item['name'],
                meeting_date=item['meeting_date'],
                type=item['type'],
                submitted_by_id=user_id
            ).exists()

            if existing:
                return Response({'error': f"{item['name']} already submitted for this meeting."}, status=400)

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

            # 🔒 Role-based restrictions: Check if user has already submitted for the opposite type
            opposite_type = 'district' if item['type'] == 'local' else 'local'
            existing_opposite = AttendanceEntry.objects.filter(
                submitted_by_id=user_id,
                meeting_date=item['meeting_date'],
                type=opposite_type
            ).exists()

            if existing_opposite:
                return Response({
                    'error': f"You have already submitted attendance for {opposite_type} meeting. You cannot submit for both local and district meetings."
                }, status=400)

            # Optional: Remove timestamp from item if you're auto-generating it
            item.pop('timestamp', None)

            # 🛠 Create entry
            AttendanceEntry.objects.create(**item, submitted_by_id=user_id)

        return Response({'message': 'Attendance submitted successfully!'}, status=201)

    return Response(serializer.errors, status=400)



@api_view(['POST'])
@permission_classes([AllowAny])
def submit_apologies(request):
    print(f"[DEBUG] submit_apologies called - Method: {request.method}")
    print(f"[DEBUG] Request data: {request.data}")
    
    # First try to authenticate with provided admin credentials
    admin_username = request.data.get('admin_username')
    admin_password = request.data.get('admin_password')
    
    if admin_username and admin_password:
        try:
            user = Credential.objects.get(username=admin_username)
            if user.check_password(admin_password):
                # Set session for this user
                request.session.flush()
                request.session['user_id'] = user.id
                request.session['username'] = user.username
                request.session['role'] = user.role
                request.session.set_expiry(86400)
                request.session.save()
                print(f"[DEBUG] Admin authentication successful - User: {user.username}, Role: {user.role}")
            else:
                return Response({'error': 'Invalid admin credentials'}, status=401)
        except Credential.DoesNotExist:
            return Response({'error': 'Admin user not found'}, status=401)
    else:
        # Fall back to session authentication
        user_id = request.session.get('user_id')
        print(f"[DEBUG] User authenticated: {bool(user_id)}")
        print(f"[DEBUG] Session user_id: {user_id}")
        print(f"[DEBUG] Session data: {dict(request.session)}")
        
        if not user_id:
            return Response({'error': 'Authentication required'}, status=401)
        
        try:
            user = Credential.objects.get(id=user_id)
        except Credential.DoesNotExist:
            return Response({'error': 'User not found'}, status=401)
    
    # Get the apologies data (remove admin credentials from the data)
    apologies_data = request.data.get('apologies', [])
    if not apologies_data:
        return Response({'error': 'No apologies data provided'}, status=400)
    
    serializer = ApologyEntrySerializer(data=apologies_data, many=True)

    if serializer.is_valid():
        names_seen = set()

        for item in serializer.validated_data:
            name_key = item['name'].strip().lower()

            # 🔒 Check for duplicate names within batch
            if name_key in names_seen:
                return Response({'error': f"Duplicate name in submission: {item['name']}"}, status=400)
            names_seen.add(name_key)

            # 🔒 Check for existing apology
            existing = ApologyEntry.objects.filter(
                name=item['name'],
                meeting_date=item['meeting_date'],
                type=item['type'],
                submitted_by_id=user.id
            ).exists()

            if existing:
                return Response({'error': f"{item['name']} has already submitted an apology for this meeting."}, status=400)

            item.pop('timestamp', None)  # Optional cleanup
            ApologyEntry.objects.create(**item, submitted_by_id=user.id)

        return Response({'message': 'Apologies submitted successfully!'}, status=201)

    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_attendance_summary(request):
    year = request.GET.get('year')
    congregation = request.GET.get('congregation')
    user_id = request.session.get('user_id')
    
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
@permission_classes([AllowAny])
def get_apology_summary(request):
    year = request.GET.get('year')
    congregation = request.GET.get('congregation')
    user_id = request.session.get('user_id')
    
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
@permission_classes([AllowAny])
def local_attendance(request):
    user_id = request.session.get('user_id')
    
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
@permission_classes([AllowAny])
def district_attendance(request):
    user_id = request.session.get('user_id')
    
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
@permission_classes([AllowAny])
def delete_attendance(request, pk):
    print(f"[DEBUG] delete_attendance called with pk: {pk}")
    user_id = request.session.get('user_id')
    print(f"[DEBUG] user_id from session: {user_id}")
    
    if not user_id:
        print("[DEBUG] No user_id in session")
        return Response({'error': 'Authentication required'}, status=401)
    
    try:
        user = Credential.objects.get(id=user_id)
        print(f"[DEBUG] User found: {user.username}, role: {user.role}")
        executive_roles = [
            'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
            'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
        ]
        if user.role in executive_roles:
            print(f"[DEBUG] User is executive, looking for any attendance entry with pk: {pk}")
            entry = AttendanceEntry.objects.get(pk=pk)
        else:
            print(f"[DEBUG] User is not executive, looking for attendance entry with pk: {pk} and submitted_by: {user_id}")
            entry = AttendanceEntry.objects.get(pk=pk, submitted_by_id=user_id)
        
        print(f"[DEBUG] Found entry: {entry.name} - {entry.congregation}")
        entry.delete()
        print("[DEBUG] Entry deleted successfully")
        return Response({'message': 'Attendance record deleted successfully.'})
    except Credential.DoesNotExist:
        print("[DEBUG] Credential.DoesNotExist")
        return Response({'error': 'User not found'}, status=401)
    except AttendanceEntry.DoesNotExist:
        print(f"[DEBUG] AttendanceEntry.DoesNotExist for pk: {pk}")
        return Response({'error': 'Record not found or not authorized'}, status=404)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def edit_attendance(request, pk):
    user_id = request.session.get('user_id')
    
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)
    
    try:
        user = Credential.objects.get(id=user_id)
        executive_roles = [
            'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
            'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
        ]
        if user.role in executive_roles:
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
@permission_classes([AllowAny])
def attendance_by_meeting_title(request):
    user_id = request.session.get('user_id')
    
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
    
    if len(new_password) < 8:
        return Response({'error': 'New password must be at least 8 characters long'}, status=400)
    
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password changed successfully'})

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

    user.set_password(new_password)
    user.save()
    reset_entry.delete()
    return Response({'message': 'Password reset successful'})

#
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    try:
        print('Raw body:', request.body)  
        print('Parsed data:', request.data)  

        username = request.data.get('username')
        password = request.data.get('password')
        
        print('LOGIN ATTEMPT:', username, password)
        
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
                
                print(f"[DEBUG] Login successful - User: {user.username}, Role: {user.role}")
                print(f"[DEBUG] Session ID: {request.session.session_key}")
                print(f"[DEBUG] Session data: {dict(request.session)}")
                
                return Response({'message': 'Login successful', 'role': user.role})
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
            
            print(f"[DEBUG] Meeting login successful - Username: {username}")
            print(f"[DEBUG] Session ID: {request.session.session_key}")
            print(f"[DEBUG] Session data: {dict(request.session)}")
            
            return Response({'message': 'Login successful', 'role': 'meeting_user'})

        return Response({'error': 'Invalid credentials'}, status=400)
    
    except Exception as e:
        print("Login error:", e)
        return Response({'error': 'Login failed. Please try again.'}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logged out'})

@api_view(['GET'])
@permission_classes([AllowAny])
def session_status(request):
    if request.session.get('user_id'):
        role = request.session.get('role', 'user')
        # Check if there's an active meeting for non-admin users
        meetingSet = False
        if role != 'admin':
            meetingSet = Meeting.objects.filter(is_active=True).exists()
        else:
            meetingSet = True  # Admins always have meetingSet = True
            
        return Response({
            'loggedIn': True,
            'role': role,
            'meetingSet': meetingSet
        })
    return Response({'loggedIn': False})

# --- Meeting Endpoints ---
@api_view(['POST'])
@permission_classes([AllowAny])
def set_meeting(request):
    print(f"[DEBUG] set_meeting called - Method: {request.method}")
    print(f"[DEBUG] Request data: {request.data}")
    
    user_id = request.session.get('user_id')
    print(f"[DEBUG] User authenticated: {bool(user_id)}")
    print(f"[DEBUG] Session user_id: {user_id}")
    print(f"[DEBUG] Session data: {dict(request.session)}")
    
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)
    
    # Only admins and executives can set meetings
    try:
        user = Credential.objects.get(id=user_id)
        if user.role not in ['admin', 'President', 'Vice President', 'Secretary', 'Treasurer']:
            return Response({'error': 'Insufficient permissions'}, status=403)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    # Deactivate all existing meetings
    Meeting.objects.filter(is_active=True).update(is_active=False)
    
    # Create new meeting
    try:
        meeting = Meeting.objects.create(
            title=request.data.get('title'),
            date=request.data.get('date'),
            login_username=request.data.get('login_username'),
            is_active=True
        )
        meeting.set_password(request.data.get('login_password'))
        meeting.save()
        
        print(f"[DEBUG] Received data - Title: {meeting.title}, Date: {meeting.date}, Username: {meeting.login_username}")
        print(f"[DEBUG] Meeting created successfully: {meeting.id}")
        
        return Response({
            'message': 'Meeting set successfully',
            'meeting': {
                'id': meeting.id,
                'title': meeting.title,
                'date': meeting.date,
                'login_username': meeting.login_username
            }
        }, status=201)
    except Exception as e:
        print(f"[DEBUG] Error creating meeting: {str(e)}")
        return Response({'error': 'Failed to create meeting'}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def current_meeting(request):
    meeting = Meeting.objects.filter(is_active=True).order_by('-date').first()
    if not meeting:
        return Response({'error': 'No active meeting set.'}, status=404)
    serializer = MeetingSerializer(meeting)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def deactivate_meeting(request):
    print(f"[DEBUG] deactivate_meeting called - Method: {request.method}")
    user_id = request.session.get('user_id')
    print(f"[DEBUG] Session user_id: {user_id}")
    
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)
    
    # Only admins and executives can deactivate meetings
    try:
        user = Credential.objects.get(id=user_id)
        if user.role not in ['admin', 'President', 'Vice President', 'Secretary', 'Treasurer']:
            return Response({'error': 'Insufficient permissions'}, status=403)
    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=401)

    count = Meeting.objects.filter(is_active=True).update(is_active=False)
    print(f"[DEBUG] Deactivated {count} meetings")
    return Response({'message': f'Deactivated {count} meeting(s)'}, status=200)

@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_apology(request, pk):
    print(f"[DEBUG] delete_apology called with pk: {pk}")
    user_id = request.session.get('user_id')
    print(f"[DEBUG] user_id from session: {user_id}")
    
    if not user_id:
        print("[DEBUG] No user_id in session")
        return Response({'error': 'Authentication required'}, status=401)
    
    try:
        user = Credential.objects.get(id=user_id)
        print(f"[DEBUG] User found: {user.username}, role: {user.role}")
        executive_roles = [
            'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
            'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
        ]
        if user.role in executive_roles:
            print(f"[DEBUG] User is executive, looking for any apology entry with pk: {pk}")
            entry = ApologyEntry.objects.get(pk=pk)
        else:
            print(f"[DEBUG] User is not executive, looking for apology entry with pk: {pk} and submitted_by: {user_id}")
            entry = ApologyEntry.objects.get(pk=pk, submitted_by_id=user_id)
        
        print(f"[DEBUG] Found entry: {entry.name} - {entry.congregation}")
        entry.delete()
        print("[DEBUG] Entry deleted successfully")
        return Response({'message': 'Apology record deleted successfully.'})
    except Credential.DoesNotExist:
        print("[DEBUG] Credential.DoesNotExist")
        return Response({'error': 'User not found'}, status=401)
    except ApologyEntry.DoesNotExist:
        print(f"[DEBUG] ApologyEntry.DoesNotExist for pk: {pk}")
        return Response({'error': 'Record not found or not authorized'}, status=404)

@api_view(['PATCH'])
@permission_classes([AllowAny])
def edit_apology(request, pk):
    user_id = request.session.get('user_id')
    
    if not user_id:
        return Response({'error': 'Authentication required'}, status=401)
    
    try:
        user = Credential.objects.get(id=user_id)
        executive_roles = [
            'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
            'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
        ]
        if user.role in executive_roles:
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
                
                print(f"[DEBUG] Login successful - User: {user.username}, Role: {user.role}")
                print(f"[DEBUG] Session ID: {request.session.session_key}")
                print(f"[DEBUG] Session data: {dict(request.session)}")
                
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
            
            print(f"[DEBUG] Meeting login successful - Username: {username}")
            print(f"[DEBUG] Session ID: {request.session.session_key}")
            print(f"[DEBUG] Session data: {dict(request.session)}")
            
            return Response({'message': 'Login successful', 'role': 'meeting_user'})

        return Response({'error': 'Invalid credentials'}, status=400)
    
    except Exception as e:
        print("Login error:", e)
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
@permission_classes([IsAuthenticated])
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
@permission_classes([IsAuthenticated])
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
    logs = AuditLog.objects.all().order_by('-timestamp')
    paginator = StandardResultsSetPagination()
    page = paginator.paginate_queryset(logs, request)
    serializer = AuditLogSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)