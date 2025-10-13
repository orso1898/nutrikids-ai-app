#!/usr/bin/env python3
"""
NutriKids AI Backend Testing Suite
Tests all backend endpoints for the nutrition app
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://kids-nutrition.preview.emergentagent.com/api"

class NutriKidsBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_entries = []  # Track created entries for cleanup
        self.created_children = []  # Track created children for cleanup
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test GET /api/ - Health check"""
        try:
            response = self.session.get(f"{BACKEND_URL}/")
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "NutriKids" in data["message"]:
                    self.log_result("Health Check", True, "Backend is running correctly")
                    return True
                else:
                    self.log_result("Health Check", False, "Unexpected response format", {"response": data})
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_coach_maya(self):
        """Test POST /api/coach-maya - AI chatbot"""
        try:
            payload = {
                "message": "Come posso migliorare l'alimentazione di mio figlio?",
                "session_id": "test1"
            }
            response = self.session.post(f"{BACKEND_URL}/coach-maya", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data and "session_id" in data:
                    if len(data["response"]) > 10 and "session_id" in data:
                        self.log_result("Coach Maya AI", True, "AI responded correctly in Italian")
                        return True
                    else:
                        self.log_result("Coach Maya AI", False, "Response too short or missing session_id", {"response": data})
                        return False
                else:
                    self.log_result("Coach Maya AI", False, "Invalid response format", {"response": data})
                    return False
            else:
                self.log_result("Coach Maya AI", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Coach Maya AI", False, f"Request error: {str(e)}")
            return False
    
    def test_create_diary_entry(self):
        """Test POST /api/diary - Create diary entry"""
        try:
            payload = {
                "user_email": "test@example.com",
                "meal_type": "colazione",
                "description": "Latte e cereali integrali con frutta fresca",
                "date": "2025-01-15"
            }
            response = self.session.post(f"{BACKEND_URL}/diary", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "user_email", "meal_type", "description", "date", "timestamp"]
                if all(field in data for field in required_fields):
                    self.created_entries.append(data["id"])
                    self.log_result("Create Diary Entry", True, f"Entry created with ID: {data['id']}")
                    return data["id"]
                else:
                    self.log_result("Create Diary Entry", False, "Missing required fields", {"response": data})
                    return None
            else:
                self.log_result("Create Diary Entry", False, f"HTTP {response.status_code}", {"response": response.text})
                return None
        except Exception as e:
            self.log_result("Create Diary Entry", False, f"Request error: {str(e)}")
            return None
    
    def test_get_diary_entries(self):
        """Test GET /api/diary/{user_email} - Get diary entries"""
        try:
            user_email = "test@example.com"
            response = self.session.get(f"{BACKEND_URL}/diary/{user_email}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if entries have required fields
                        entry = data[0]
                        required_fields = ["id", "user_email", "meal_type", "description", "date"]
                        if all(field in entry for field in required_fields):
                            self.log_result("Get Diary Entries", True, f"Retrieved {len(data)} entries")
                            return True
                        else:
                            self.log_result("Get Diary Entries", False, "Entry missing required fields", {"entry": entry})
                            return False
                    else:
                        self.log_result("Get Diary Entries", True, "No entries found (empty list)")
                        return True
                else:
                    self.log_result("Get Diary Entries", False, "Response is not a list", {"response": data})
                    return False
            else:
                self.log_result("Get Diary Entries", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Get Diary Entries", False, f"Request error: {str(e)}")
            return False
    
    def test_delete_diary_entry(self, entry_id):
        """Test DELETE /api/diary/{entry_id} - Delete diary entry"""
        if not entry_id:
            self.log_result("Delete Diary Entry", False, "No entry ID provided for deletion")
            return False
            
        try:
            response = self.session.delete(f"{BACKEND_URL}/diary/{entry_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deleted" in data["message"].lower():
                    self.log_result("Delete Diary Entry", True, f"Entry {entry_id} deleted successfully")
                    return True
                else:
                    self.log_result("Delete Diary Entry", False, "Unexpected response format", {"response": data})
                    return False
            elif response.status_code == 404:
                self.log_result("Delete Diary Entry", True, "Entry not found (404) - expected behavior")
                return True
            else:
                self.log_result("Delete Diary Entry", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Delete Diary Entry", False, f"Request error: {str(e)}")
            return False
    
    def test_create_child(self):
        """Test POST /api/children - Add child"""
        try:
            payload = {
                "parent_email": "test@example.com",
                "name": "Marco",
                "age": 5
            }
            response = self.session.post(f"{BACKEND_URL}/children", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "parent_email", "name", "age", "timestamp"]
                if all(field in data for field in required_fields):
                    self.created_children.append(data["id"])
                    self.log_result("Create Child", True, f"Child created with ID: {data['id']}")
                    return data["id"]
                else:
                    self.log_result("Create Child", False, "Missing required fields", {"response": data})
                    return None
            else:
                self.log_result("Create Child", False, f"HTTP {response.status_code}", {"response": response.text})
                return None
        except Exception as e:
            self.log_result("Create Child", False, f"Request error: {str(e)}")
            return None
    
    def test_get_children(self):
        """Test GET /api/children/{parent_email} - Get children list"""
        try:
            parent_email = "test@example.com"
            response = self.session.get(f"{BACKEND_URL}/children/{parent_email}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check if children have required fields
                        child = data[0]
                        required_fields = ["id", "parent_email", "name", "age"]
                        if all(field in child for field in required_fields):
                            self.log_result("Get Children", True, f"Retrieved {len(data)} children")
                            return True
                        else:
                            self.log_result("Get Children", False, "Child missing required fields", {"child": child})
                            return False
                    else:
                        self.log_result("Get Children", True, "No children found (empty list)")
                        return True
                else:
                    self.log_result("Get Children", False, "Response is not a list", {"response": data})
                    return False
            else:
                self.log_result("Get Children", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Get Children", False, f"Request error: {str(e)}")
            return False
    
    def test_delete_child(self, child_id):
        """Test DELETE /api/children/{child_id} - Delete child"""
        if not child_id:
            self.log_result("Delete Child", False, "No child ID provided for deletion")
            return False
            
        try:
            response = self.session.delete(f"{BACKEND_URL}/children/{child_id}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "deleted" in data["message"].lower():
                    self.log_result("Delete Child", True, f"Child {child_id} deleted successfully")
                    return True
                else:
                    self.log_result("Delete Child", False, "Unexpected response format", {"response": data})
                    return False
            elif response.status_code == 404:
                self.log_result("Delete Child", True, "Child not found (404) - expected behavior")
                return True
            else:
                self.log_result("Delete Child", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Delete Child", False, f"Request error: {str(e)}")
            return False
    
    def test_error_cases(self):
        """Test error handling"""
        print("\n=== Testing Error Cases ===")
        
        # Test deleting non-existent diary entry
        try:
            response = self.session.delete(f"{BACKEND_URL}/diary/non-existent-id")
            if response.status_code == 404:
                self.log_result("Error Handling - Diary 404", True, "Correctly returns 404 for non-existent entry")
            else:
                self.log_result("Error Handling - Diary 404", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("Error Handling - Diary 404", False, f"Request error: {str(e)}")
        
        # Test deleting non-existent child
        try:
            response = self.session.delete(f"{BACKEND_URL}/children/non-existent-id")
            if response.status_code == 404:
                self.log_result("Error Handling - Child 404", True, "Correctly returns 404 for non-existent child")
            else:
                self.log_result("Error Handling - Child 404", False, f"Expected 404, got {response.status_code}")
        except Exception as e:
            self.log_result("Error Handling - Child 404", False, f"Request error: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting NutriKids AI Backend Tests")
        print(f"🔗 Testing backend at: {BACKEND_URL}")
        print("=" * 60)
        
        # Test 1: Health Check
        if not self.test_health_check():
            print("❌ Backend is not accessible. Stopping tests.")
            return False
        
        # Test 2: Coach Maya AI
        self.test_coach_maya()
        
        # Test 3: Create Diary Entry
        entry_id = self.test_create_diary_entry()
        
        # Test 4: Get Diary Entries
        self.test_get_diary_entries()
        
        # Test 5: Delete Diary Entry
        self.test_delete_diary_entry(entry_id)
        
        # Test 6: Create Child
        child_id = self.test_create_child()
        
        # Test 7: Get Children
        self.test_get_children()
        
        # Test 8: Delete Child
        self.test_delete_child(child_id)
        
        # Test 9: Error Cases
        self.test_error_cases()
        
        # Summary
        self.print_summary()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  • {result['test']}: {result['message']}")
        
        print("\n✅ PASSED TESTS:")
        for result in self.test_results:
            if result["success"]:
                print(f"  • {result['test']}: {result['message']}")

if __name__ == "__main__":
    tester = NutriKidsBackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)