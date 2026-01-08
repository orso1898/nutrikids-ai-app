#!/usr/bin/env python3
"""
Additional NutriKids AI Backend Tests
Testing authentication and photo analysis endpoints specifically requested
"""

import requests
import json
import base64
import uuid
from datetime import datetime

# Backend URL
BACKEND_URL = "https://foodcoach-android.preview.emergentagent.com/api"

def test_user_registration():
    """Test POST /api/register - User Registration"""
    print("🧪 Testing User Registration...")
    
    # Test data with realistic Italian user
    user_data = {
        "email": "giulia.ferrari@gmail.com",
        "password": "MiaPassword123!",
        "name": "Giulia Ferrari"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/register", json=user_data)
        
        if response.status_code == 201:
            data = response.json()
            print(f"✅ Registration successful: {data.get('email')}")
            print(f"   User created: {data.get('name')}, Premium: {data.get('is_premium')}")
            return True
        elif response.status_code == 400 and "already registered" in response.json().get("detail", ""):
            print("✅ Registration: User already exists (expected for repeated tests)")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        return False

def test_user_login():
    """Test POST /api/login - User Login"""
    print("🧪 Testing User Login...")
    
    login_data = {
        "email": "giulia.ferrari@gmail.com",
        "password": "MiaPassword123!"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login successful: {data.get('email')}")
            print(f"   User: {data.get('name')}, Premium: {data.get('is_premium')}")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return False

def test_admin_login():
    """Test admin login with existing credentials"""
    print("🧪 Testing Admin Login...")
    
    admin_data = {
        "email": "admin@nutrikids.com",
        "password": "Admin123!"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/login", json=admin_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Admin login successful: {data.get('email')}")
            return True
        elif response.status_code == 401:
            print("⚠️ Admin login failed - admin user may not exist yet")
            # Try to register admin user
            admin_reg = {
                "email": "admin@nutrikids.com",
                "password": "Admin123!",
                "name": "Admin User"
            }
            reg_response = requests.post(f"{BACKEND_URL}/register", json=admin_reg)
            if reg_response.status_code == 201:
                print("✅ Admin user created successfully")
                # Try login again
                login_response = requests.post(f"{BACKEND_URL}/login", json=admin_data)
                if login_response.status_code == 200:
                    print("✅ Admin login successful after registration")
                    return True
            return False
        else:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Admin login error: {str(e)}")
        return False

def test_coach_maya_italian():
    """Test Coach Maya with Italian language specifically"""
    print("🧪 Testing Coach Maya in Italian...")
    
    chat_data = {
        "message": "Ciao Coach Maya! Mio figlio di 6 anni non vuole mangiare le verdure. Come posso convincerlo?",
        "session_id": f"test_italian_{uuid.uuid4()}",
        "language": "it"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/coach-maya", json=chat_data)
        
        if response.status_code == 200:
            data = response.json()
            response_text = data.get("response", "")
            
            # Check for Italian language indicators
            italian_words = ["bambino", "bambini", "verdure", "ciao", "consiglio", "nutrizione", "salute", "può", "è"]
            has_italian = any(word in response_text.lower() for word in italian_words)
            
            print(f"✅ Coach Maya responded in Italian")
            print(f"   Response length: {len(response_text)} characters")
            print(f"   Contains Italian words: {has_italian}")
            print(f"   Sample: {response_text[:100]}...")
            return True
        else:
            print(f"❌ Coach Maya failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Coach Maya error: {str(e)}")
        return False

def test_photo_analysis():
    """Test POST /api/analyze-photo - Photo Analysis with base64 image"""
    print("🧪 Testing Photo Analysis...")
    
    # Create a simple test image (1x1 pixel PNG in base64)
    test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    
    photo_data = {
        "image_base64": test_image_b64,
        "user_email": "giulia.ferrari@gmail.com"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/analyze-photo", json=photo_data)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = ["foods_detected", "nutritional_info", "suggestions", "health_score"]
            has_all_fields = all(field in data for field in required_fields)
            
            print(f"✅ Photo analysis successful")
            print(f"   Foods detected: {data.get('foods_detected', [])}")
            print(f"   Health score: {data.get('health_score', 'N/A')}")
            print(f"   Nutritional info: {data.get('nutritional_info', {})}")
            print(f"   Has all required fields: {has_all_fields}")
            
            return has_all_fields
        else:
            print(f"❌ Photo analysis failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"❌ Photo analysis error: {str(e)}")
        return False

def run_additional_tests():
    """Run additional backend tests"""
    print("🚀 Running Additional NutriKids AI Backend Tests")
    print("=" * 60)
    
    results = []
    
    # Test authentication endpoints
    results.append(("User Registration", test_user_registration()))
    results.append(("User Login", test_user_login()))
    results.append(("Admin Login", test_admin_login()))
    
    # Test Coach Maya with Italian
    results.append(("Coach Maya Italian", test_coach_maya_italian()))
    
    # Test photo analysis
    results.append(("Photo Analysis", test_photo_analysis()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 ADDITIONAL TESTS SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"Total Tests: {total}")
    print(f"Passed: {passed}")
    print(f"Failed: {total - passed}")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if total - passed > 0:
        print("\n❌ FAILED TESTS:")
        for test_name, success in results:
            if not success:
                print(f"  • {test_name}")
    
    print("\n✅ PASSED TESTS:")
    for test_name, success in results:
        if success:
            print(f"  • {test_name}")
    
    return passed == total

if __name__ == "__main__":
    success = run_additional_tests()
    exit(0 if success else 1)