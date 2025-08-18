#!/usr/bin/env python
"""
Script to check PIN status in production environment
"""
import requests
import json

def check_pin_status():
    """Check PIN status endpoint"""
    try:
        url = "https://ypg-attendance-backend-1.onrender.com/api/pin/status/"
        response = requests.get(url)
        print(f"PIN Status Response: {response.status_code}")
        print(f"PIN Status Data: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error checking PIN status: {e}")
        return False

def test_pin_verification():
    """Test PIN verification endpoint"""
    try:
        url = "https://ypg-attendance-backend-1.onrender.com/api/pin/verify/"
        data = {"pin": "2025"}
        headers = {"Content-Type": "application/json"}
        
        response = requests.post(url, json=data, headers=headers)
        print(f"PIN Verification Response: {response.status_code}")
        print(f"PIN Verification Data: {response.text}")
        
        if response.status_code == 500:
            print("500 Internal Server Error - this indicates a server-side issue")
            return False
        elif response.status_code == 200:
            print("PIN verification successful!")
            return True
        else:
            print(f"Unexpected response: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error testing PIN verification: {e}")
        return False

if __name__ == "__main__":
    print("Checking production PIN status...")
    status_ok = check_pin_status()
    
    print("\nTesting PIN verification...")
    verification_ok = test_pin_verification()
    
    if status_ok and verification_ok:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
