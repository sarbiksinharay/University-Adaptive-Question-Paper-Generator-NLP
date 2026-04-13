# QuestionCraft AI - Question Paper Generator

An interactive, AI-powered Question Paper Generator dashboard built with Next.js, Tailwind CSS, and shadcn/ui components.

## Features

- **Dark/Light Theme Toggle** - Switch between dark and light modes
- **Structured Input Mode** - Department, Course, Subject, Year, Difficulty, Marks Division, Question Division, Course Code
- **Free Prompt Mode** - Generate papers using natural language descriptions
- **Marks Division Slider** - Set total marks (5-100) with visual slider
- **Question Division** - Configure question structure (e.g., 10x2, 5x5, 3x10)
- **DD-MM-YYYY Date Input** - Auto-formatted date input for exam year
- **Paper Renderer** - Printable question paper preview with sections, questions, and marks
- **Developer Panel** - JSON injection for testing custom paper structures
- **Print & Export** - Print to PDF or export as JSON

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally (optional, for future backend integration)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd questioncraft-ai

# Install dependencies
npm install
# or
yarn install

# Run the application
npm start
# or for development
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=questioncraft
NEXT_PUBLIC_BASE_URL=http://localhost:3000
CORS_ORIGINS=*
```

## Input Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `marksDivision` | integer (5-100) | Total marks for the paper | Yes |
| `questionDivision` | string | Division of questions (e.g., "10x2, 5x5, 3x10") | Yes |
| `courseCode` | string | Course identifier (e.g., "BCA-301") | Yes |
| `freePrompt` | boolean | Toggle for free prompt generation without structured input | Yes |
| `theme` | string | UI theme - "dark" or "light" | Yes |
| `department` | string | School/Department code (e.g., "SOET") | Structured mode |
| `course` | string | Program name (e.g., "BCA") | Structured mode |
| `subject` | string | Subject name (e.g., "Operating Systems") | Optional |
| `year` | string | Exam date in DD-MM-YYYY format | Optional |
| `difficulty` | string | "Easy", "Medium", or "Hard" | Optional |
| `customPrompt` | string | Additional instructions for AI | Optional |

## API Endpoints

### `GET /api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "QuestionCraft AI API is running",
  "timestamp": "2025-06-15T10:30:00.000Z"
}
```

### `GET /api/subjects`
Returns available departments, courses, years, and difficulties.

### `POST /api/generate`
Generate a question paper.

**Request Body (Structured Mode):**
```json
{
  "department": "SOET",
  "course": "BCA",
  "subject": "Operating Systems",
  "year": "15-06-2023",
  "difficulty": "Medium",
  "marksDivision": 75,
  "questionDivision": "10x2, 5x5, 3x10",
  "courseCode": "BCA-301",
  "freePrompt": false,
  "customPrompt": "Focus on practical questions",
  "theme": "dark"
}
```

**Request Body (Free Prompt Mode):**
```json
{
  "freePrompt": true,
  "customPrompt": "Generate a 75-mark Operating Systems paper for BCA 5th semester with 3 sections",
  "marksDivision": 75,
  "theme": "dark"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "university": "National University of Technology",
    "courseCode": "BCA-301",
    "subject": "Operating Systems",
    "department": "SOET",
    "course": "BCA",
    "semester": "V",
    "year": "15-06-2023",
    "duration": "3 Hours",
    "maxMarks": 75,
    "difficulty": "Medium",
    "marksDivision": 75,
    "questionDivision": "10x2, 5x5, 3x10",
    "freePrompt": false,
    "theme": "dark",
    "instructions": [
      "Attempt all sections as directed.",
      "Figures to the right indicate full marks."
    ],
    "sections": [
      {
        "name": "Section A",
        "subtitle": "Short Answer Questions",
        "instructions": "Attempt ALL questions. Each question carries 2 marks.",
        "totalMarks": 20,
        "questions": [
          {
            "number": 1,
            "text": "Define an operating system and list its primary functions.",
            "marks": 2
          }
        ]
      }
    ],
    "generatedAt": "2025-06-15T10:30:02.000Z",
    "aiModel": "QuestionCraft AI v2.1"
  }
}
```

### `POST /api/inject`
Inject custom JSON to render directly (developer testing).

**Request Body:**
```json
{
  "jsonData": {
    "university": "Test University",
    "courseCode": "CS-101",
    "subject": "Data Structures",
    "sections": []
  }
}
```

## Available Departments

| Code | Full Name |
|------|-----------|
| SOBAS | School of Basic & Applied Sciences |
| SOBE | School of Business & Economics |
| SOE | School of Education |
| SOET | School of Engineering & Technology |
| SOHMS | School of Health & Medical Sciences |
| SOLACS | School of Liberal Arts, Commerce & Social Sciences |
| SOLB | School of Life Sciences & Biotechnology |
| SOLJ | School of Law & Justice |
| SOMC | School of Media & Communication |
| SOSA | School of Science & Agriculture |

## Backend Integration Notes

The backend expects a valid JSON structure as shown above. The `POST /api/generate` endpoint currently returns **mock data**. To integrate with a real LLM:

1. Replace the mock response in `/app/api/[[...path]]/route.js`
2. Send the JSON parameters to your LLM endpoint
3. Parse the LLM response into the expected question paper JSON structure
4. The frontend will render any valid paper JSON automatically

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS + shadcn/ui
- **Icons:** Lucide React
- **Database:** MongoDB (configured, ready for integration)
