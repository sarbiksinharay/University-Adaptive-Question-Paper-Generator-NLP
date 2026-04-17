#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Enterprise-grade document ingestion pipeline, local Vector DB, and RAG generation for AI Question Paper Generator"

backend:
  - task: "GET /api/health - Health check"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false

  - task: "POST /api/ingest/upload - File upload ingestion (PDF, DOCX, CSV, PNG)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Accepts multipart/form-data file upload. Extracts text using pdf-parse, mammoth, papaparse, tesseract.js. Auto-chunks and adds to TF-IDF vector store."

  - task: "POST /api/ingest/directory - Directory scan ingestion"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Accepts directory_path. Scans recursively for supported files. Processes in background with queue."

  - task: "GET /api/ingest/status - Processing queue status"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true

  - task: "POST /api/generate-paper - RAG generation endpoint"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Uses RAG pipeline when vector store has data. Falls back to direct LLM generation. Uses Python bridge with emergentintegrations for LLM calls."

  - task: "POST /api/feedback - Feedback endpoint"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Validates questionId, professorId, isLiked (bool), feedbackReason. Adds to vector store for future RAG."

  - task: "POST /api/vector-store/search - Search vector store"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true

  - task: "GET /api/vector-store/stats - Vector store statistics"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true

  - task: "POST /api/generate - Mock generate (legacy 2s delay)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: true

  - task: "POST /api/inject - JSON injection (developer panel)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "low"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Returns dropdown data for departments, subjects, years, difficulties"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Subjects endpoint working correctly. Returns all required fields (departments, subjects, years, difficulties) with proper data types and content. BCA department has expected subjects."

  - task: "POST /api/generate - Generate question paper with new params: marksDivision, questionDivision, courseCode, freePrompt, theme"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Updated to accept: marksDivision (int 5-100), questionDivision (string), courseCode (string), freePrompt (boolean), theme (string). All included in response."
      - working: true
        agent: "testing"
        comment: "✅ TESTED: All NEW parameters working correctly. Test 1: Structured mode with ALL new fields (marksDivision: 75, questionDivision: '10x2, 5x5, 3x10', courseCode: 'BCA-301', freePrompt: false, theme: 'dark') - all fields returned correctly with 2s delay. Test 2: Free prompt mode (freePrompt: true, marksDivision: 50, theme: 'light') - returns paper data without department/course. Test 3: Validation boundaries (marksDivision: 100) - accepted correctly. All tests passed with proper 2s delay."

  - task: "POST /api/inject - Inject custom JSON for developer testing"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Accepts jsonData in body, validates and returns parsed JSON"
      - working: true
        agent: "testing"
        comment: "✅ TESTED: Inject endpoint working correctly. Handles JSON objects and JSON strings properly. Returns success:true with injected data. Proper error handling for invalid JSON (400 status) and empty body (400 status)."

frontend:
  - task: "Sidebar Control Panel with dropdowns and generate button"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "4 dropdowns (department, subject, year, difficulty), textarea for custom prompt, generate button with glow effect"

  - task: "Question Paper Renderer with printable format"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Renders university header, sections, questions with marks aligned right, print/export buttons"

  - task: "Developer/Tester Panel with JSON injection"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Collapsible panel with JSON textarea and inject button"

  - task: "Loading skeleton and error handling"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "main"
        comment: "Skeleton shimmer animation during 2s loading, error/success notifications"

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Enterprise-grade backend built: document ingestion (upload + directory scan), TF-IDF vector store, RAG generation via Python LLM bridge, feedback endpoint. Base URL: https://question-craft-8.preview.emergentagent.com. New endpoints: POST /api/ingest/upload (multipart file), POST /api/ingest/directory (JSON directory_path), GET /api/ingest/status, POST /api/generate-paper (RAG), POST /api/feedback (JSON: questionId,professorId,isLiked,feedbackReason), GET /api/vector-store/stats, POST /api/vector-store/search (JSON: query,topK), POST /api/vector-store/clear, POST /api/generate (legacy mock). Note: /api/generate-paper calls LLM and may take 10-30s. Set timeout to 90s for testing."
