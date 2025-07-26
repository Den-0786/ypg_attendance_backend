# Login Attempt Limiting Feature

## Overview

The YPG Attendance App now includes a comprehensive login attempt limiting system that protects against brute force attacks on both username/password combinations and PIN verification.

## Features

### 1. Username/Password Attempt Limiting
- **Limit**: 3 failed attempts per username
- **Lockout Duration**: 10 minutes
- **Tracking**: Per username basis
- **Reset**: Automatically resets on successful login

### 2. PIN Verification Attempt Limiting
- **Limit**: 3 failed attempts per IP address
- **Lockout Duration**: 10 minutes
- **Tracking**: Per IP address basis
- **Reset**: Automatically resets on successful PIN verification

## How It Works

### Database Model
The system uses a `LoginAttempt` model to track failed attempts:

```python
class LoginAttempt(models.Model):
    identifier = models.CharField(max_length=150)  # Username or IP
    attempt_type = models.CharField(max_length=20)  # 'username_password' or 'pin'
    failed_attempts = models.IntegerField(default=0)
    first_failed_attempt = models.DateTimeField(auto_now_add=True)
    last_failed_attempt = models.DateTimeField(auto_now=True)
    is_locked = models.BooleanField(default=False)
    lock_expires_at = models.DateTimeField(null=True, blank=True)
```

### API Endpoints Affected

1. **Login Endpoint** (`/api/login`)
   - Tracks failed username/password attempts
   - Returns 429 status code when locked out

2. **PIN Verification** (`/api/pin/verify/`)
   - Tracks failed PIN attempts by IP address
   - Returns 429 status code when locked out

3. **Change Credentials** (`/api/change-credentials`)
   - Requires PIN verification with attempt limiting

4. **Change PIN** (`/api/pin/change/`)
   - Requires current PIN verification with attempt limiting

## Error Messages

### Username/Password Lockout
```
"Access denied. You have tried 3 times. The maximum number of attempts has been reached. Please wait for X minutes before trying again."
```

### PIN Lockout
```
"Access denied. You have tried 3 times. The maximum number of attempts has been reached. Please wait for X minutes before trying again."
```

### Attempt Remaining Messages
- Username/Password: `"Invalid credentials. X attempts remaining."`
- PIN: `"Invalid PIN. X attempts remaining."`

## Frontend Integration

The frontend components have been updated to handle the new error responses:

1. **LoginForm.js** - Handles login attempt limiting errors
2. **useAuth.js** - Processes 429 status codes for rate limiting
3. **PINModal.js** - Handles PIN attempt limiting errors
4. **ChangePasswordForm.js** - Handles PIN verification errors
5. **PINChangeModal.js** - Handles PIN change errors

## Management Commands

### Clear Login Attempts
```bash
# Clear all login attempts
python manage.py clear_login_attempts

# Clear attempts for specific identifier
python manage.py clear_login_attempts --identifier "username123"

# Clear attempts for specific type
python manage.py clear_login_attempts --type "username_password"

# Clear PIN attempts for specific IP
python manage.py clear_login_attempts --identifier "192.168.1.1" --type "pin"
```

## Testing

Use the provided test script to verify the functionality:

```bash
python test_login_attempts.py
```

## Security Considerations

1. **IP-based tracking for PINs**: PIN attempts are tracked by IP address to prevent PIN brute force attacks
2. **Username-based tracking for login**: Login attempts are tracked per username to prevent targeted attacks
3. **Automatic reset**: Attempts are automatically reset on successful authentication
4. **Time-based lockout**: 10-minute lockout period provides security while maintaining usability
5. **Generic error messages**: Prevents information leakage about valid usernames

## Configuration

The system is configured with the following defaults:
- **Max attempts**: 3
- **Lockout duration**: 10 minutes
- **Tracking granularity**: Username for login, IP for PIN

These values can be modified in the `LoginAttempt` model's `record_failed_attempt()` method.

## Monitoring

To monitor login attempts, you can query the database:

```python
from core.models import LoginAttempt

# Get all locked accounts
locked_accounts = LoginAttempt.objects.filter(is_locked=True)

# Get recent failed attempts
recent_attempts = LoginAttempt.objects.filter(
    last_failed_attempt__gte=timezone.now() - timedelta(hours=1)
)
```

## Troubleshooting

### Common Issues

1. **Users getting locked out immediately**
   - Check if there are existing failed attempts in the database
   - Use the clear command to reset attempts

2. **PIN not working after lockout**
   - Verify the lockout has expired (10 minutes)
   - Check if the correct PIN is being used

3. **IP tracking issues**
   - Ensure the application is behind a proper proxy setup
   - Check `request.META.get('REMOTE_ADDR')` returns the correct IP

### Debug Commands

```bash
# Check current login attempts
python manage.py shell -c "from core.models import LoginAttempt; print(LoginAttempt.objects.all())"

# Check specific user attempts
python manage.py shell -c "from core.models import LoginAttempt; print(LoginAttempt.objects.filter(identifier='username'))"
``` 