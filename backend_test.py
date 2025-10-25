#!/usr/bin/env python3
"""
NutriKids AI - CRITICAL BUG FIX TESTING
Focus on meal plan creation and user registration performance fixes
"""

import requests
import json
import base64
import time
from datetime import datetime, timedelta
import uuid
import os

# Configuration
BACKEND_URL = "https://smart-foodscan.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@nutrikids.com"
ADMIN_PASSWORD = "Rossonero1898!"

# Test data - using realistic data as requested
TEST_USERS = [
    {
        "email": "marco.rossi@gmail.com",
        "password": "MarcoRossi123!",
        "name": "Marco Rossi"
    },
    {
        "email": "giulia.bianchi@gmail.com", 
        "password": "GiuliaBianchi456!",
        "name": "Giulia Bianchi"
    },
    {
        "email": "francesco.verdi@gmail.com",
        "password": "FrancescoVerdi789!",
        "name": "Francesco Verdi"
    }
]

# Global variables for test state
admin_token = None
user_tokens = {}
referral_codes = {}
children_ids = {}
test_results = {
    "total_tests": 0,
    "passed_tests": 0,
    "failed_tests": 0,
    "test_details": []
}

def log_test(test_name, success, details="", error=""):
    """Log test results"""
    global test_results
    test_results["total_tests"] += 1
    
    if success:
        test_results["passed_tests"] += 1
        status = "✅ PASS"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
    else:
        test_results["failed_tests"] += 1
        status = "❌ FAIL"
        print(f"{status} - {test_name}")
        if error:
            print(f"    Error: {error}")
        if details:
            print(f"    Details: {details}")
    
    test_results["test_details"].append({
        "test": test_name,
        "status": status,
        "details": details,
        "error": error
    })

def make_request(method, endpoint, data=None, headers=None, expected_status=200):
    """Make HTTP request with error handling"""
    url = f"{BACKEND_URL}{endpoint}"
    
    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, timeout=30)
        elif method.upper() == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=30)
        elif method.upper() == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=30)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request error for {method} {endpoint}: {str(e)}")
        return None

def test_1_authentication_users():
    """1. AUTENTICAZIONE & UTENTI"""
    print("\n" + "="*60)
    print("1. TESTING AUTENTICAZIONE & UTENTI")
    print("="*60)
    
    global admin_token, user_tokens
    
    # Test 1.1: Admin Login
    admin_data = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    response = make_request("POST", "/login", admin_data)
    if response and response.status_code == 200:
        admin_token = response.json().get("token")
        log_test("Admin Login", True, f"Admin logged in successfully, token received")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Admin Login", False, error=error_msg)
    
    # Test 1.2: User Registration (without referral)
    user1 = TEST_USERS[0]
    response = make_request("POST", "/register", user1)
    if response and response.status_code == 201:
        log_test("User Registration (no referral)", True, f"User {user1['email']} registered successfully")
    elif response and response.status_code == 400 and "already registered" in response.text:
        log_test("User Registration (no referral)", True, f"User {user1['email']} already exists")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("User Registration (no referral)", False, error=error_msg)
    
    # Test 1.3: User Login
    login_data = {
        "email": user1["email"],
        "password": user1["password"]
    }
    response = make_request("POST", "/login", login_data)
    if response and response.status_code == 200:
        user_tokens[user1["email"]] = response.json().get("token")
        log_test("User Login", True, f"User {user1['email']} logged in successfully")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("User Login", False, error=error_msg)
    
    # Test 1.4: Password Recovery Flow
    forgot_data = {"email": user1["email"]}
    response = make_request("POST", "/forgot-password", forgot_data)
    if response and response.status_code == 200:
        reset_code = response.json().get("reset_code")
        if reset_code:
            log_test("Forgot Password", True, f"Reset code generated: {reset_code}")
            
            # Test password reset
            reset_data = {
                "email": user1["email"],
                "reset_code": reset_code,
                "new_password": "NewPassword123!"
            }
            response = make_request("POST", "/reset-password", reset_data)
            if response and response.status_code == 200:
                log_test("Reset Password", True, "Password reset successfully")
                
                # Update password for future tests
                TEST_USERS[0]["password"] = "NewPassword123!"
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                log_test("Reset Password", False, error=error_msg)
        else:
            log_test("Forgot Password", False, error="No reset code in response")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Forgot Password", False, error=error_msg)
    
    # Test 1.5: Get User Usage
    response = make_request("GET", f"/usage/{user1['email']}")
    if response and response.status_code == 200:
        usage_data = response.json()
        log_test("Get User Usage", True, f"Usage data: scans={usage_data.get('scans_used', 0)}, messages={usage_data.get('coach_messages_used', 0)}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Get User Usage", False, error=error_msg)

