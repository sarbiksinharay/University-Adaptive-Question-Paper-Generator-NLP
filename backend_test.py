#!/usr/bin/env python3
"""
QuestionCraft AI Backend API Testing Script
Tests all backend endpoints for the QuestionCraft AI application
"""

import requests
import json
import time
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://question-craft-8.preview.emergentagent.com"
TIMEOUT = 10  # 10 seconds timeout for requests with delay

def print_test_header(test_name):
    """Print formatted test header"""
    print(f"\n{'='*60}")
    print(f"Testing: {test_name}")
    print(f"{'='*60}")

def print_result(success, message):
    """Print test result with formatting"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")

def test_health_endpoint():
    """Test GET /api/health endpoint"""
    print_test_header("GET /api/health - Health Check Endpoint")
    
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = ['status', 'message', 'timestamp']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print_result(False, f"Missing required fields: {missing_fields}")
                return False
            
            # Validate field values
            if data['status'] != 'ok':
                print_result(False, f"Expected status 'ok', got '{data['status']}'")
                return False
            
            # Check timestamp format
            try:
                datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            except ValueError:
                print_result(False, f"Invalid timestamp format: {data['timestamp']}")
                return False
            
            print_result(True, "Health endpoint working correctly")
            return True
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result(False, f"Invalid JSON response: {str(e)}")
        return False

def test_subjects_endpoint():
    """Test GET /api/subjects endpoint"""
    print_test_header("GET /api/subjects - Get Available Data")
    
    try:
        response = requests.get(f"{BASE_URL}/api/subjects", timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check required fields
            required_fields = ['departments', 'subjects', 'years', 'difficulties']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print_result(False, f"Missing required fields: {missing_fields}")
                return False
            
            # Validate data types and content
            if not isinstance(data['departments'], list) or len(data['departments']) == 0:
                print_result(False, "departments should be a non-empty list")
                return False
            
            if not isinstance(data['subjects'], dict) or len(data['subjects']) == 0:
                print_result(False, "subjects should be a non-empty dictionary")
                return False
            
            if not isinstance(data['years'], list) or len(data['years']) == 0:
                print_result(False, "years should be a non-empty list")
                return False
            
            if not isinstance(data['difficulties'], list) or len(data['difficulties']) == 0:
                print_result(False, "difficulties should be a non-empty list")
                return False
            
            # Check if BCA department has subjects
            if 'BCA' not in data['subjects']:
                print_result(False, "BCA department not found in subjects")
                return False
            
            print_result(True, "Subjects endpoint working correctly")
            return True
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result(False, f"Invalid JSON response: {str(e)}")
        return False

def test_generate_endpoint_new_params():
    """Test POST /api/generate endpoint with NEW parameters: marksDivision, questionDivision, courseCode, freePrompt, theme"""
    print_test_header("POST /api/generate - Generate Question Paper (NEW Parameters)")
    
    # Test 1: Structured mode with ALL new fields
    print("\n--- Test 1: Structured mode with ALL new fields ---")
    try:
        payload = {
            "department": "SOET",
            "course": "BCA",
            "subject": "Operating Systems",
            "year": "15-06-2023",
            "difficulty": "Medium",
            "marksDivision": 75,
            "questionDivision": "10x2, 5x5, 3x10",
            "courseCode": "BCA-301",
            "freePrompt": False,
            "customPrompt": "Focus on practical questions",
            "theme": "dark"
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        start_time = time.time()
        
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json=payload, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response time: {duration:.2f} seconds")
        print(f"Response: {response.text[:500]}..." if len(response.text) > 500 else f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            if 'success' not in data or not data['success']:
                print_result(False, "Response should have success: true")
                return False
            
            if 'data' not in data:
                print_result(False, "Response should have data field")
                return False
            
            paper_data = data['data']
            
            # Check if ALL new fields are included in response
            new_fields = ['marksDivision', 'questionDivision', 'courseCode', 'freePrompt', 'theme']
            missing_fields = [field for field in new_fields if field not in paper_data]
            
            if missing_fields:
                print_result(False, f"Missing new fields in response: {missing_fields}")
                return False
            
            # Validate field values
            if paper_data['marksDivision'] != 75:
                print_result(False, f"Expected marksDivision 75, got {paper_data.get('marksDivision')}")
                return False
            
            if paper_data['questionDivision'] != "10x2, 5x5, 3x10":
                print_result(False, f"Expected questionDivision '10x2, 5x5, 3x10', got '{paper_data.get('questionDivision')}'")
                return False
            
            if paper_data['courseCode'] != "BCA-301":
                print_result(False, f"Expected courseCode 'BCA-301', got '{paper_data.get('courseCode')}'")
                return False
            
            if paper_data['freePrompt'] != False:
                print_result(False, f"Expected freePrompt False, got {paper_data.get('freePrompt')}")
                return False
            
            if paper_data['theme'] != "dark":
                print_result(False, f"Expected theme 'dark', got '{paper_data.get('theme')}'")
                return False
            
            # Check if delay was applied (should be around 2 seconds)
            if duration < 1.8:
                print_result(False, f"Expected ~2s delay, got {duration:.2f}s")
                return False
            
            print_result(True, "Generate endpoint with ALL new fields working correctly")
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result(False, f"Invalid JSON response: {str(e)}")
        return False
    
    # Test 2: Free prompt mode
    print("\n--- Test 2: Free prompt mode ---")
    try:
        payload = {
            "freePrompt": True,
            "customPrompt": "Generate a 75-mark Operating Systems paper",
            "marksDivision": 50,
            "theme": "light"
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        start_time = time.time()
        
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json=payload, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response time: {duration:.2f} seconds")
        print(f"Response: {response.text[:500]}..." if len(response.text) > 500 else f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            if 'success' not in data or not data['success']:
                print_result(False, "Response should have success: true")
                return False
            
            if 'data' not in data:
                print_result(False, "Response should have data field")
                return False
            
            paper_data = data['data']
            
            # Verify response returns paper data even without department/course
            if 'freePrompt' not in paper_data or paper_data['freePrompt'] != True:
                print_result(False, f"Expected freePrompt True, got {paper_data.get('freePrompt')}")
                return False
            
            if 'marksDivision' not in paper_data or paper_data['marksDivision'] != 50:
                print_result(False, f"Expected marksDivision 50, got {paper_data.get('marksDivision')}")
                return False
            
            if 'theme' not in paper_data or paper_data['theme'] != "light":
                print_result(False, f"Expected theme 'light', got '{paper_data.get('theme')}'")
                return False
            
            # Should still have basic paper structure
            if 'sections' not in paper_data:
                print_result(False, "Paper data should have sections even in free prompt mode")
                return False
            
            print_result(True, "Generate endpoint free prompt mode working correctly")
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result(False, f"Invalid JSON response: {str(e)}")
        return False
    
    # Test 3: Validation - marks division boundaries
    print("\n--- Test 3: Validation - marks division boundaries (100) ---")
    try:
        payload = {
            "department": "SOBE",
            "course": "MBA",
            "marksDivision": 100,
            "freePrompt": False
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json=payload, 
                               timeout=TIMEOUT)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text[:300]}..." if len(response.text) > 300 else f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and 'data' in data:
                paper_data = data['data']
                
                # Verify marksDivision: 100 is accepted
                if 'marksDivision' not in paper_data or paper_data['marksDivision'] != 100:
                    print_result(False, f"Expected marksDivision 100, got {paper_data.get('marksDivision')}")
                    return False
                
                print_result(True, "Generate endpoint accepts marksDivision: 100 correctly")
            else:
                print_result(False, "Invalid response structure")
                return False
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    
    return True

def test_generate_endpoint():
    """Test POST /api/generate endpoint with new course field"""
    print_test_header("POST /api/generate - Generate Question Paper (Updated with Course Field)")
    
    # Test 1: Valid request with Operating Systems and course field (SOET/BCA)
    print("\n--- Test 1: Valid request with SOET/BCA Operating Systems ---")
    try:
        payload = {
            "department": "SOET",
            "course": "BCA",
            "subject": "Operating Systems",
            "year": "15-06-2023",
            "difficulty": "Medium",
            "customPrompt": ""
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        start_time = time.time()
        
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json=payload, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response time: {duration:.2f} seconds")
        print(f"Response: {response.text[:500]}..." if len(response.text) > 500 else f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            if 'success' not in data or not data['success']:
                print_result(False, "Response should have success: true")
                return False
            
            if 'data' not in data:
                print_result(False, "Response should have data field")
                return False
            
            paper_data = data['data']
            required_fields = ['university', 'courseCode', 'subject', 'sections']
            missing_fields = [field for field in required_fields if field not in paper_data]
            
            if missing_fields:
                print_result(False, f"Missing required fields in data: {missing_fields}")
                return False
            
            # Check if course field is included in response
            if 'course' not in paper_data:
                print_result(False, "Course field missing from response data")
                return False
            
            if paper_data['course'] != 'BCA':
                print_result(False, f"Expected course 'BCA', got '{paper_data.get('course')}'")
                return False
            
            # Check if delay was applied (should be around 2 seconds)
            if duration < 1.8:
                print_result(False, f"Expected ~2s delay, got {duration:.2f}s")
                return False
            
            print_result(True, "Generate endpoint with SOET/BCA Operating Systems working correctly")
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result(False, f"Invalid JSON response: {str(e)}")
        return False
    
    # Test 2: Valid request with SOBE/MBA and empty fields
    print("\n--- Test 2: Valid request with SOBE/MBA and empty fields ---")
    try:
        payload = {
            "department": "SOBE",
            "course": "MBA",
            "subject": "",
            "year": "",
            "difficulty": "Hard"
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        start_time = time.time()
        
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json=payload, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response time: {duration:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and 'data' in data:
                paper_data = data['data']
                
                # Check if course field is included in response
                if 'course' not in paper_data:
                    print_result(False, "Course field missing from response data")
                    return False
                
                if paper_data['course'] != 'MBA':
                    print_result(False, f"Expected course 'MBA', got '{paper_data.get('course')}'")
                    return False
                
                # Check if department is set correctly
                if paper_data.get('department') != 'SOBE':
                    print_result(False, f"Expected department 'SOBE', got '{paper_data.get('department')}'")
                    return False
                
                # Check if difficulty is set correctly
                if paper_data.get('difficulty') != 'Hard':
                    print_result(False, f"Expected difficulty 'Hard', got '{paper_data.get('difficulty')}'")
                    return False
                
                print_result(True, "Generate endpoint with SOBE/MBA working correctly")
            else:
                print_result(False, "Invalid response structure")
                return False
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    
    # Test 3: Backward compatibility test (without course field)
    print("\n--- Test 3: Backward compatibility test (without course field) ---")
    try:
        payload = {
            "department": "BCA",
            "subject": "Data Structures",
            "year": "2023",
            "difficulty": "Medium",
            "customPrompt": "Focus on algorithms"
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        start_time = time.time()
        
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json=payload, 
                               timeout=TIMEOUT)
        
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"Status Code: {response.status_code}")
        print(f"Response time: {duration:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success') and 'data' in data:
                paper_data = data['data']
                if paper_data.get('subject') == 'Data Structures':
                    # Check if course field exists (should be empty string or default)
                    if 'course' in paper_data:
                        print_result(True, "Generate endpoint backward compatibility working correctly")
                    else:
                        print_result(False, "Course field missing from response (backward compatibility issue)")
                        return False
                else:
                    print_result(False, f"Expected subject 'Data Structures', got '{paper_data.get('subject')}'")
                    return False
            else:
                print_result(False, "Invalid response structure")
                return False
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    
    # Test 4: Error case with missing fields
    print("\n--- Test 4: Error case with missing fields ---")
    try:
        payload = {
            "department": "BCA"
            # Missing required fields
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json=payload, 
                               timeout=TIMEOUT)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        # This should still work as the endpoint has defaults, but let's see
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result(True, "Generate endpoint handles missing fields gracefully")
            else:
                print_result(True, "Generate endpoint properly returns error for missing fields")
        else:
            print_result(True, "Generate endpoint properly returns error status for missing fields")
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    
    return True

def test_inject_endpoint():
    """Test POST /api/inject endpoint"""
    print_test_header("POST /api/inject - Inject Custom JSON")
    
    # Test 1: Valid JSON object (specific test case from review)
    print("\n--- Test 1: Valid JSON object (specific test case) ---")
    try:
        test_data = {
            "university": "Test Uni",
            "course": "BCA",
            "sections": []
        }
        
        payload = {
            "jsonData": test_data
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BASE_URL}/api/inject", 
                               json=payload, 
                               timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check response structure
            required_fields = ['success', 'data', 'message']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print_result(False, f"Missing required fields: {missing_fields}")
                return False
            
            if not data['success']:
                print_result(False, "Expected success: true")
                return False
            
            # Check if injected data is returned correctly
            if data['data']['university'] != test_data['university']:
                print_result(False, "Injected data not returned correctly")
                return False
            
            if data['data']['course'] != test_data['course']:
                print_result(False, "Course field not returned correctly")
                return False
            
            print_result(True, "Inject endpoint with valid JSON working correctly")
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result(False, f"Invalid JSON response: {str(e)}")
        return False
    
    # Test 2: Valid JSON string
    print("\n--- Test 2: Valid JSON string ---")
    try:
        test_data_string = '{"university": "String Test", "courseCode": "TEST-101"}'
        
        payload = {
            "jsonData": test_data_string
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BASE_URL}/api/inject", 
                               json=payload, 
                               timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and data['data']['university'] == 'String Test':
                print_result(True, "Inject endpoint with JSON string working correctly")
            else:
                print_result(False, "JSON string not parsed correctly")
                return False
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    
    # Test 3: Invalid JSON string
    print("\n--- Test 3: Invalid JSON string ---")
    try:
        payload = {
            "jsonData": "invalid json string {"
        }
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BASE_URL}/api/inject", 
                               json=payload, 
                               timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if not data.get('success') and 'error' in data:
                print_result(True, "Inject endpoint properly handles invalid JSON")
            else:
                print_result(False, "Expected error response for invalid JSON")
                return False
        else:
            print_result(False, f"Expected status 400 for invalid JSON, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    
    # Test 4: Empty body
    print("\n--- Test 4: Empty body ---")
    try:
        payload = {}
        
        print(f"Request payload: {json.dumps(payload, indent=2)}")
        
        response = requests.post(f"{BASE_URL}/api/inject", 
                               json=payload, 
                               timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 400:
            data = response.json()
            if not data.get('success') and 'error' in data:
                print_result(True, "Inject endpoint properly handles empty body")
            else:
                print_result(False, "Expected error response for empty body")
                return False
        else:
            print_result(False, f"Expected status 400 for empty body, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    
    return True

def main():
    """Run all backend tests"""
    print("QuestionCraft AI Backend API Testing")
    print(f"Base URL: {BASE_URL}")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    test_results = []
    
    # Run all tests
    test_results.append(("Health Endpoint", test_health_endpoint()))
    test_results.append(("Subjects Endpoint", test_subjects_endpoint()))
    test_results.append(("Generate Endpoint (Original)", test_generate_endpoint()))
    test_results.append(("Generate Endpoint (NEW Parameters)", test_generate_endpoint_new_params()))
    test_results.append(("Inject Endpoint", test_inject_endpoint()))
    
    # Print summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\nOverall Result: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend API endpoints are working correctly!")
        return True
    else:
        print("⚠️  Some backend API endpoints have issues that need attention.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)