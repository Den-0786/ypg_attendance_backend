#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ypg_backend.settings')
django.setup()

from core.models import SecurityPIN, LoginAttempt
from core.serializers import PINVerificationSerializer

def test_pin_verification():
    print("Testing PIN verification...")
    
    # Check if there's an active PIN
    active_pin = SecurityPIN.objects.filter(is_active=True).first()
    if not active_pin:
        print("ERROR: No active PIN found in database")
        return False
    
    print(f"Active PIN found: {active_pin.pin}")
    
    # Test PIN verification
    test_pin = "1234"
    is_valid = SecurityPIN.verify_pin(test_pin)
    print(f"PIN verification test with '1234': {is_valid}")
    
    # Test with actual PIN
    actual_is_valid = SecurityPIN.verify_pin(active_pin.pin)
    print(f"PIN verification test with actual PIN: {actual_is_valid}")
    
    # Test LoginAttempt model
    try:
        attempt = LoginAttempt.get_or_create_attempt("test_ip", "pin")
        print(f"LoginAttempt created successfully: {attempt}")
    except Exception as e:
        print(f"ERROR creating LoginAttempt: {e}")
        return False
    
    # Test serializer
    try:
        serializer = PINVerificationSerializer(data={'pin': '1234', 'is_valid': True})
        is_valid_serializer = serializer.is_valid()
        print(f"Serializer validation: {is_valid_serializer}")
        if not is_valid_serializer:
            print(f"Serializer errors: {serializer.errors}")
    except Exception as e:
        print(f"ERROR with serializer: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = test_pin_verification()
    if success:
        print("All tests passed!")
    else:
        print("Some tests failed!")
        sys.exit(1)