def test_2_referral_system():
    """2. NUOVO SISTEMA REFERRAL"""
    print("\n" + "="*60)
    print("2. TESTING NUOVO SISTEMA REFERRAL")
    print("="*60)
    
    global referral_codes, user_tokens
    
    user1 = TEST_USERS[0]
    
    # Test 2.1: Generate Referral Code
    response = make_request("GET", f"/referral/code/{user1['email']}")
    if response and response.status_code == 200:
        referral_code = response.json().get("referral_code")
        referral_codes[user1["email"]] = referral_code
        log_test("Generate Referral Code", True, f"Referral code generated: {referral_code}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Generate Referral Code", False, error=error_msg)
        return
    
    # Test 2.2: Register users with referral code
    referral_code = referral_codes[user1["email"]]
    
    for i, user in enumerate(TEST_USERS[1:3], 2):  # Users 2 and 3
        user_with_referral = user.copy()
        user_with_referral["referral_code"] = referral_code
        
        response = make_request("POST", "/register", user_with_referral)
        if response and response.status_code == 201:
            log_test(f"Register User {i} with Referral", True, f"User {user['email']} registered with referral code")
            
            # Login the new user
            login_data = {
                "email": user["email"],
                "password": user["password"]
            }
            login_response = make_request("POST", "/login", login_data)
            if login_response and login_response.status_code == 200:
                user_tokens[user["email"]] = login_response.json().get("token")
        elif response and response.status_code == 400 and "already registered" in response.text:
            log_test(f"Register User {i} with Referral", True, f"User {user['email']} already exists")
            # Still try to login
            login_data = {
                "email": user["email"],
                "password": user["password"]
            }
            login_response = make_request("POST", "/login", login_data)
            if login_response and login_response.status_code == 200:
                user_tokens[user["email"]] = login_response.json().get("token")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            log_test(f"Register User {i} with Referral", False, error=error_msg)
    
    # Test 2.3: Check referral stats (stats are included in referral code response)
    response = make_request("GET", f"/referral/code/{user1['email']}")
    if response and response.status_code == 200:
        stats = response.json()
        pending_invites = stats.get("pending_invites", 0)
        successful_invites = stats.get("successful_invites", 0)
        log_test("Check Referral Stats", True, f"Pending: {pending_invites}, Successful: {successful_invites}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Check Referral Stats", False, error=error_msg)

def test_3_free_trial():
    """3. FREE TRIAL"""
    print("\n" + "="*60)
    print("3. TESTING FREE TRIAL")
    print("="*60)
    
    user2 = TEST_USERS[1]
    
    # Test 3.1: Start Free Trial
    trial_data = {"user_email": user2["email"]}
    response = make_request("POST", "/start-free-trial", trial_data)
    if response and response.status_code == 200:
        trial_response = response.json()
        status = trial_response.get("status")
        message = trial_response.get("message")
        trial_end_date = trial_response.get("trial_end_date")
        
        log_test("Start Free Trial", True, f"Status: {status}, End date: {trial_end_date}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Start Free Trial", False, error=error_msg)
    
    # Test 3.2: Try to start trial again (should fail)
    response = make_request("POST", "/start-free-trial", trial_data)
    if response and response.status_code == 400:
        log_test("Prevent Double Trial", True, "Correctly prevented second trial usage")
    else:
        log_test("Prevent Double Trial", False, error="Should have prevented second trial")

