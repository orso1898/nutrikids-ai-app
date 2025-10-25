#!/usr/bin/env python3
"""
NutriKids AI - Test Completo Finale
Test end-to-end di TUTTE le funzionalità prima del deployment finale
"""

import requests
import json
import base64
import time
from datetime import datetime, timedelta
import uuid
import os

# Configuration
BACKEND_URL = "https://nutriplay-2.preview.emergentagent.com/api"
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

class NutriKidsBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.user_token = None
        self.admin_token = None
        self.test_child_id = None
        self.test_diary_id = None
        self.referral_code = None
        self.checkout_session_id = None
        
        # Test results tracking
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        self.results["total_tests"] += 1
        if success:
            self.results["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.results["failed"] += 1
            self.results["errors"].append(f"{test_name}: {details}")
            print(f"❌ {test_name}: {details}")
    
    def make_request(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{BASE_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers)
            
            if response.status_code == expected_status:
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                return False, f"Status {response.status_code}: {response.text}"
                
        except Exception as e:
            return False, f"Request error: {str(e)}"
    
    def test_health_check(self):
        """Test 1: Health Check API"""
        success, result = self.make_request("GET", "/")
        if success and "NutriKids AI Backend" in str(result):
            self.log_test("Health Check API", True)
        else:
            self.log_test("Health Check API", False, str(result))
    
    def test_user_registration(self):
        """Test 2: User Registration"""
        # Test normal registration
        user_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": "Test Parent"
        }
        
        success, result = self.make_request("POST", "/register", user_data, expected_status=201)
        if success and "email" in result:
            self.log_test("User Registration", True)
        elif "already registered" in str(result):
            self.log_test("User Registration", True, "User already exists")
        else:
            self.log_test("User Registration", False, str(result))
        
        # Test duplicate registration (should fail)
        success, result = self.make_request("POST", "/register", user_data, expected_status=400)
        if not success or "already registered" in str(result):
            self.log_test("Duplicate Registration Validation", True)
        else:
            self.log_test("Duplicate Registration Validation", False, "Should reject duplicate email")
    
    def test_user_login(self):
        """Test 3: User Login"""
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        success, result = self.make_request("POST", "/login", login_data)
        if success and "token" in result:
            self.user_token = result["token"]
            self.log_test("User Login", True)
        else:
            self.log_test("User Login", False, str(result))
        
        # Test invalid login
        invalid_data = {
            "email": TEST_USER_EMAIL,
            "password": "wrongpassword"
        }
        success, result = self.make_request("POST", "/login", invalid_data, expected_status=401)
        if not success:
            self.log_test("Invalid Login Validation", True)
        else:
            self.log_test("Invalid Login Validation", False, "Should reject invalid password")
    
    def test_admin_login(self):
        """Test 4: Admin Login"""
        login_data = {
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASSWORD
        }
        
        success, result = self.make_request("POST", "/login", login_data)
        if success and "token" in result:
            self.admin_token = result["token"]
            self.log_test("Admin Login", True)
        else:
            self.log_test("Admin Login", False, str(result))
    
    def test_forgot_reset_password(self):
        """Test 5: Password Recovery Flow"""
        # Test forgot password
        forgot_data = {"email": TEST_USER_EMAIL}
        success, result = self.make_request("POST", "/forgot-password", forgot_data)
        
        if success and "reset_code" in result:
            reset_code = result["reset_code"]
            self.log_test("Forgot Password", True)
            
            # Test reset password
            reset_data = {
                "email": TEST_USER_EMAIL,
                "reset_code": reset_code,
                "new_password": "newpassword123"
            }
            success, result = self.make_request("POST", "/reset-password", reset_data)
            if success:
                self.log_test("Reset Password", True)
                
                # Update password for future tests
                global TEST_USER_PASSWORD
                TEST_USER_PASSWORD = "newpassword123"
                
                # Re-login with new password
                login_data = {
                    "email": TEST_USER_EMAIL,
                    "password": TEST_USER_PASSWORD
                }
                success, result = self.make_request("POST", "/login", login_data)
                if success and "token" in result:
                    self.user_token = result["token"]
            else:
                self.log_test("Reset Password", False, str(result))
        else:
            self.log_test("Forgot Password", False, str(result))
    
    def test_user_usage_limits(self):
        """Test 6: User Usage Limits"""
        success, result = self.make_request("GET", f"/usage/{TEST_USER_EMAIL}")
        if success and "scans_used" in result and "is_premium" in result:
            self.log_test("User Usage Status", True)
        else:
            self.log_test("User Usage Status", False, str(result))
    
    def test_children_crud(self):
        """Test 7: Children CRUD Operations"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Create child
        child_data = {
            "parent_email": TEST_USER_EMAIL,
            "name": "Test Child",
            "age": 8,
            "allergies": ["glutine", "lattosio"]
        }
        
        success, result = self.make_request("POST", "/children", child_data, headers)
        if success and "id" in result:
            self.test_child_id = result["id"]
            self.log_test("Create Child Profile", True)
        else:
            self.log_test("Create Child Profile", False, str(result))
        
        # Get children list
        success, result = self.make_request("GET", f"/children/{TEST_USER_EMAIL}", headers=headers)
        if success and isinstance(result, list) and len(result) > 0:
            self.log_test("Get Children List", True)
        else:
            self.log_test("Get Children List", False, str(result))
        
        # Update child
        if self.test_child_id:
            update_data = {
                "parent_email": TEST_USER_EMAIL,
                "name": "Updated Test Child",
                "age": 9,
                "allergies": ["glutine"]
            }
            success, result = self.make_request("PUT", f"/children/{self.test_child_id}", update_data, headers)
            if success:
                self.log_test("Update Child Profile", True)
            else:
                self.log_test("Update Child Profile", False, str(result))
    
    def test_gamification_points(self):
        """Test 8: Gamification - Award Points"""
        if not self.test_child_id:
            self.log_test("Award Points (No Child)", False, "No child ID available")
            return
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Award points for diary entry
        points_data = {"points": 10}
        success, result = self.make_request("POST", f"/children/{self.test_child_id}/award-points", points_data, headers)
        if success and "level" in result and "points" in result:
            self.log_test("Award Points - Diary", True)
        else:
            self.log_test("Award Points - Diary", False, str(result))
        
        # Award points for scanner
        points_data = {"points": 5}
        success, result = self.make_request("POST", f"/children/{self.test_child_id}/award-points", points_data, headers)
        if success:
            self.log_test("Award Points - Scanner", True)
        else:
            self.log_test("Award Points - Scanner", False, str(result))
        
        # Test level up (award 100 points)
        points_data = {"points": 100}
        success, result = self.make_request("POST", f"/children/{self.test_child_id}/award-points", points_data, headers)
        if success and result.get("level_up"):
            self.log_test("Level Up System", True)
        else:
            self.log_test("Level Up System", False, "No level up detected")
        
        # Test badge system (should have first_century badge)
        if success and "first_century" in result.get("new_badges", []):
            self.log_test("Badge System", True)
        else:
            self.log_test("Badge System", False, "No badges awarded")
    
    def test_photo_analysis(self):
        """Test 9: Photo Analysis with AI"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Create a simple base64 test image (1x1 pixel PNG)
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
        
        analysis_data = {
            "image_base64": test_image_b64,
            "user_email": TEST_USER_EMAIL
        }
        
        success, result = self.make_request("POST", "/analyze-photo", analysis_data, headers)
        if success and "foods_detected" in result and "health_score" in result:
            self.log_test("Photo Analysis API", True)
        else:
            self.log_test("Photo Analysis API", False, str(result))
        
        # Test free user limits (try multiple scans)
        for i in range(4):  # Should hit limit at 3
            success, result = self.make_request("POST", "/analyze-photo", analysis_data, headers)
            if not success and "limite" in str(result).lower():
                self.log_test("Free Scan Limits", True)
                break
        else:
            self.log_test("Free Scan Limits", False, "No limit enforcement detected")
    
    def test_diary_operations(self):
        """Test 10: Diary CRUD Operations"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Create diary entry
        diary_data = {
            "user_email": TEST_USER_EMAIL,
            "meal_type": "pranzo",
            "description": "Pasta al pomodoro con verdure",
            "date": datetime.now().strftime("%Y-%m-%d"),
            "nutritional_info": {
                "calories": 350,
                "proteins": 12,
                "carbs": 65,
                "fats": 8
            }
        }
        
        success, result = self.make_request("POST", "/diary", diary_data, headers)
        if success and "id" in result:
            self.test_diary_id = result["id"]
            self.log_test("Create Diary Entry", True)
        else:
            self.log_test("Create Diary Entry", False, str(result))
        
        # Get diary entries
        success, result = self.make_request("GET", f"/diary/{TEST_USER_EMAIL}", headers=headers)
        if success and isinstance(result, list):
            self.log_test("Get Diary Entries", True)
        else:
            self.log_test("Get Diary Entries", False, str(result))
    
    def test_coach_maya(self):
        """Test 11: Coach Maya AI Chat"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        chat_data = {
            "message": "Ciao Maya, che consigli hai per la colazione di un bambino di 8 anni?",
            "session_id": "test_session",
            "language": "it",
            "user_email": TEST_USER_EMAIL
        }
        
        success, result = self.make_request("POST", "/coach-maya", chat_data, headers)
        if success and "response" in result:
            self.log_test("Coach Maya Chat", True)
        else:
            self.log_test("Coach Maya Chat", False, str(result))
        
        # Test free user limits
        for i in range(6):  # Should hit limit at 5
            success, result = self.make_request("POST", "/coach-maya", chat_data, headers)
            if not success and "limite" in str(result).lower():
                self.log_test("Coach Maya Limits", True)
                break
        else:
            self.log_test("Coach Maya Limits", False, "No limit enforcement detected")
    
    def test_referral_system(self):
        """Test 12: Referral System"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Get referral code
        success, result = self.make_request("GET", f"/referral/code/{TEST_USER_EMAIL}", headers=headers)
        if success and "referral_code" in result:
            self.referral_code = result["referral_code"]
            self.log_test("Get Referral Code", True)
        else:
            self.log_test("Get Referral Code", False, str(result))
        
        # Test registration with referral code
        if self.referral_code:
            new_user_data = {
                "email": "invited.user@nutrikids.com",
                "password": "invitedpass123",
                "name": "Invited User",
                "referral_code": self.referral_code
            }
            
            success, result = self.make_request("POST", "/register", new_user_data, expected_status=201)
            if success or "already registered" in str(result):
                self.log_test("Registration with Referral", True)
            else:
                self.log_test("Registration with Referral", False, str(result))
    
    def test_stripe_payments(self):
        """Test 13: Stripe Payment System"""
        headers = {
            "Authorization": f"Bearer {self.user_token}",
            "X-User-Email": TEST_USER_EMAIL
        }
        
        # Test pricing endpoint
        success, result = self.make_request("GET", "/pricing")
        if success and "monthly_price" in result and "yearly_price" in result:
            self.log_test("Get Pricing Config", True)
        else:
            self.log_test("Get Pricing Config", False, str(result))
        
        # Test checkout session creation
        checkout_data = {
            "plan_type": "monthly",
            "origin_url": "https://nutriplay-2.preview.emergentagent.com"
        }
        
        success, result = self.make_request("POST", "/checkout/create-session", checkout_data, headers)
        if success and "session_id" in result and "url" in result:
            self.checkout_session_id = result["session_id"]
            self.log_test("Create Checkout Session", True)
        else:
            self.log_test("Create Checkout Session", False, str(result))
        
        # Test checkout status
        if self.checkout_session_id:
            success, result = self.make_request("GET", f"/checkout/status/{self.checkout_session_id}")
            if success and "payment_status" in result:
                self.log_test("Get Checkout Status", True)
            else:
                self.log_test("Get Checkout Status", False, str(result))
    
    def test_meal_plans(self):
        """Test 14: Meal Plan Generation"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Create meal plan
        week_start = datetime.now().strftime("%Y-%m-%d")
        meal_plan_data = {
            "user_email": TEST_USER_EMAIL,
            "week_start_date": week_start,
            "num_people": 2,
            "monday": {
                "breakfast": "Cereali integrali con latte",
                "lunch": "Pasta al pomodoro",
                "dinner": "Pollo con verdure",
                "snack": "Frutta fresca"
            },
            "tuesday": {
                "breakfast": "Toast integrale",
                "lunch": "Riso con verdure",
                "dinner": "Pesce al vapore",
                "snack": "Yogurt"
            },
            "wednesday": {
                "breakfast": "Pancake",
                "lunch": "Insalata",
                "dinner": "Carne",
                "snack": "Frutta"
            },
            "thursday": {
                "breakfast": "Yogurt",
                "lunch": "Zuppa",
                "dinner": "Tacchino",
                "snack": "Smoothie"
            },
            "friday": {
                "breakfast": "Avocado toast",
                "lunch": "Pasta integrale",
                "dinner": "Pesce bianco",
                "snack": "Frutta"
            },
            "saturday": {
                "breakfast": "Uova",
                "lunch": "Quinoa",
                "dinner": "Pollo",
                "snack": "Yogurt"
            },
            "sunday": {
                "breakfast": "French toast",
                "lunch": "Minestrone",
                "dinner": "Pesce",
                "snack": "Frutta"
            }
        }
        
        success, result = self.make_request("POST", "/meal-plan", meal_plan_data, headers)
        if success and "id" in result:
            self.log_test("Create Meal Plan", True)
        else:
            self.log_test("Create Meal Plan", False, str(result))
        
        # Get meal plan
        success, result = self.make_request("GET", f"/meal-plan/{TEST_USER_EMAIL}/{week_start}", headers=headers)
        if success and "monday" in result:
            self.log_test("Get Meal Plan", True)
        else:
            self.log_test("Get Meal Plan", False, str(result))
    
    def test_dashboard_stats(self):
        """Test 15: Dashboard Statistics"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        success, result = self.make_request("GET", f"/dashboard/stats/{TEST_USER_EMAIL}", headers=headers)
        if success and "total_meals_7days" in result and "children_count" in result:
            self.log_test("Dashboard Statistics", True)
        else:
            self.log_test("Dashboard Statistics", False, str(result))
    
    def test_push_notifications(self):
        """Test 16: Push Notification System"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Register push token
        token_data = {
            "user_email": TEST_USER_EMAIL,
            "push_token": "ExponentPushToken[test_token_123]",
            "device_type": "mobile",
            "language": "it"
        }
        
        success, result = self.make_request("POST", "/push-token/register", token_data, headers)
        if success:
            self.log_test("Register Push Token", True)
        else:
            self.log_test("Register Push Token", False, str(result))
        
        # Get notification preferences
        success, result = self.make_request("GET", f"/push-token/preferences/{TEST_USER_EMAIL}", headers=headers)
        if success and "enabled" in result:
            self.log_test("Get Notification Preferences", True)
        else:
            self.log_test("Get Notification Preferences", False, str(result))
        
        # Update preferences
        prefs_data = {
            "user_email": TEST_USER_EMAIL,
            "enabled": True,
            "lunch_time": "13:00",
            "dinner_time": "20:00",
            "evening_reminder": "21:30",
            "weekly_report_day": 0,
            "weekly_report_time": "19:00",
            "max_daily_notifications": 3
        }
        
        success, result = self.make_request("PUT", "/push-token/preferences", prefs_data, headers)
        if success:
            self.log_test("Update Notification Preferences", True)
        else:
            self.log_test("Update Notification Preferences", False, str(result))
    
    def test_admin_config(self):
        """Test 17: Admin Configuration"""
        if not self.admin_token:
            self.log_test("Admin Config (No Token)", False, "Admin token not available")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get admin config
        success, result = self.make_request("GET", "/admin/config", headers=headers)
        if success and "premium_monthly_price" in result:
            self.log_test("Get Admin Config", True)
        else:
            self.log_test("Get Admin Config", False, str(result))
        
        # Update config
        config_update = {
            "premium_monthly_price": 7.99,
            "max_free_scans_daily": 5
        }
        
        success, result = self.make_request("PUT", "/admin/config", config_update, headers)
        if success:
            self.log_test("Update Admin Config", True)
        else:
            self.log_test("Update Admin Config", False, str(result))
    
    def cleanup_test_data(self):
        """Clean up test data"""
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Delete test child
        if self.test_child_id:
            self.make_request("DELETE", f"/children/{self.test_child_id}", headers=headers)
        
        # Delete test diary entry
        if self.test_diary_id:
            self.make_request("DELETE", f"/diary/{self.test_diary_id}", headers=headers)
    
    def run_all_tests(self):
        """Run comprehensive backend testing suite"""
        print("🧪 NUTRIKIDS AI BACKEND TESTING - MVP READY CHECK")
        print("=" * 60)
        
        # Core Authentication & Users
        print("\n📋 TESTING: Authentication & Users")
        self.test_health_check()
        self.test_user_registration()
        self.test_user_login()
        self.test_admin_login()
        self.test_forgot_reset_password()
        self.test_user_usage_limits()
        
        # Children & Gamification
        print("\n🎮 TESTING: Gamification & Children")
        self.test_children_crud()
        self.test_gamification_points()
        
        # AI & Scanner
        print("\n🤖 TESTING: Scanner & AI")
        self.test_photo_analysis()
        
        # Diary & Plans
        print("\n📖 TESTING: Diary & Plans")
        self.test_diary_operations()
        self.test_meal_plans()
        self.test_dashboard_stats()
        
        # Coach Maya
        print("\n👩‍⚕️ TESTING: Coach Maya")
        self.test_coach_maya()
        
        # Referral System
        print("\n🔗 TESTING: Referral System")
        self.test_referral_system()
        
        # Premium & Stripe
        print("\n💳 TESTING: Premium & Stripe")
        self.test_stripe_payments()
        
        # Push Notifications
        print("\n🔔 TESTING: Push Notifications")
        self.test_push_notifications()
        
        # Admin Configuration
        print("\n⚙️ TESTING: Admin Configuration")
        self.test_admin_config()
        
        # Cleanup
        print("\n🧹 CLEANING UP TEST DATA")
        self.cleanup_test_data()
        
        # Final Results
        print("\n" + "=" * 60)
        print("🏁 TESTING COMPLETE - RESULTS SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"Success Rate: {(self.results['passed']/self.results['total_tests']*100):.1f}%")
        
        if self.results['errors']:
            print("\n🚨 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"  - {error}")
        
        return self.results

if __name__ == "__main__":
    tester = NutriKidsBackendTester()
    results = tester.run_all_tests()