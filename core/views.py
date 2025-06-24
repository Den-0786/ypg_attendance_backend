from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Count
from django.core.mail import send_mail
from django.conf import settings
from django.utils.crypto import get_random_string
from django.contrib.auth import logout
from .models import (
    AttendanceEntry,
    ApologyEntry,
    Credential,
    PasswordResetToken,
    Meeting
)
from .serializers import AttendanceEntrySerializer, ApologyEntrySerializer, MeetingSerializer
import re

# ------------------ Attendance Views ------------------
from django.utils.deprecation import MiddlewareMixin

class DebugPrintMiddleware(MiddlewareMixin):
    def process_request(self, request):
        print(f"[DEBUG] {request.method} {request.path}")

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_attendance(request):
    user_id = request.session.get('user_id')
    user = Credential.objects.get(id=user_id)
    serializer = AttendanceEntrySerializer(data=request.data, many=True)

    if serializer.is_valid():
        names_seen = set()

        for item in serializer.validated_data:
            name_key = item['name'].strip().lower()

            # 🔒 Check for duplicates within the submission
            if name_key in names_seen:
                return Response({'error': f"Duplicate name in submission: {item['name']}"}, status=400)
            names_seen.add(name_key)

            # 🔒 Check for existing record in the DB
            existing = AttendanceEntry.objects.filter(
                name=item['name'],
                meeting_date=item['meeting_date'],
                type=item['type'],
                submitted_by_id=user_id
            ).exists()

            if existing:
                return Response({'error': f"{item['name']} already submitted for this meeting."}, status=400)

            # Optional: Remove timestamp from item if you're auto-generating it
            item.pop('timestamp', None)

            # 🛠 Create entry
            AttendanceEntry.objects.create(**item, submitted_by_id=user_id)

        return Response({'message': 'Attendance submitted successfully!'}, status=201)

    return Response(serializer.errors, status=400)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_apologies(request):
    user_id = request.session.get('user_id')
    user = Credential.objects.get(id=user_id)
    serializer = ApologyEntrySerializer(data=request.data, many=True)

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
                submitted_by_id=user_id
            ).exists()

            if existing:
                return Response({'error': f"{item['name']} has already submitted an apology for this meeting."}, status=400)

            item.pop('timestamp', None)  # Optional cleanup
            ApologyEntry.objects.create(**item, submitted_by_id=user_id)

        return Response({'message': 'Apologies submitted successfully!'}, status=201)

    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_summary(request):
    year = request.GET.get('year')
    congregation = request.GET.get('congregation')
    user_id = request.session.get('user_id')

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
    user_id = request.session.get('user_id')

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
    entries = AttendanceEntry.objects.filter(type='local')
    data = [
        {"id": entry.id, "congregation": entry.congregation, "timestamp": entry.timestamp}
        for entry in entries
    ]
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def district_attendance(request):
    entries = AttendanceEntry.objects.filter(type='district')
    data = [
        {"id": entry.id, "congregation": entry.congregation, "timestamp": entry.timestamp}
        for entry in entries
    ]
    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_attendance(request, pk):
    user_id = request.session.get('user_id')
    try:
        entry = AttendanceEntry.objects.get(pk=pk, submitted_by_id=user_id)
        entry.delete()
        return Response({'message': 'Record deleted successfully.'})
    except AttendanceEntry.DoesNotExist:
        return Response({'error': 'Record not found or not authorized'}, status=404)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_attendance(request, pk):
    user_id = request.session.get('user_id')
    new_name = request.data.get('new_congregation')

    if not new_name:
        return Response({'error': 'New congregation name is required.'}, status=400)

    try:
        entry = AttendanceEntry.objects.get(pk=pk, submitted_by_id=user_id)
        entry.congregation = new_name
        entry.save()
        return Response({'message': 'Updated successfully'})
    except AttendanceEntry.DoesNotExist:
        return Response({'error': 'Record not found or not authorized'}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def attendance_by_meeting_title(request):
    year = request.GET.get('year')
    congregation = request.GET.get('congregation')

    queryset = AttendanceEntry.objects.all()
    if year:
        queryset = queryset.filter(meeting_date__year=year)
    if congregation:
        queryset = queryset.filter(congregation__icontains=congregation)

    results = queryset.values('meeting_title').annotate(count=Count('id')).order_by('-count')
    return Response(results)

# ------------------ Auth & Password Views ------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user_id = request.session.get('user_id')
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not all([old_password, new_password]):
        return Response({'error': 'All fields are required'}, status=400)

    try:
        user = Credential.objects.get(id=user_id)

        if not user.check_password(old_password):
            return Response({'error': 'Old password is incorrect'}, status=400)

        if user.check_password(new_password):
            return Response({'error': 'You cannot reuse your old password'}, status=400)

        if len(new_password) < 8 \
            or not re.search(r'[A-Z]', new_password) \
            or not re.search(r'[a-z]', new_password) \
            or not re.search(r'\d', new_password) \
            or not re.search(r'[@$!%*?&#^+=]', new_password):
            return Response({
                'error': 'Password must include uppercase, lowercase, number, symbol, and be at least 8 characters.'
            }, status=400)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})

    except Credential.DoesNotExist:
        return Response({'error': 'User not found'}, status=404)

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
        print('Raw body:', request.body)  # ⬅️ NEW
        print('Parsed data:', request.data)  # ⬅️ NEW

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
        return Response({
            'loggedIn': True,
            'role': request.session.get('role', 'user')
        })
    return Response({'loggedIn': False})

# --- Meeting Endpoints ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_meeting(request):
    user_id = request.session.get('user_id')
    user = Credential.objects.get(id=user_id)
    # Only allow executive roles
    executive_roles = [
        'admin', 'President', "President's Rep", 'Secretary', 'Assistant Secretary',
        'Financial Secretary', 'Treasurer', 'Bible Studies Coordinator', 'Organizer'
    ]
    if user.role not in executive_roles:
        return Response({'error': 'Not authorized'}, status=403)

    title = request.data.get('title')
    date = request.data.get('date')
    login_username = request.data.get('login_username')
    login_password = request.data.get('login_password')
    if not title or not date or not login_username or not login_password:
        return Response({'error': 'Title, date, username, and password are required.'}, status=400)

    # Deactivate previous meetings
    Meeting.objects.filter(is_active=True).update(is_active=False)
    meeting = Meeting(
        title=title,
        date=date,
        is_active=True,
        login_username=login_username
    )
    meeting.set_password(login_password)  # Hash and set the password
    meeting.save()
    serializer = MeetingSerializer(meeting)
    return Response(serializer.data, status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def current_meeting(request):
    meeting = Meeting.objects.filter(is_active=True).order_by('-date').first()
    if not meeting:
        return Response({'error': 'No active meeting set.'}, status=404)
    serializer = MeetingSerializer(meeting)
    return Response(serializer.data)