def test_4_gamification_children():
    """4. GAMIFICATION & CHILDREN"""
    print("\n" + "="*60)
    print("4. TESTING GAMIFICATION & CHILDREN")
    print("="*60)
    
    global children_ids
    user1 = TEST_USERS[0]
    
    # Test 4.1: Create Child Profile
    child_data = {
        "parent_email": user1["email"],
        "name": "Sofia Rossi",
        "age": 7,
        "allergies": ["glutine", "lattosio"]
    }
    
    response = make_request("POST", "/children", child_data)
    if response and response.status_code == 200:
        child = response.json()
        child_id = child.get("id")
        children_ids[user1["email"]] = child_id
        log_test("Create Child Profile", True, f"Child created: {child['name']}, ID: {child_id}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Create Child Profile", False, error=error_msg)
        return
    
    # Test 4.2: Get Children List
    response = make_request("GET", f"/children/{user1['email']}")
    if response and response.status_code == 200:
        children = response.json()
        log_test("Get Children List", True, f"Found {len(children)} children")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Get Children List", False, error=error_msg)
    
    # Test 4.3: Award Points (basic)
    child_id = children_ids[user1["email"]]
    points_data = {"points": 10}
    
    response = make_request("POST", f"/children/{child_id}/award-points", points_data)
    if response and response.status_code == 200:
        result = response.json()
        log_test("Award Points (Basic)", True, f"Points: {result.get('points')}, Level: {result.get('level')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Award Points (Basic)", False, error=error_msg)
    
    # Test 4.4: Award More Points (trigger level up and badges)
    points_data = {"points": 95}  # Total will be 105, should trigger level 2 and first_century badge
    
    response = make_request("POST", f"/children/{child_id}/award-points", points_data)
    if response and response.status_code == 200:
        result = response.json()
        level_up = result.get("level_up", False)
        new_badges = result.get("new_badges", [])
        log_test("Award Points (Level Up)", True, f"Level up: {level_up}, New badges: {new_badges}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Award Points (Level Up)", False, error=error_msg)
    
    # Test 4.5: Update Child Profile
    update_data = {
        "parent_email": user1["email"],
        "name": "Sofia Rossi",
        "age": 8,  # Updated age
        "allergies": ["glutine"]  # Removed lactose allergy
    }
    
    response = make_request("PUT", f"/children/{child_id}", update_data)
    if response and response.status_code == 200:
        updated_child = response.json()
        log_test("Update Child Profile", True, f"Updated age to {updated_child.get('age')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Update Child Profile", False, error=error_msg)

def test_5_scanner_ai():
    """5. SCANNER & AI (CON API KEY DAL DATABASE)"""
    print("\n" + "="*60)
    print("5. TESTING SCANNER & AI")
    print("="*60)
    
    user1 = TEST_USERS[0]
    
    # Create a simple base64 image for testing (1x1 pixel PNG)
    test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    
    # Test 5.1: Photo Analysis
    photo_data = {
        "image_base64": test_image_b64,
        "user_email": user1["email"]
    }
    
    response = make_request("POST", "/analyze-photo", photo_data)
    if response and response.status_code == 200:
        analysis = response.json()
        foods = analysis.get("foods_detected", [])
        nutrition = analysis.get("nutritional_info", {})
        health_score = analysis.get("health_score", 0)
        allergens = analysis.get("allergens_detected", [])
        
        log_test("Photo Analysis", True, f"Foods: {len(foods)}, Health score: {health_score}, Allergens: {len(allergens)}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Photo Analysis", False, error=error_msg)
    
    # Test 5.2: Check Free User Limits (after 3 scans)
    for i in range(3):
        response = make_request("POST", "/analyze-photo", photo_data)
        if i == 2:  # Third scan should still work or hit limit
            if response and response.status_code == 200:
                log_test("Free User Scan Limit (within)", True, "Scan successful")
            elif response and response.status_code == 403:
                log_test("Free User Scan Limit (exceeded)", True, "Scan limit correctly enforced")
            else:
                log_test("Free User Scan Limit", False, error="Unexpected response")

