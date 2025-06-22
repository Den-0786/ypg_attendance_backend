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
    AttendanceEntry, ApologyEntry, Credential, PasswordResetToken
)
from .serializers import AttendanceEntrySerializer, ApologyEntrySerializer
import re

# ------------------ Attendance Views ------------------

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

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    try:
        user = Credential.objects.get(username=username)
        if not user.check_password(password):
            return Response({'error': 'Invalid credentials'}, status=400)
        
        request.session.flush()
        request.session['user_id'] = user.id
        request.session['username'] = user.username
        request.session['role'] = user.role
        request.session.set_expiry(86400)

        return Response({'message': 'Login successful', 'role': user.role})
    except Credential.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, status=400)

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
