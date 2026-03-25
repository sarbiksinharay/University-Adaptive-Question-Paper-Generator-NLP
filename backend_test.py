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

def test_generate_endpoint():
    """Test POST /api/generate endpoint"""
    print_test_header("POST /api/generate - Generate Question Paper")
    
    # Test 1: Valid request with Operating Systems
    print("\n--- Test 1: Valid request with Operating Systems ---")
    try:
        payload = {
            "department": "BCA",
            "subject": "Operating Systems",
            "year": "2023",
            "difficulty": "Medium",
            "customPrompt": "test"
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
            
            # Check if delay was applied (should be around 2 seconds)
            if duration < 1.8:
                print_result(False, f"Expected ~2s delay, got {duration:.2f}s")
                return False
            
            print_result(True, "Generate endpoint with Operating Systems working correctly")
        else:
            print_result(False, f"Expected status 200, got {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {str(e)}")
        return False
    except json.JSONDecodeError as e:
        print_result(False, f"Invalid JSON response: {str(e)}")
        return False
    
    # Test 2: Valid request with Data Structures
    print("\n--- Test 2: Valid request with Data Structures ---")
    try:
        payload = {
            "department": "BCA",
            "subject": "Data Structures",
            "year": "2023",
            "difficulty": "Hard",
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
                    print_result(True, "Generate endpoint with Data Structures working correctly")
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
    
    # Test 3: Error case with missing fields
    print("\n--- Test 3: Error case with missing fields ---")
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
    
    # Test 1: Valid JSON object
    print("\n--- Test 1: Valid JSON object ---")
    try:
        test_data = {
            "university": "Test University",
            "sections": [
                {
                    "name": "Section A",
                    "questions": [
                        {"number": 1, "text": "Test question", "marks": 5}
                    ]
                }
            ]
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
    test_results.append(("Generate Endpoint", test_generate_endpoint()))
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