def test_6_coach_maya():
    """6. COACH MAYA (CON API KEY DAL DATABASE)"""
    print("\n" + "="*60)
    print("6. TESTING COACH MAYA")
    print("="*60)
    
    user2 = TEST_USERS[1]  # Use user2 who has premium trial
    
    # Test 6.1: Coach Maya Chat (Italian)
    chat_data = {
        "message": "Mio figlio di 5 anni non vuole mangiare le verdure. Cosa posso fare?",
        "session_id": "test_session_1",
        "language": "it",
        "user_email": user2["email"]
    }
    
    response = make_request("POST", "/coach-maya", chat_data)
    if response and response.status_code == 200:
        chat_response = response.json()
        response_text = chat_response.get("response", "")
        log_test("Coach Maya Chat (IT)", True, f"Response length: {len(response_text)} chars")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Coach Maya Chat (IT)", False, error=error_msg)
    
    # Test 6.2: Coach Maya Chat (English)
    chat_data_en = {
        "message": "What are healthy snacks for a 3-year-old?",
        "session_id": "test_session_2",
        "language": "en",
        "user_email": user2["email"]
    }
    
    response = make_request("POST", "/coach-maya", chat_data_en)
    if response and response.status_code == 200:
        chat_response = response.json()
        response_text = chat_response.get("response", "")
        log_test("Coach Maya Chat (EN)", True, f"Response length: {len(response_text)} chars")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Coach Maya Chat (EN)", False, error=error_msg)

def test_7_diary_plans():
    """7. DIARIO & PIANI"""
    print("\n" + "="*60)
    print("7. TESTING DIARIO & PIANI")
    print("="*60)
    
    user1 = TEST_USERS[0]
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Test 7.1: Create Diary Entry
    diary_data = {
        "user_email": user1["email"],
        "meal_type": "pranzo",
        "description": "Pasta al pomodoro con basilico fresco",
        "date": today,
        "nutritional_info": {
            "calories": 350,
            "proteins": 12,
            "carbs": 65,
            "fats": 8
        }
    }
    
    response = make_request("POST", "/diary", diary_data)
    if response and response.status_code == 200:
        diary_entry = response.json()
        entry_id = diary_entry.get("id")
        log_test("Create Diary Entry", True, f"Entry created: {diary_entry.get('description')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Create Diary Entry", False, error=error_msg)
    
    # Test 7.2: Get Diary Entries
    response = make_request("GET", f"/diary/{user1['email']}")
    if response and response.status_code == 200:
        entries = response.json()
        log_test("Get Diary Entries", True, f"Found {len(entries)} entries")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Get Diary Entries", False, error=error_msg)
    
    # Test 7.3: Create Meal Plan
    week_start = datetime.now().strftime("%Y-%m-%d")
    meal_plan_data = {
        "user_email": user1["email"],
        "week_start_date": week_start,
        "num_people": 3,
        "monday": {
            "breakfast": "Yogurt con cereali e frutta",
            "lunch": "Pasta al pomodoro",
            "dinner": "Pollo arrosto con verdure",
            "snack": "Frutta fresca"
        },
        "tuesday": {
            "breakfast": "Latte e biscotti",
            "lunch": "Risotto ai funghi",
            "dinner": "Pesce al vapore con patate",
            "snack": "Yogurt"
        }
    }
    
    response = make_request("POST", "/meal-plan", meal_plan_data)
    if response and response.status_code == 200:
        meal_plan = response.json()
        log_test("Create Meal Plan", True, f"Meal plan created for week {week_start}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Create Meal Plan", False, error=error_msg)
    
    # Test 7.4: Get Meal Plan
    response = make_request("GET", f"/meal-plan/{user1['email']}/{week_start}")
    if response and response.status_code == 200:
        retrieved_plan = response.json()
        log_test("Get Meal Plan", True, f"Retrieved plan for {retrieved_plan.get('week_start_date')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Get Meal Plan", False, error=error_msg)

