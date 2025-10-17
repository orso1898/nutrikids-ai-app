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
BACKEND_URL = "https://kidsfood-helper.preview.emergentagent.com/api"

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
    
    def test_admin_config_get(self):
        """Test GET /api/admin/config - Get all configurations"""
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/config")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "emergent_llm_key", "premium_monthly_price", "premium_yearly_price", 
                                 "openai_model", "vision_model", "max_free_scans", "updated_at"]
                
                if all(field in data for field in required_fields):
                    # Check default values
                    defaults_correct = (
                        data.get("premium_monthly_price") == 9.99 and
                        data.get("premium_yearly_price") == 71.88 and
                        data.get("openai_model") == "gpt-4o-mini" and
                        data.get("vision_model") == "gpt-4o" and
                        data.get("max_free_scans") == 5
                    )
                    
                    if defaults_correct:
                        self.log_result("Admin Config - GET All", True, "Retrieved config with correct default values")
                        return True
                    else:
                        self.log_result("Admin Config - GET All", False, "Config retrieved but default values incorrect", {"config": data})
                        return False
                else:
                    self.log_result("Admin Config - GET All", False, "Missing required fields", {"response": data})
                    return False
            else:
                self.log_result("Admin Config - GET All", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Admin Config - GET All", False, f"Request error: {str(e)}")
            return False
    
    def test_admin_config_update_single(self):
        """Test PUT /api/admin/config - Update single field"""
        try:
            payload = {"premium_monthly_price": 11.99}
            response = self.session.put(f"{BACKEND_URL}/admin/config", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("premium_monthly_price") == 11.99:
                    self.log_result("Admin Config - UPDATE Single", True, "Single field updated successfully")
                    return True
                else:
                    self.log_result("Admin Config - UPDATE Single", False, f"Update failed, got {data.get('premium_monthly_price')}", {"response": data})
                    return False
            else:
                self.log_result("Admin Config - UPDATE Single", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Admin Config - UPDATE Single", False, f"Request error: {str(e)}")
            return False
    
    def test_admin_config_update_multiple(self):
        """Test PUT /api/admin/config - Update multiple fields"""
        try:
            payload = {
                "premium_monthly_price": 14.99,
                "max_free_scans": 10
            }
            response = self.session.put(f"{BACKEND_URL}/admin/config", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("premium_monthly_price") == 14.99 and 
                    data.get("max_free_scans") == 10):
                    self.log_result("Admin Config - UPDATE Multiple", True, "Multiple fields updated successfully")
                    return True
                else:
                    self.log_result("Admin Config - UPDATE Multiple", False, "Multiple field update failed", {"response": data})
                    return False
            else:
                self.log_result("Admin Config - UPDATE Multiple", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Admin Config - UPDATE Multiple", False, f"Request error: {str(e)}")
            return False
    
    def test_admin_config_get_single_value(self):
        """Test GET /api/admin/config/{key} - Get single configuration value"""
        try:
            # Test existing key
            response = self.session.get(f"{BACKEND_URL}/admin/config/premium_monthly_price")
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("key") == "premium_monthly_price" and 
                    "value" in data):
                    self.log_result("Admin Config - GET Single Value", True, f"Retrieved single value: {data['value']}")
                    
                    # Test another key
                    response2 = self.session.get(f"{BACKEND_URL}/admin/config/openai_model")
                    if response2.status_code == 200:
                        data2 = response2.json()
                        if data2.get("key") == "openai_model" and data2.get("value") == "gpt-4o-mini":
                            self.log_result("Admin Config - GET Single Value (openai_model)", True, "Retrieved openai_model correctly")
                        else:
                            self.log_result("Admin Config - GET Single Value (openai_model)", False, "openai_model retrieval failed", {"response": data2})
                    
                    return True
                else:
                    self.log_result("Admin Config - GET Single Value", False, "Invalid response format", {"response": data})
                    return False
            else:
                self.log_result("Admin Config - GET Single Value", False, f"HTTP {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Admin Config - GET Single Value", False, f"Request error: {str(e)}")
            return False
    
    def test_admin_config_get_nonexistent_key(self):
        """Test GET /api/admin/config/{key} - Non-existent key should return 404"""
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/config/nonexistent_key")
            
            if response.status_code == 404:
                data = response.json()
                if "not found" in data.get("detail", "").lower():
                    self.log_result("Admin Config - GET Nonexistent Key", True, "Correctly returns 404 for non-existent key")
                    return True
                else:
                    self.log_result("Admin Config - GET Nonexistent Key", False, "404 returned but unexpected error message", {"response": data})
                    return False
            else:
                self.log_result("Admin Config - GET Nonexistent Key", False, f"Expected 404, got {response.status_code}", {"response": response.text})
                return False
        except Exception as e:
            self.log_result("Admin Config - GET Nonexistent Key", False, f"Request error: {str(e)}")
            return False

    def test_gamification_setup(self):
        """Setup test data for gamification tests"""
        print("\n=== Setting up Gamification Test Data ===")
        
        # Create a test user and child for gamification
        import uuid
        self.test_user_email = f"gamification_test_{uuid.uuid4().hex[:8]}@nutrikids.test"
        
        # Register test user
        user_data = {
            "email": self.test_user_email,
            "password": "testpass123",
            "name": "Gamification Test Parent"
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/register", json=user_data)
            if response.status_code == 201:
                self.log_result("Gamification Setup - User Registration", True, f"Created user: {self.test_user_email}")
            elif response.status_code == 400 and "already registered" in response.text:
                self.log_result("Gamification Setup - User Registration", True, "User already exists - continuing")
            else:
                self.log_result("Gamification Setup - User Registration", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_result("Gamification Setup - User Registration", False, f"Exception: {str(e)}")
            return None
            
        # Create test child
        child_data = {
            "parent_email": self.test_user_email,
            "name": "Marco Rossi",
            "age": 8,
            "allergies": ["lattosio"]
        }
        
        try:
            response = self.session.post(f"{BACKEND_URL}/children", json=child_data)
            if response.status_code == 200:
                child_info = response.json()
                self.test_child_id = child_info["id"]
                self.created_children.append(self.test_child_id)
                self.log_result("Gamification Setup - Child Creation", True, f"Created child: {child_info['name']} (ID: {self.test_child_id})")
                return self.test_child_id
            else:
                self.log_result("Gamification Setup - Child Creation", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_result("Gamification Setup - Child Creation", False, f"Exception: {str(e)}")
            return None

    def test_gamification_award_points_basic(self):
        """Test gamification - Basic point assignment (10 points for diary)"""
        if not hasattr(self, 'test_child_id') or not self.test_child_id:
            self.log_result("Gamification - Basic Points", False, "No test child available")
            return False
            
        try:
            request_data = {"points": 10}
            response = self.session.post(
                f"{BACKEND_URL}/children/{self.test_child_id}/award-points",
                json=request_data
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["child_id", "points", "level", "level_up", "new_badges"]
                
                # Check response structure
                missing_fields = [field for field in expected_fields if field not in data]
                if missing_fields:
                    self.log_result("Gamification - Basic Points", False, f"Missing fields: {missing_fields}")
                    return False
                
                # Validate values
                if (data["child_id"] == self.test_child_id and 
                    data["points"] == 10 and 
                    data["level"] == 1 and 
                    data["level_up"] == False):
                    self.log_result("Gamification - Basic Points", True, f"Points: {data['points']}, Level: {data['level']}")
                    return True
                else:
                    self.log_result("Gamification - Basic Points", False, f"Invalid values: {data}")
                    return False
            else:
                self.log_result("Gamification - Basic Points", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Gamification - Basic Points", False, f"Exception: {str(e)}")
            return False

    def test_gamification_award_points_scanner(self):
        """Test gamification - Scanner point assignment (5 points)"""
        if not hasattr(self, 'test_child_id') or not self.test_child_id:
            self.log_result("Gamification - Scanner Points", False, "No test child available")
            return False
            
        try:
            request_data = {"points": 5}
            response = self.session.post(
                f"{BACKEND_URL}/children/{self.test_child_id}/award-points",
                json=request_data
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Should now have 15 points total (10 + 5)
                if data["points"] == 15 and data["level"] == 1:
                    self.log_result("Gamification - Scanner Points", True, f"Cumulative points: {data['points']}, Level: {data['level']}")
                    return True
                else:
                    self.log_result("Gamification - Scanner Points", False, f"Wrong cumulative points: {data['points']}, expected 15")
                    return False
            else:
                self.log_result("Gamification - Scanner Points", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Gamification - Scanner Points", False, f"Exception: {str(e)}")
            return False

    def test_gamification_level_up(self):
        """Test gamification - Level up functionality (reach 100 points)"""
        if not hasattr(self, 'test_child_id') or not self.test_child_id:
            self.log_result("Gamification - Level Up", False, "No test child available")
            return False
            
        try:
            # Award 85 more points to reach 100 total (15 + 85 = 100)
            request_data = {"points": 85}
            response = self.session.post(
                f"{BACKEND_URL}/children/{self.test_child_id}/award-points",
                json=request_data
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Should now have 100 points and level 2
                if (data["points"] == 100 and 
                    data["level"] == 2 and 
                    data["level_up"] == True):
                    self.log_result("Gamification - Level Up", True, f"Points: {data['points']}, Level: {data['level']}, Level Up: {data['level_up']}")
                    return True
                else:
                    self.log_result("Gamification - Level Up", False, f"Level up failed: {data}")
                    return False
            else:
                self.log_result("Gamification - Level Up", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Gamification - Level Up", False, f"Exception: {str(e)}")
            return False

    def test_gamification_badge_first_century(self):
        """Test gamification - Badge system (first_century at 100 points)"""
        if not hasattr(self, 'test_user_email') or not self.test_user_email:
            self.log_result("Gamification - First Century Badge", False, "No test user available")
            return False
            
        try:
            # Get current child data to check badges
            response = self.session.get(f"{BACKEND_URL}/children/{self.test_user_email}")
            
            if response.status_code == 200:
                children = response.json()
                child = next((c for c in children if c["id"] == self.test_child_id), None)
                
                if not child:
                    self.log_result("Gamification - First Century Badge", False, "Child not found in children list")
                    return False
                
                badges = child.get("badges", [])
                
                if "first_century" in badges:
                    self.log_result("Gamification - First Century Badge", True, f"first_century badge awarded. All badges: {badges}")
                    return True
                else:
                    self.log_result("Gamification - First Century Badge", False, f"Missing first_century badge. Current badges: {badges}")
                    return False
            else:
                self.log_result("Gamification - First Century Badge", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Gamification - First Century Badge", False, f"Exception: {str(e)}")
            return False

    def test_gamification_validation_negative_points(self):
        """Test gamification - Validation: negative points should fail"""
        if not hasattr(self, 'test_child_id') or not self.test_child_id:
            self.log_result("Gamification - Negative Points Validation", False, "No test child available")
            return False
            
        try:
            request_data = {"points": -5}
            response = self.session.post(
                f"{BACKEND_URL}/children/{self.test_child_id}/award-points",
                json=request_data
            )
            
            # Should fail with 422 (validation error)
            if response.status_code == 422:
                self.log_result("Gamification - Negative Points Validation", True, "Correctly rejected negative points")
                return True
            else:
                self.log_result("Gamification - Negative Points Validation", False, f"Should have failed with 422, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Gamification - Negative Points Validation", False, f"Exception: {str(e)}")
            return False

    def test_gamification_validation_zero_points(self):
        """Test gamification - Validation: zero points should fail"""
        if not hasattr(self, 'test_child_id') or not self.test_child_id:
            self.log_result("Gamification - Zero Points Validation", False, "No test child available")
            return False
            
        try:
            request_data = {"points": 0}
            response = self.session.post(
                f"{BACKEND_URL}/children/{self.test_child_id}/award-points",
                json=request_data
            )
            
            # Should fail with 422 (validation error)
            if response.status_code == 422:
                self.log_result("Gamification - Zero Points Validation", True, "Correctly rejected zero points")
                return True
            else:
                self.log_result("Gamification - Zero Points Validation", False, f"Should have failed with 422, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Gamification - Zero Points Validation", False, f"Exception: {str(e)}")
            return False

    def test_gamification_validation_nonexistent_child(self):
        """Test gamification - Validation: non-existent child should return 404"""
        try:
            import uuid
            fake_child_id = str(uuid.uuid4())
            request_data = {"points": 10}
            response = self.session.post(
                f"{BACKEND_URL}/children/{fake_child_id}/award-points",
                json=request_data
            )
            
            # Should fail with 404
            if response.status_code == 404:
                self.log_result("Gamification - Non-existent Child Validation", True, "Correctly returned 404 for non-existent child")
                return True
            else:
                self.log_result("Gamification - Non-existent Child Validation", False, f"Should have failed with 404, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Gamification - Non-existent Child Validation", False, f"Exception: {str(e)}")
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
        
        # Test 9: Admin Configuration Tests
        print("\n=== Testing Admin Configuration Endpoints ===")
        self.test_admin_config_get()
        self.test_admin_config_update_single()
        self.test_admin_config_update_multiple()
        self.test_admin_config_get_single_value()
        self.test_admin_config_get_nonexistent_key()
        
        # Test 10: Error Cases
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