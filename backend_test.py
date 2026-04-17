#!/usr/bin/env python3
"""
QuestionCraft AI Backend API Testing Suite
Tests all enterprise document ingestion and RAG pipeline endpoints
"""

import requests
import json
import time
import tempfile
import os
from io import StringIO

# Configuration
BASE_URL = "https://question-craft-8.preview.emergentagent.com"
TIMEOUT = 90  # 90 seconds for LLM calls
HEADERS = {"Content-Type": "application/json"}

def log_test(test_name, status, details=""):
    """Log test results with consistent formatting"""
    status_symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    print(f"{status_symbol} {test_name}: {status}")
    if details:
        print(f"   Details: {details}")
    print()

def test_health_endpoint():
    """Test GET /api/health - Health check"""
    try:
        response = requests.get(f"{BASE_URL}/api/health", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "ok" and "endpoints" in data:
                log_test("GET /api/health", "PASS", f"Status: {data['status']}, Endpoints listed: {len(data['endpoints'])}")
                return True
            else:
                log_test("GET /api/health", "FAIL", f"Invalid response structure: {data}")
                return False
        else:
            log_test("GET /api/health", "FAIL", f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/health", "FAIL", f"Exception: {str(e)}")
        return False

def test_file_upload():
    """Test POST /api/ingest/upload - File upload ingestion"""
    try:
        # Create a temporary CSV file
        csv_content = """question,marks,subject
What is polymorphism?,5,OOP
Explain inheritance with example,10,OOP
Define encapsulation in programming,8,OOP
What are abstract classes?,6,OOP"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            temp_file_path = f.name
        
        try:
            # Test successful upload
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_questions.csv', f, 'text/csv')}
                response = requests.post(f"{BASE_URL}/api/ingest/upload", files=files, timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("data", {}).get("chunksAdded", 0) > 0:
                    chunks_added = data["data"]["chunksAdded"]
                    text_length = data["data"]["textLength"]
                    log_test("POST /api/ingest/upload (success)", "PASS", 
                           f"Chunks added: {chunks_added}, Text length: {text_length}")
                    upload_success = True
                else:
                    log_test("POST /api/ingest/upload (success)", "FAIL", f"Response: {data}")
                    upload_success = False
            else:
                log_test("POST /api/ingest/upload (success)", "FAIL", 
                       f"Status: {response.status_code}, Response: {response.text}")
                upload_success = False
            
            # Test error case - upload without file
            response = requests.post(f"{BASE_URL}/api/ingest/upload", timeout=TIMEOUT)
            if response.status_code == 400:
                data = response.json()
                if not data.get("success") and "No file provided" in data.get("error", ""):
                    log_test("POST /api/ingest/upload (error case)", "PASS", "Correctly rejected empty upload")
                    error_success = True
                else:
                    log_test("POST /api/ingest/upload (error case)", "FAIL", f"Unexpected error response: {data}")
                    error_success = False
            else:
                log_test("POST /api/ingest/upload (error case)", "FAIL", 
                       f"Expected 400, got {response.status_code}")
                error_success = False
            
            return upload_success and error_success
            
        finally:
            # Clean up temp file
            os.unlink(temp_file_path)
            
    except Exception as e:
        log_test("POST /api/ingest/upload", "FAIL", f"Exception: {str(e)}")
        return False

def test_directory_scan():
    """Test POST /api/ingest/directory - Directory scan ingestion"""
    try:
        # Test with a directory that may or may not exist
        test_data = {"directory_path": "/tmp/test_papers"}
        response = requests.post(f"{BASE_URL}/api/ingest/directory", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success"):
                log_test("POST /api/ingest/directory (valid path)", "PASS", 
                       f"Message: {data.get('message', 'No message')}")
                valid_success = True
            else:
                log_test("POST /api/ingest/directory (valid path)", "FAIL", f"Response: {data}")
                valid_success = False
        else:
            log_test("POST /api/ingest/directory (valid path)", "FAIL", 
                   f"Status: {response.status_code}, Response: {response.text}")
            valid_success = False
        
        # Test error case - empty directory path
        test_data = {"directory_path": ""}
        response = requests.post(f"{BASE_URL}/api/ingest/directory", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and "Missing required field" in data.get("error", ""):
                log_test("POST /api/ingest/directory (empty path)", "PASS", "Correctly rejected empty path")
                empty_success = True
            else:
                log_test("POST /api/ingest/directory (empty path)", "FAIL", f"Unexpected error: {data}")
                empty_success = False
        else:
            log_test("POST /api/ingest/directory (empty path)", "FAIL", 
                   f"Expected 400, got {response.status_code}")
            empty_success = False
        
        # Test error case - missing field
        test_data = {}
        response = requests.post(f"{BASE_URL}/api/ingest/directory", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and "Missing required field" in data.get("error", ""):
                log_test("POST /api/ingest/directory (missing field)", "PASS", "Correctly rejected missing field")
                missing_success = True
            else:
                log_test("POST /api/ingest/directory (missing field)", "FAIL", f"Unexpected error: {data}")
                missing_success = False
        else:
            log_test("POST /api/ingest/directory (missing field)", "FAIL", 
                   f"Expected 400, got {response.status_code}")
            missing_success = False
        
        return valid_success and empty_success and missing_success
        
    except Exception as e:
        log_test("POST /api/ingest/directory", "FAIL", f"Exception: {str(e)}")
        return False

def test_ingest_status():
    """Test GET /api/ingest/status - Queue status"""
    try:
        response = requests.get(f"{BASE_URL}/api/ingest/status", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data:
                queue_data = data["data"]
                log_test("GET /api/ingest/status", "PASS", 
                       f"Queue status retrieved: {queue_data}")
                return True
            else:
                log_test("GET /api/ingest/status", "FAIL", f"Invalid response: {data}")
                return False
        else:
            log_test("GET /api/ingest/status", "FAIL", 
                   f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/ingest/status", "FAIL", f"Exception: {str(e)}")
        return False

def test_generate_paper():
    """Test POST /api/generate-paper - RAG generation (SLOW - 10-30 seconds)"""
    try:
        test_data = {
            "subject": "Data Structures",
            "department": "SOET", 
            "course": "BCA",
            "courseCode": "BCA-201",
            "marksDivision": 50,
            "difficulty": "Easy",
            "useRAG": True
        }
        
        print("⏳ Testing RAG generation (may take 10-30 seconds)...")
        response = requests.post(f"{BASE_URL}/api/generate-paper", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data:
                paper_data = data["data"]
                mode = data.get("mode", "unknown")
                
                # Check if paper has sections with questions
                sections = paper_data.get("sections", [])
                has_questions = any(section.get("questions", []) for section in sections)
                
                if has_questions:
                    log_test("POST /api/generate-paper", "PASS", 
                           f"Mode: {mode}, Sections: {len(sections)}, Generated successfully")
                    return True
                else:
                    log_test("POST /api/generate-paper", "FAIL", 
                           f"No questions found in sections. Mode: {mode}")
                    return False
            else:
                log_test("POST /api/generate-paper", "FAIL", f"Invalid response: {data}")
                return False
        else:
            log_test("POST /api/generate-paper", "FAIL", 
                   f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("POST /api/generate-paper", "FAIL", f"Exception: {str(e)}")
        return False

def test_feedback():
    """Test POST /api/feedback - Feedback endpoint"""
    try:
        # Test successful feedback
        test_data = {
            "questionId": "q123",
            "professorId": "prof456", 
            "isLiked": True,
            "feedbackReason": "Well-structured question"
        }
        
        response = requests.post(f"{BASE_URL}/api/feedback", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data and data["data"].get("id"):
                feedback_id = data["data"]["id"]
                log_test("POST /api/feedback (success)", "PASS", f"Feedback ID: {feedback_id}")
                success_test = True
            else:
                log_test("POST /api/feedback (success)", "FAIL", f"Invalid response: {data}")
                success_test = False
        else:
            log_test("POST /api/feedback (success)", "FAIL", 
                   f"Status: {response.status_code}, Response: {response.text}")
            success_test = False
        
        # Test error case - missing questionId
        test_data = {
            "professorId": "prof456",
            "isLiked": True,
            "feedbackReason": "Test"
        }
        
        response = requests.post(f"{BASE_URL}/api/feedback", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and "questionId" in data.get("error", ""):
                log_test("POST /api/feedback (missing questionId)", "PASS", "Correctly rejected missing questionId")
                missing_id_test = True
            else:
                log_test("POST /api/feedback (missing questionId)", "FAIL", f"Unexpected error: {data}")
                missing_id_test = False
        else:
            log_test("POST /api/feedback (missing questionId)", "FAIL", 
                   f"Expected 400, got {response.status_code}")
            missing_id_test = False
        
        # Test error case - isLiked not boolean
        test_data = {
            "questionId": "q123",
            "professorId": "prof456",
            "isLiked": "yes",  # Should be boolean
            "feedbackReason": "Test"
        }
        
        response = requests.post(f"{BASE_URL}/api/feedback", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and "isLiked" in data.get("error", ""):
                log_test("POST /api/feedback (invalid isLiked)", "PASS", "Correctly rejected non-boolean isLiked")
                boolean_test = True
            else:
                log_test("POST /api/feedback (invalid isLiked)", "FAIL", f"Unexpected error: {data}")
                boolean_test = False
        else:
            log_test("POST /api/feedback (invalid isLiked)", "FAIL", 
                   f"Expected 400, got {response.status_code}")
            boolean_test = False
        
        return success_test and missing_id_test and boolean_test
        
    except Exception as e:
        log_test("POST /api/feedback", "FAIL", f"Exception: {str(e)}")
        return False

def test_vector_store_stats():
    """Test GET /api/vector-store/stats - Vector store statistics"""
    try:
        response = requests.get(f"{BASE_URL}/api/vector-store/stats", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data:
                stats = data["data"]
                required_fields = ["totalChunks", "totalTerms", "isBuilt", "storagePath"]
                has_all_fields = all(field in stats for field in required_fields)
                
                if has_all_fields:
                    log_test("GET /api/vector-store/stats", "PASS", 
                           f"Total chunks: {stats['totalChunks']}, Built: {stats['isBuilt']}")
                    return True
                else:
                    missing = [f for f in required_fields if f not in stats]
                    log_test("GET /api/vector-store/stats", "FAIL", f"Missing fields: {missing}")
                    return False
            else:
                log_test("GET /api/vector-store/stats", "FAIL", f"Invalid response: {data}")
                return False
        else:
            log_test("GET /api/vector-store/stats", "FAIL", 
                   f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("GET /api/vector-store/stats", "FAIL", f"Exception: {str(e)}")
        return False

def test_vector_store_search():
    """Test POST /api/vector-store/search - Search vector store"""
    try:
        # Test successful search
        test_data = {"query": "operating system", "topK": 3}
        response = requests.post(f"{BASE_URL}/api/vector-store/search", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data:
                search_data = data["data"]
                results = search_data.get("results", [])
                log_test("POST /api/vector-store/search (success)", "PASS", 
                       f"Query: '{search_data.get('query')}', Results: {len(results)}")
                success_test = True
            else:
                log_test("POST /api/vector-store/search (success)", "FAIL", f"Invalid response: {data}")
                success_test = False
        else:
            log_test("POST /api/vector-store/search (success)", "FAIL", 
                   f"Status: {response.status_code}, Response: {response.text}")
            success_test = False
        
        # Test error case - missing query
        test_data = {}
        response = requests.post(f"{BASE_URL}/api/vector-store/search", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and "Missing: query" in data.get("error", ""):
                log_test("POST /api/vector-store/search (missing query)", "PASS", "Correctly rejected missing query")
                error_test = True
            else:
                log_test("POST /api/vector-store/search (missing query)", "FAIL", f"Unexpected error: {data}")
                error_test = False
        else:
            log_test("POST /api/vector-store/search (missing query)", "FAIL", 
                   f"Expected 400, got {response.status_code}")
            error_test = False
        
        return success_test and error_test
        
    except Exception as e:
        log_test("POST /api/vector-store/search", "FAIL", f"Exception: {str(e)}")
        return False

def test_legacy_generate():
    """Test POST /api/generate - Legacy mock endpoint"""
    try:
        test_data = {
            "department": "SOET",
            "course": "BCA", 
            "subject": "OS",
            "marksDivision": 75
        }
        
        print("⏳ Testing legacy generate (2s delay)...")
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/api/generate", 
                               json=test_data, timeout=TIMEOUT)
        end_time = time.time()
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data:
                paper_data = data["data"]
                delay = end_time - start_time
                
                # Check if it has the expected 2s delay (allow some tolerance)
                has_delay = delay >= 1.8  # Allow some network latency
                
                log_test("POST /api/generate (legacy)", "PASS", 
                       f"Delay: {delay:.1f}s, Subject: {paper_data.get('subject')}")
                return True
            else:
                log_test("POST /api/generate (legacy)", "FAIL", f"Invalid response: {data}")
                return False
        else:
            log_test("POST /api/generate (legacy)", "FAIL", 
                   f"Status: {response.status_code}, Response: {response.text}")
            return False
            
    except Exception as e:
        log_test("POST /api/generate (legacy)", "FAIL", f"Exception: {str(e)}")
        return False

def test_json_injection():
    """Test POST /api/inject - JSON injection"""
    try:
        # Test successful injection
        test_data = {
            "jsonData": {
                "university": "Test University",
                "sections": []
            }
        }
        
        response = requests.post(f"{BASE_URL}/api/inject", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") and "data" in data:
                injected_data = data["data"]
                log_test("POST /api/inject (success)", "PASS", 
                       f"Injected: {injected_data}")
                success_test = True
            else:
                log_test("POST /api/inject (success)", "FAIL", f"Invalid response: {data}")
                success_test = False
        else:
            log_test("POST /api/inject (success)", "FAIL", 
                   f"Status: {response.status_code}, Response: {response.text}")
            success_test = False
        
        # Test error case - no jsonData
        test_data = {}
        response = requests.post(f"{BASE_URL}/api/inject", 
                               json=test_data, timeout=TIMEOUT)
        
        if response.status_code == 400:
            data = response.json()
            if not data.get("success") and "No JSON data provided" in data.get("error", ""):
                log_test("POST /api/inject (missing data)", "PASS", "Correctly rejected missing jsonData")
                error_test = True
            else:
                log_test("POST /api/inject (missing data)", "FAIL", f"Unexpected error: {data}")
                error_test = False
        else:
            log_test("POST /api/inject (missing data)", "FAIL", 
                   f"Expected 400, got {response.status_code}")
            error_test = False
        
        return success_test and error_test
        
    except Exception as e:
        log_test("POST /api/inject", "FAIL", f"Exception: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 80)
    print("QuestionCraft AI Backend API Testing Suite")
    print(f"Base URL: {BASE_URL}")
    print(f"Timeout: {TIMEOUT}s")
    print("=" * 80)
    print()
    
    # Track test results
    test_results = {}
    
    # Run all tests
    test_results["health"] = test_health_endpoint()
    test_results["upload"] = test_file_upload()
    test_results["directory"] = test_directory_scan()
    test_results["status"] = test_ingest_status()
    test_results["generate_paper"] = test_generate_paper()
    test_results["feedback"] = test_feedback()
    test_results["vector_stats"] = test_vector_store_stats()
    test_results["vector_search"] = test_vector_store_search()
    test_results["legacy_generate"] = test_legacy_generate()
    test_results["inject"] = test_json_injection()
    
    # Summary
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for result in test_results.values() if result)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print()
    print(f"Overall: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("🎉 All backend tests passed!")
        return True
    else:
        print("⚠️  Some tests failed - check details above")
        return False

if __name__ == "__main__":
    main()