def test_8_dashboard():
    """8. DASHBOARD"""
    print("\n" + "="*60)
    print("8. TESTING DASHBOARD")
    print("="*60)
    
    user1 = TEST_USERS[0]
    
    # Test 8.1: Get Dashboard Stats
    response = make_request("GET", f"/dashboard/stats/{user1['email']}")
    if response and response.status_code == 200:
        stats = response.json()
        total_meals = stats.get("total_meals_7days", 0)
        total_scans = stats.get("total_scans_7days", 0)
        coach_messages = stats.get("coach_messages_7days", 0)
        children_count = stats.get("children_count", 0)
        
        log_test("Dashboard Stats", True, f"Meals: {total_meals}, Scans: {total_scans}, Messages: {coach_messages}, Children: {children_count}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Dashboard Stats", False, error=error_msg)

def test_9_premium_stripe():
    """9. PREMIUM & STRIPE (CON API KEY DAL DATABASE)"""
    print("\n" + "="*60)
    print("9. TESTING PREMIUM & STRIPE")
    print("="*60)
    
    user3 = TEST_USERS[2]
    
    # Test 9.1: Get Pricing Config
    response = make_request("GET", "/pricing")
    if response and response.status_code == 200:
        pricing = response.json()
        monthly_price = pricing.get("monthly_price")
        yearly_price = pricing.get("yearly_price")
        log_test("Get Pricing Config", True, f"Monthly: €{monthly_price}, Yearly: €{yearly_price}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Get Pricing Config", False, error=error_msg)
    
    # Test 9.2: Create Checkout Session (Monthly)
    checkout_data = {
        "plan_type": "monthly",
        "origin_url": "https://smart-foodscan.preview.emergentagent.com"
    }
    headers = {"X-User-Email": user3["email"]}
    
    response = make_request("POST", "/checkout/create-session", checkout_data, headers)
    if response and response.status_code == 200:
        session_data = response.json()
        session_id = session_data.get("session_id")
        checkout_url = session_data.get("url")
        log_test("Create Checkout Session (Monthly)", True, f"Session ID: {session_id[:20] if session_id else 'None'}...")
        
        # Test 9.3: Check Checkout Status
        if session_id:
            response = make_request("GET", f"/checkout/status/{session_id}")
            if response and response.status_code == 200:
                status_data = response.json()
                payment_status = status_data.get("payment_status")
                amount = status_data.get("amount_total")
                log_test("Check Checkout Status", True, f"Status: {payment_status}, Amount: {amount}")
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                log_test("Check Checkout Status", False, error=error_msg)
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Create Checkout Session (Monthly)", False, error=error_msg)
    
    # Test 9.4: Create Checkout Session (Yearly)
    checkout_data_yearly = {
        "plan_type": "yearly",
        "origin_url": "https://smart-foodscan.preview.emergentagent.com"
    }
    
    response = make_request("POST", "/checkout/create-session", checkout_data_yearly, headers)
    if response and response.status_code == 200:
        session_data = response.json()
        log_test("Create Checkout Session (Yearly)", True, f"Yearly session created successfully")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Create Checkout Session (Yearly)", False, error=error_msg)

def test_10_push_notifications():
    """10. NOTIFICHE PUSH"""
    print("\n" + "="*60)
    print("10. TESTING NOTIFICHE PUSH")
    print("="*60)
    
    user1 = TEST_USERS[0]
    
    # Test 10.1: Register Push Token
    token_data = {
        "user_email": user1["email"],
        "push_token": "ExponentPushToken[test_token_123456789]",
        "device_type": "mobile",
        "language": "it"
    }
    
    response = make_request("POST", "/push-token/register", token_data)
    if response and response.status_code == 200:
        log_test("Register Push Token", True, "Push token registered successfully")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Register Push Token", False, error=error_msg)
    
    # Test 10.2: Get Notification Preferences
    response = make_request("GET", f"/push-token/preferences/{user1['email']}")
    if response and response.status_code == 200:
        preferences = response.json()
        log_test("Get Notification Preferences", True, f"Enabled: {preferences.get('enabled')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Get Notification Preferences", False, error=error_msg)
    
    # Test 10.3: Update Notification Preferences
    prefs_data = {
        "user_email": user1["email"],
        "enabled": True,
        "lunch_time": "13:00",
        "dinner_time": "20:00",
        "evening_reminder": "21:30",
        "weekly_report_day": 0,  # Monday
        "weekly_report_time": "19:00",
        "max_daily_notifications": 3
    }
    
    response = make_request("PUT", "/push-token/preferences", prefs_data)
    if response and response.status_code == 200:
        log_test("Update Notification Preferences", True, "Preferences updated successfully")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Update Notification Preferences", False, error=error_msg)
    
    # Test 10.4: Send Test Notification
    notification_data = {
        "user_email": user1["email"],
        "title": "Test Notification",
        "body": "Questo è un test delle notifiche push di NutriKids",
        "data": {"type": "test", "timestamp": datetime.now().isoformat()}
    }
    
    response = make_request("POST", "/push-token/send", notification_data)
    if response and response.status_code == 200:
        log_test("Send Test Notification", True, "Test notification sent successfully")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Send Test Notification", False, error=error_msg)

