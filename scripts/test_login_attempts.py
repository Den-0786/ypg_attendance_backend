#!/usr/bin/env python
"""
Test script for login attempt limiting functionality
"""
import requests
import json
import time

# Configuration
API_BASE_URL = "http://localhost:8000/api"
TEST_USERNAME = "testuser"
TEST_PASSWORD = "wrongpassword"
TEST_PIN = "1234"

def test_login_attempts():
    """Test username/password login attempt limiting"""
    print("Testing username/password login attempt limiting...")
    
    for attempt in range(1, 5):
        print(f"\nAttempt {attempt}:")
        
        try:
            response = requests.post(f"{API_BASE_URL}/login", json={
                "username": TEST_USERNAME,
                "password": TEST_PASSWORD
            })
            
            data = response.json()
            print(f"Status: {response.status_code}")
            print(f"Response: {data.get('error', 'Success')}")
            
            if response.status_code == 429:
                print("✅ Login attempt limiting is working!")
                break
                
        except Exception as e:
            print(f"Error: {e}")
    
    print("\n" + "="*50)

def test_pin_attempts():
    """Test PIN verification attempt limiting"""
    print("Testing PIN verification attempt limiting...")
    
    for attempt in range(1, 5):
        print(f"\nAttempt {attempt}:")
        
        try:
            response = requests.post(f"{API_BASE_URL}/pin/verify/", json={
                "pin": TEST_PIN
            })
            
            data = response.json()
            print(f"Status: {response.status_code}")
            print(f"Response: {data.get('error', 'Success')}")
            
            if response.status_code == 429:
                print("✅ PIN attempt limiting is working!")
                break
                
        except Exception as e:
            print(f"Error: {e}")
    
    print("\n" + "="*50)

def clear_attempts():
    """Clear login attempts for testing"""
    print("Clearing login attempts...")
    try:
        # This would require the management command to be run
        # For now, just print instructions
        print("To clear attempts, run: python manage.py clear_login_attempts")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("Login Attempt Limiting Test")
    print("="*50)
    
    # Test login attempts
    test_login_attempts()
    
    # Test PIN attempts
    test_pin_attempts()
    
    # Instructions for clearing
    clear_attempts()
    
    print("\nTest completed!") 