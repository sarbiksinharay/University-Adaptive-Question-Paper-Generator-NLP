/**
 * ragGenerator.js - RAG (Retrieval-Augmented Generation) Pipeline
 * 
 * 1. Takes a user query/prompt
 * 2. Retrieves relevant past questions from vector store
 * 3. Builds a context-enriched prompt
 * 4. Calls the LLM to generate new questions
 * 5. Returns formatted output
 */

const { getVectorStore } = require('./vectorStore');
const { callLLM } = require('./llmBridge');

/**
 * Generate a question paper using RAG
 * @param {object} params - Generation parameters
 * @param {string} params.prompt - User's generation prompt
 * @param {number} params.marksDivision - Total marks (5-100)
 * @param {string} params.questionDivision - Question structure
 * @param {string} params.courseCode - Course code
 * @param {string} params.subject - Subject name
 * @param {string} params.department - Department
 * @param {string} params.course - Course/program
 * @param {string} params.difficulty - Easy/Medium/Hard
 * @param {number} params.topK - Number of context chunks to retrieve
 * @returns {Promise<object>} - Generated question paper
 */
async function generateWithRAG(params) {
  const {
    prompt,
    marksDivision = 75,
    questionDivision = '',
    courseCode = '',
    subject = '',
    department = '',
    course = '',
    difficulty = 'Medium',
    topK = 10,
  } = params;

  // Step 1: Retrieve relevant context from vector store
  const store = getVectorStore();
  const searchQuery = [subject, course, prompt, department].filter(Boolean).join(' ');
  const relevantChunks = store.search(searchQuery, topK);
  
  const contextText = relevantChunks.length > 0
    ? relevantChunks.map((c, i) => `--- Past Paper Excerpt ${i + 1} (Relevance: ${(c.score * 100).toFixed(1)}%) ---\n${c.text}`).join('\n\n')
    : 'No past papers found in the knowledge base. Generate questions based on general knowledge of the subject.';

  // Step 2: Build system prompt
  const systemPrompt = `You are an expert university professor and question paper designer. Your task is to generate high-quality examination question papers.

You MUST return your response as a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "university": "University Name",
  "courseCode": "${courseCode || 'CODE-XXX'}",
  "subject": "${subject || 'Subject Name'}",
  "department": "${department || 'Department'}",
  "course": "${course || 'Course'}",
  "semester": "Semester",
  "year": "${new Date().getFullYear()}",
  "duration": "3 Hours",
  "maxMarks": ${marksDivision},
  "difficulty": "${difficulty}",
  "instructions": ["instruction1", "instruction2"],
  "sections": [
    {
      "name": "Section A",
      "subtitle": "Short Answer Questions",
      "instructions": "Attempt ALL questions.",
      "totalMarks": 20,
      "questions": [
        { "number": 1, "text": "Question text here", "marks": 2 }
      ]
    }
  ]
}

IMPORTANT RULES:
- Total of all section marks MUST equal ${marksDivision}
- Difficulty level: ${difficulty}
- ${questionDivision ? `Question division: ${questionDivision}` : 'Create appropriate sections with varying mark values'}
- Questions should be academically rigorous and exam-appropriate
- Reference patterns from the provided past papers when available
- Return ONLY the JSON object, no additional text`;

  // Step 3: Build user prompt with context
  const userPrompt = `Generate a question paper based on the following:

**Subject:** ${subject || 'Not specified'}
**Course:** ${course || 'Not specified'} (${courseCode || 'No code'})
**Department:** ${department || 'Not specified'}
**Total Marks:** ${marksDivision}
**Difficulty:** ${difficulty}
**Additional Instructions:** ${prompt || 'None'}
${questionDivision ? `**Question Division:** ${questionDivision}` : ''}

--- PAST PAPER CONTEXT (for reference) ---
${contextText}
--- END CONTEXT ---

Please generate the complete question paper as a JSON object.`;

  // Step 4: Call LLM
  const llmResponse = await callLLM(systemPrompt, userPrompt);
  
  // Step 5: Parse response
  let paper;
  try {
    // Clean up response - remove markdown code fences if present
    let cleaned = llmResponse.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
    if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
    if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
    cleaned = cleaned.trim();
    
    paper = JSON.parse(cleaned);
  } catch (parseErr) {
    // If parsing fails, return a structured error with the raw response
    paper = {
      university: 'University',
      courseCode: courseCode || 'N/A',
      subject: subject || 'N/A',
      department: department || 'N/A',
      course: course || 'N/A',
      maxMarks: marksDivision,
      difficulty: difficulty,
      rawResponse: llmResponse,
      parseError: 'LLM response was not valid JSON. Raw response included.',
      sections: [],
    };
  }

  // Add metadata
  paper.generatedAt = new Date().toISOString();
  paper.aiModel = 'QuestionCraft AI (RAG)';
  paper.ragContext = {
    chunksRetrieved: relevantChunks.length,
    topRelevanceScore: relevantChunks.length > 0 ? relevantChunks[0].score : 0,
    storeStats: store.getStats(),
  };

  return paper;
}

module.exports = { generateWithRAG };