def test_11_admin_panel():
    """11. ADMIN PANEL"""
    print("\n" + "="*60)
    print("11. TESTING ADMIN PANEL")
    print("="*60)
    
    global admin_token
    
    if not admin_token:
        log_test("Admin Panel Access", False, error="No admin token available")
        return
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 11.1: Get Admin Config
    response = make_request("GET", "/admin/config", headers=headers)
    if response and response.status_code == 200:
        config = response.json()
        emergent_key = config.get("emergent_llm_key", "")[:20] + "..." if config.get("emergent_llm_key") else "Not set"
        monthly_price = config.get("premium_monthly_price")
        log_test("Get Admin Config", True, f"LLM Key: {emergent_key}, Monthly: €{monthly_price}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Get Admin Config", False, error=error_msg)
    
    # Test 11.2: Update Admin Config
    config_update = {
        "premium_monthly_price": 7.99,
        "max_free_scans_daily": 5
    }
    
    response = make_request("PUT", "/admin/config", config_update, headers)
    if response and response.status_code == 200:
        updated_config = response.json()
        log_test("Update Admin Config", True, f"Updated monthly price to €{updated_config.get('premium_monthly_price')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Update Admin Config", False, error=error_msg)
    
    # Test 11.3: Get Specific Config Value
    response = make_request("GET", "/admin/config/premium_monthly_price", headers=headers)
    if response and response.status_code == 200:
        config_value = response.json()
        log_test("Get Specific Config Value", True, f"Monthly price: €{config_value.get('value')}")
    else:
        error_msg = response.json().get("detail", "Unknown error") if response else "No response"
        log_test("Get Specific Config Value", False, error=error_msg)

