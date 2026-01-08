#!/usr/bin/env python3
"""
NutriKids AI Backend API Testing - Focused Test for Review Request
Tests all endpoints mentioned in the Italian review request
"""

import requests
import json
import base64
import time
from datetime import datetime

# Configuration from frontend .env
BASE_URL = "https://foodcoach-android.preview.emergentagent.com/api"

# Test credentials as specified in review request
TEST_EMAIL = "orso1898@gmail.com"
ADMIN_EMAIL = "admin@nutrikids.com"
ADMIN_PASSWORD = "Rossonero1898!"

def log_result(endpoint, method, status_code, success, details="", error=""):
    """Log test results"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {method} {endpoint} - Status: {status_code}")
    if details:
        print(f"    Details: {details}")
    if error:
        print(f"    Error: {error}")
    print()

def create_test_image_base64():
    """Create a simple test image in base64 format for food scanner"""
    # Simple 1x1 pixel PNG in base64 (blue pixel)
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

def test_authentication_endpoints():
    """Test all authentication endpoints"""
    print("🔐 TESTING AUTHENTICATION ENDPOINTS")
    print("=" * 50)
    
    # 1. POST /api/register - New user registration
    unique_email = f"test_{int(time.time())}@nutrikids.com"
    register_data = {
        "email": unique_email,
        "password": "TestPassword123!",
        "name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=register_data, timeout=30)
        if response.status_code == 201:
            data = response.json()
            log_result("/register", "POST", response.status_code, True, 
                      f"User registered: {data.get('email')}")
        else:
            log_result("/register", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/register", "POST", "N/A", False, error=str(e))
    
    # 2. POST /api/login - User login
    login_data = {
        "email": TEST_EMAIL,
        "password": "TestPassword123!"  # Assuming this is the password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            log_result("/login", "POST", response.status_code, True, 
                      f"Login successful, token: {token[:20] if token else 'None'}...")
        else:
            log_result("/login", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/login", "POST", "N/A", False, error=str(e))
    
    # 3. POST /api/forgot-password - Password reset request
    forgot_data = {"email": TEST_EMAIL}
    
    try:
        response = requests.post(f"{BASE_URL}/forgot-password", json=forgot_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result("/forgot-password", "POST", response.status_code, True, 
                      f"Reset request sent: {data.get('message', 'Success')}")
        else:
            log_result("/forgot-password", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/forgot-password", "POST", "N/A", False, error=str(e))
    
    # 4. POST /api/reset-password - Password reset with code (mock test)
    reset_data = {
        "email": TEST_EMAIL,
        "reset_code": "123456",  # Mock code
        "new_password": "NewPassword123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/reset-password", json=reset_data, timeout=30)
        # Expected to fail with invalid code
        if response.status_code == 400 and "Invalid reset code" in response.text:
            log_result("/reset-password", "POST", response.status_code, True, 
                      "Endpoint working (invalid code expected)")
        elif response.status_code == 200:
            log_result("/reset-password", "POST", response.status_code, True, 
                      "Password reset successful")
        else:
            log_result("/reset-password", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/reset-password", "POST", "N/A", False, error=str(e))
    
    # 5. GET /api/user/{email} - User info
    try:
        response = requests.get(f"{BASE_URL}/user/{TEST_EMAIL}", timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result(f"/user/{TEST_EMAIL}", "GET", response.status_code, True, 
                      f"Premium: {data.get('is_premium', False)}, Admin: {data.get('is_admin', False)}")
        else:
            log_result(f"/user/{TEST_EMAIL}", "GET", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result(f"/user/{TEST_EMAIL}", "GET", "N/A", False, error=str(e))

def test_children_management():
    """Test children management endpoints"""
    print("👶 TESTING CHILDREN MANAGEMENT")
    print("=" * 50)
    
    child_id = None
    
    # 1. GET /api/children/{email} - Get children list
    try:
        response = requests.get(f"{BASE_URL}/children/{TEST_EMAIL}", timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result(f"/children/{TEST_EMAIL}", "GET", response.status_code, True, 
                      f"Found {len(data)} children")
        else:
            log_result(f"/children/{TEST_EMAIL}", "GET", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result(f"/children/{TEST_EMAIL}", "GET", "N/A", False, error=str(e))
    
    # 2. POST /api/children - Create child
    child_data = {
        "parent_email": TEST_EMAIL,
        "name": "Sofia Test",
        "age": 7,
        "allergies": ["lattosio", "glutine"]
    }
    
    try:
        response = requests.post(f"{BASE_URL}/children", json=child_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            child_id = data.get('id')
            log_result("/children", "POST", response.status_code, True, 
                      f"Child created: {data.get('name')}, ID: {child_id}")
        else:
            log_result("/children", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/children", "POST", "N/A", False, error=str(e))
    
    # 3. DELETE /api/children/{id} - Delete child (if created)
    if child_id:
        try:
            response = requests.delete(f"{BASE_URL}/children/{child_id}", timeout=30)
            if response.status_code == 200:
                log_result(f"/children/{child_id}", "DELETE", response.status_code, True, 
                          "Child deleted successfully")
            else:
                log_result(f"/children/{child_id}", "DELETE", response.status_code, False, 
                          error=response.text[:200])
        except Exception as e:
            log_result(f"/children/{child_id}", "DELETE", "N/A", False, error=str(e))

def test_ai_endpoints():
    """Test AI endpoints (Scanner and Coach Maya)"""
    print("🤖 TESTING AI ENDPOINTS")
    print("=" * 50)
    
    # 1. POST /api/analyze-food - Food scanner (using analyze-photo endpoint)
    photo_data = {
        "image_base64": create_test_image_base64(),
        "user_email": TEST_EMAIL
    }
    
    try:
        response = requests.post(f"{BASE_URL}/analyze-photo", json=photo_data, timeout=60)
        if response.status_code == 200:
            data = response.json()
            log_result("/analyze-photo", "POST", response.status_code, True, 
                      f"Analysis completed - Health Score: {data.get('health_score', 'N/A')}")
        elif response.status_code == 403:
            log_result("/analyze-photo", "POST", response.status_code, True, 
                      "Daily limit reached (expected for free users)")
        else:
            log_result("/analyze-photo", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/analyze-photo", "POST", "N/A", False, error=str(e))
    
    # 2. POST /api/coach-maya - AI Chat
    chat_data = {
        "message": "Ciao Maya! Mia figlia non vuole mangiare le verdure. Consigli?",
        "session_id": f"test_{int(time.time())}",
        "language": "it",
        "user_email": TEST_EMAIL
    }
    
    try:
        response = requests.post(f"{BASE_URL}/coach-maya", json=chat_data, timeout=60)
        if response.status_code == 200:
            data = response.json()
            response_text = data.get('response', '')
            log_result("/coach-maya", "POST", response.status_code, True, 
                      f"AI response received ({len(response_text)} chars)")
        elif response.status_code == 403:
            log_result("/coach-maya", "POST", response.status_code, True, 
                      "Daily limit reached (expected for free users)")
        else:
            log_result("/coach-maya", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/coach-maya", "POST", "N/A", False, error=str(e))

def test_meal_plans():
    """Test meal plan endpoints"""
    print("🍽️ TESTING MEAL PLANS")
    print("=" * 50)
    
    week_start = datetime.now().strftime("%Y-%m-%d")
    
    # 1. POST /api/meal-plans/generate - Generate meal plan (using meal-plan endpoint)
    meal_plan_data = {
        "user_email": TEST_EMAIL,
        "week_start_date": week_start,
        "num_people": 2,
        "monday": {
            "breakfast": "Yogurt con cereali",
            "lunch": "Pasta al pomodoro",
            "dinner": "Pollo con verdure",
            "snack": "Frutta"
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/meal-plan", json=meal_plan_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result("/meal-plan", "POST", response.status_code, True, 
                      f"Meal plan created for week {data.get('week_start_date')}")
        else:
            log_result("/meal-plan", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/meal-plan", "POST", "N/A", False, error=str(e))
    
    # 2. GET /api/meal-plans/{email} - Get meal plans (using specific week endpoint)
    try:
        response = requests.get(f"{BASE_URL}/meal-plan/{TEST_EMAIL}/{week_start}", timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result(f"/meal-plan/{TEST_EMAIL}/{week_start}", "GET", response.status_code, True, 
                      f"Retrieved plan for {data.get('week_start_date')}")
        else:
            log_result(f"/meal-plan/{TEST_EMAIL}/{week_start}", "GET", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result(f"/meal-plan/{TEST_EMAIL}/{week_start}", "GET", "N/A", False, error=str(e))

def test_food_diary():
    """Test food diary endpoints"""
    print("📔 TESTING FOOD DIARY")
    print("=" * 50)
    
    # 1. POST /api/diary - Add diary entry
    diary_data = {
        "user_email": TEST_EMAIL,
        "meal_type": "pranzo",
        "description": "Pasta al pomodoro con basilico",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "nutritional_info": {
            "calories": 350,
            "proteins": 12,
            "carbs": 65,
            "fats": 8
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/diary", json=diary_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result("/diary", "POST", response.status_code, True, 
                      f"Diary entry created: {data.get('description')}")
        else:
            log_result("/diary", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/diary", "POST", "N/A", False, error=str(e))
    
    # 2. GET /api/diary/{email} - Get diary entries
    try:
        response = requests.get(f"{BASE_URL}/diary/{TEST_EMAIL}", timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result(f"/diary/{TEST_EMAIL}", "GET", response.status_code, True, 
                      f"Retrieved {len(data)} diary entries")
        else:
            log_result(f"/diary/{TEST_EMAIL}", "GET", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result(f"/diary/{TEST_EMAIL}", "GET", "N/A", False, error=str(e))

def test_stripe_payments():
    """Test Stripe payment endpoints"""
    print("💳 TESTING STRIPE PAYMENTS")
    print("=" * 50)
    
    # 1. GET /api/pricing - Get pricing
    try:
        response = requests.get(f"{BASE_URL}/pricing", timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result("/pricing", "GET", response.status_code, True, 
                      f"Monthly: €{data.get('monthly_price')}, Yearly: €{data.get('yearly_price')}")
        else:
            log_result("/pricing", "GET", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/pricing", "GET", "N/A", False, error=str(e))
    
    # 2. POST /api/checkout/create-session - Create checkout session
    checkout_data = {
        "plan_type": "monthly",
        "origin_url": "https://foodcoach-android.preview.emergentagent.com"
    }
    headers = {"X-User-Email": TEST_EMAIL}
    
    try:
        response = requests.post(f"{BASE_URL}/checkout/create-session", 
                               json=checkout_data, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            session_id = data.get('session_id')
            log_result("/checkout/create-session", "POST", response.status_code, True, 
                      f"Checkout session created: {session_id[:20] if session_id else 'None'}...")
        else:
            log_result("/checkout/create-session", "POST", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/checkout/create-session", "POST", "N/A", False, error=str(e))

def test_admin_endpoints():
    """Test admin endpoints"""
    print("👑 TESTING ADMIN ENDPOINTS")
    print("=" * 50)
    
    # First login as admin to get token
    admin_token = None
    login_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=login_data, timeout=30)
        if response.status_code == 200:
            data = response.json()
            admin_token = data.get('token')
            print(f"✅ Admin login successful, token obtained")
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Admin login error: {str(e)}")
        return
    
    if not admin_token:
        print("❌ No admin token available")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. GET /api/admin/config - Get configuration
    try:
        response = requests.get(f"{BASE_URL}/admin/config", headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            llm_key = data.get('emergent_llm_key', '')
            log_result("/admin/config", "GET", response.status_code, True, 
                      f"Config retrieved, LLM Key: {llm_key[:20] if llm_key else 'None'}...")
        else:
            log_result("/admin/config", "GET", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/admin/config", "GET", "N/A", False, error=str(e))
    
    # 2. PUT /api/admin/config - Update configuration
    config_update = {
        "premium_monthly_price": 6.99
    }
    
    try:
        response = requests.put(f"{BASE_URL}/admin/config", 
                              json=config_update, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            log_result("/admin/config", "PUT", response.status_code, True, 
                      f"Config updated, Monthly price: €{data.get('premium_monthly_price')}")
        else:
            log_result("/admin/config", "PUT", response.status_code, False, 
                      error=response.text[:200])
    except Exception as e:
        log_result("/admin/config", "PUT", "N/A", False, error=str(e))

def main():
    """Run all focused tests"""
    print("🧪 NUTRIKIDS AI - FOCUSED BACKEND API TESTING")
    print("Testing all endpoints mentioned in the review request")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Email: {TEST_EMAIL}")
    print("=" * 60)
    
    test_authentication_endpoints()
    test_children_management()
    test_ai_endpoints()
    test_meal_plans()
    test_food_diary()
    test_stripe_payments()
    test_admin_endpoints()
    
    print("🏁 FOCUSED TESTING COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()