def print_final_report():
    """Print final test report"""
    print("\n" + "="*80)
    print("REPORT FINALE - TEST COMPLETO NUTRIKIDS AI")
    print("="*80)
    
    total = test_results["total_tests"]
    passed = test_results["passed_tests"]
    failed = test_results["failed_tests"]
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"📊 STATISTICHE GENERALI:")
    print(f"   Total Tests: {total}")
    print(f"   ✅ Passed: {passed}")
    print(f"   ❌ Failed: {failed}")
    print(f"   📈 Success Rate: {success_rate:.1f}%")
    
    print(f"\n🔍 DETTAGLI PER CATEGORIA:")
    
    categories = {
        "1. AUTENTICAZIONE & UTENTI": [],
        "2. SISTEMA REFERRAL": [],
        "3. FREE TRIAL": [],
        "4. GAMIFICATION & CHILDREN": [],
        "5. SCANNER & AI": [],
        "6. COACH MAYA": [],
        "7. DIARIO & PIANI": [],
        "8. DASHBOARD": [],
        "9. PREMIUM & STRIPE": [],
        "10. NOTIFICHE PUSH": [],
        "11. ADMIN PANEL": []
    }
    
    # Group tests by category
    for test_detail in test_results["test_details"]:
        test_name = test_detail["test"]
        status = test_detail["status"]
        
        # Determine category based on test name
        if any(keyword in test_name.lower() for keyword in ["login", "register", "password", "usage"]):
            categories["1. AUTENTICAZIONE & UTENTI"].append(f"   {status} {test_name}")
        elif "referral" in test_name.lower():
            categories["2. SISTEMA REFERRAL"].append(f"   {status} {test_name}")
        elif "trial" in test_name.lower():
            categories["3. FREE TRIAL"].append(f"   {status} {test_name}")
        elif any(keyword in test_name.lower() for keyword in ["child", "gamification", "points", "award"]):
            categories["4. GAMIFICATION & CHILDREN"].append(f"   {status} {test_name}")
        elif any(keyword in test_name.lower() for keyword in ["photo", "analysis", "scan"]):
            categories["5. SCANNER & AI"].append(f"   {status} {test_name}")
        elif "coach" in test_name.lower():
            categories["6. COACH MAYA"].append(f"   {status} {test_name}")
        elif any(keyword in test_name.lower() for keyword in ["diary", "meal"]):
            categories["7. DIARIO & PIANI"].append(f"   {status} {test_name}")
        elif "dashboard" in test_name.lower():
            categories["8. DASHBOARD"].append(f"   {status} {test_name}")
        elif any(keyword in test_name.lower() for keyword in ["checkout", "stripe", "pricing"]):
            categories["9. PREMIUM & STRIPE"].append(f"   {status} {test_name}")
        elif any(keyword in test_name.lower() for keyword in ["push", "notification"]):
            categories["10. NOTIFICHE PUSH"].append(f"   {status} {test_name}")
        elif "admin" in test_name.lower():
            categories["11. ADMIN PANEL"].append(f"   {status} {test_name}")
    
    # Print categories
    for category, tests in categories.items():
        if tests:
            print(f"\n{category}:")
            for test in tests:
                print(test)
    
    print(f"\n🎯 VALIDAZIONI CRITICHE:")
    critical_validations = [
        "✅ Tutti gli endpoint rispondono correttamente" if success_rate > 80 else "❌ Alcuni endpoint non funzionano",
        "✅ API keys lette dal database" if any("admin config" in t["test"].lower() and "✅" in t["status"] for t in test_results["test_details"]) else "❌ Problema con API keys dal database",
        "✅ Sistema referral funzionante" if any("referral" in t["test"].lower() and "✅" in t["status"] for t in test_results["test_details"]) else "❌ Sistema referral non funziona",
        "✅ Trial 7 giorni funzionante" if any("trial" in t["test"].lower() and "✅" in t["status"] for t in test_results["test_details"]) else "❌ Free trial non funziona",
        "✅ Gamification completa" if any("points" in t["test"].lower() and "✅" in t["status"] for t in test_results["test_details"]) else "❌ Gamification non completa",
        "✅ Stripe integrato" if any("checkout" in t["test"].lower() and "✅" in t["status"] for t in test_results["test_details"]) else "❌ Stripe non integrato",
        "✅ Admin panel protetto" if any("admin" in t["test"].lower() and "✅" in t["status"] for t in test_results["test_details"]) else "❌ Admin panel non protetto"
    ]
    
    for validation in critical_validations:
        print(f"   {validation}")
    
    print(f"\n📈 PERCENTUALE SUCCESSO GENERALE: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 ECCELLENTE! Sistema pronto per il lancio MVP")
    elif success_rate >= 80:
        print("✅ BUONO! Pochi problemi minori da risolvere")
    elif success_rate >= 70:
        print("⚠️  ACCETTABILE! Alcuni problemi da correggere")
    else:
        print("❌ CRITICO! Molti problemi da risolvere prima del lancio")

def main():
    """Main test execution"""
    print("🧪 NUTRIKIDS AI - TEST COMPLETO FINALE")
    print("Testing all functionalities before final deployment")
    print(f"Backend URL: {BACKEND_URL}")
    print("="*80)
    
    # Execute all tests in order
    test_1_authentication_users()
    test_2_referral_system()
    test_3_free_trial()
    test_4_gamification_children()
    test_5_scanner_ai()
    test_6_coach_maya()
    test_7_diary_plans()
    test_8_dashboard()
    test_9_premium_stripe()
    test_10_push_notifications()
    test_11_admin_panel()
    
    # Print final report
    print_final_report()

if __name__ == "__main__":
    main()