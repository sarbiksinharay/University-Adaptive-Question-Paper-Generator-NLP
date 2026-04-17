import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import pathModule from 'path';

// Next.js route config
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ============================================================
// Lazy-loaded service imports (server-side only)
// ============================================================
let _extractor = null;
let _queue = null;
let _vectorStore = null;
let _rag = null;
let _llm = null;

function getExtractor() {
  if (!_extractor) _extractor = require('../../../lib/services/extractor');
  return _extractor;
}
function getQueue() {
  if (!_queue) _queue = require('../../../lib/services/queue');
  return _queue;
}
function getVectorStoreModule() {
  if (!_vectorStore) _vectorStore = require('../../../lib/services/vectorStore');
  return _vectorStore;
}
function getRAG() {
  if (!_rag) _rag = require('../../../lib/services/ragGenerator');
  return _rag;
}
function getLLMBridge() {
  if (!_llm) _llm = require('../../../lib/services/llmBridge');
  return _llm;
}

const UPLOAD_DIR = pathModule.join(process.cwd(), 'local_storage', 'uploads');

// ============================================================
// Mock Question Paper Data (fallback when no RAG context)
// ============================================================
const MOCK_PAPER = {
  university: 'National University of Technology',
  courseCode: 'BCA-301',
  subject: 'Operating Systems',
  department: 'BCA',
  semester: 'V',
  year: '2023',
  duration: '3 Hours',
  maxMarks: 75,
  instructions: [
    'Attempt all sections as directed.',
    'Figures to the right indicate full marks.',
    'Assume suitable data wherever necessary.',
  ],
  sections: [
    {
      name: 'Section A', subtitle: 'Short Answer Questions',
      instructions: 'Attempt ALL questions. Each carries 2 marks.', totalMarks: 20,
      questions: [
        { number: 1, text: 'Define an operating system and list its primary functions.', marks: 2 },
        { number: 2, text: 'What is the difference between a process and a thread?', marks: 2 },
        { number: 3, text: 'Explain the concept of virtual memory in brief.', marks: 2 },
        { number: 4, text: 'What are semaphores?', marks: 2 },
        { number: 5, text: 'Differentiate between internal and external fragmentation.', marks: 2 },
        { number: 6, text: 'What is a deadlock? State necessary conditions.', marks: 2 },
        { number: 7, text: 'Define thrashing and explain when it occurs.', marks: 2 },
        { number: 8, text: 'What is the role of a file allocation table (FAT)?', marks: 2 },
        { number: 9, text: 'Explain the concept of context switching.', marks: 2 },
        { number: 10, text: 'What is spooling? Give an example.', marks: 2 },
      ],
    },
    {
      name: 'Section B', subtitle: 'Medium Answer Questions',
      instructions: 'Attempt ANY FIVE questions. Each carries 5 marks.', totalMarks: 25,
      questions: [
        { number: 11, text: 'Explain the Process State Diagram with all transitions.', marks: 5 },
        { number: 12, text: 'Compare FCFS, SJF, and Round Robin scheduling algorithms.', marks: 5 },
        { number: 13, text: "Describe the Banker's Algorithm for deadlock avoidance.", marks: 5 },
        { number: 14, text: 'Explain FIFO, LRU, and Optimal page replacement algorithms.', marks: 5 },
        { number: 15, text: 'Explain SCAN and C-SCAN disk scheduling algorithms.', marks: 5 },
      ],
    },
    {
      name: 'Section C', subtitle: 'Long Answer Questions',
      instructions: 'Attempt ANY THREE questions. Each carries 10 marks.', totalMarks: 30,
      questions: [
        { number: 16, text: 'Explain the architecture of a modern OS. Compare monolithic and microkernel.', marks: 10 },
        { number: 17, text: 'Describe paging and segmentation. Solve a page fault calculation problem.', marks: 10 },
        { number: 18, text: 'Explain the Dining Philosophers and Reader-Writer problems with solutions.', marks: 10 },
      ],
    },
  ],
};

// ============================================================
// GET Handler
// ============================================================
export async function GET(request) {
  const { pathname } = new URL(request.url);
  const routePath = pathname.replace('/api', '');

  // Health check
  if (routePath === '/health' || routePath === '/') {
    return NextResponse.json({
      status: 'ok',
      message: 'QuestionCraft AI API is running',
      timestamp: new Date().toISOString(),
      endpoints: {
        'POST /api/ingest/upload': 'Upload a file for ingestion',
        'POST /api/ingest/directory': 'Scan a directory for files',
        'GET /api/ingest/status': 'Get processing queue status',
        'POST /api/generate-paper': 'Generate paper with RAG',
        'POST /api/generate': 'Generate paper (mock fallback)',
        'POST /api/feedback': 'Submit feedback',
        'GET /api/vector-store/stats': 'Get vector store stats',
        'POST /api/vector-store/search': 'Search vector store',
        'POST /api/vector-store/clear': 'Clear vector store',
      },
    });
  }

  // Ingestion queue status
  if (routePath === '/ingest/status') {
    try {
      const queue = getQueue();
      return NextResponse.json({ success: true, data: queue.getQueueStatus() });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // Vector store stats
  if (routePath === '/vector-store/stats') {
    try {
      const mod = getVectorStoreModule();
      const store = mod.getVectorStore();
      return NextResponse.json({ success: true, data: store.getStats() });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // Get available subjects (legacy)
  if (routePath === '/subjects') {
    return NextResponse.json({
      departments: ['BCA', 'MCA', 'B.Tech CS', 'B.Sc IT'],
      subjects: {
        BCA: ['Operating Systems', 'Data Structures', 'Database Management'],
        MCA: ['Advanced OS', 'Design & Analysis of Algorithms', 'Software Engineering'],
      },
      difficulties: ['Easy', 'Medium', 'Hard'],
    });
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}

// ============================================================
// POST Handler
// ============================================================
export async function POST(request) {
  const { pathname } = new URL(request.url);
  const routePath = pathname.replace('/api', '');

  // ===========================================================
  // File Upload (Mode A: multipart/form-data single file)
  // ===========================================================
  if (routePath === '/ingest/upload') {
    try {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided. Use form field "file".' },
          { status: 400 }
        );
      }

      const extractor = getExtractor();
      const fileName = file.name || 'unknown';
      const ext = '.' + fileName.split('.').pop().toLowerCase();

      if (!extractor.SUPPORTED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { success: false, error: `Unsupported file type: ${ext}. Supported: ${extractor.SUPPORTED_EXTENSIONS.join(', ')}` },
          { status: 400 }
        );
      }

      // Save file
      if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = pathModule.join(UPLOAD_DIR, `${Date.now()}_${fileName}`);
      await writeFile(filePath, buffer);

      // Extract and ingest
      const result = await extractor.extractText(filePath);

      if (!result.text || result.text.trim().length < 10) {
        return NextResponse.json({
          success: true,
          warning: 'File uploaded but little/no text extracted.',
          data: { filePath, metadata: result.metadata, textLength: (result.text || '').length },
        });
      }

      const mod = getVectorStoreModule();
      const store = mod.getVectorStore();
      const chunksAdded = store.addDocument(result.text, {
        ...result.metadata,
        sourcePath: filePath,
        uploadedAt: new Date().toISOString(),
      });
      store.buildIndex();

      return NextResponse.json({
        success: true,
        data: {
          fileName,
          filePath,
          textLength: result.text.length,
          chunksAdded,
          metadata: result.metadata,
          storeStats: store.getStats(),
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Upload failed: ' + error.message },
        { status: 500 }
      );
    }
  }

  // ===========================================================
  // Directory Scan (Mode B: scan local directory path)
  // ===========================================================
  if (routePath === '/ingest/directory') {
    try {
      const body = await request.json();
      const { directory_path } = body;

      if (!directory_path) {
        return NextResponse.json(
          { success: false, error: 'Missing required field: directory_path' },
          { status: 400 }
        );
      }

      const extractor = getExtractor();
      const files = extractor.scanDirectory(directory_path);

      if (files.length === 0) {
        return NextResponse.json({
          success: true,
          warning: 'No supported files found in directory.',
          data: { directory: directory_path, filesFound: 0 },
        });
      }

      // Start background processing (non-blocking)
      const queue = getQueue();
      queue.processFiles(files, 10, 100).catch(err => {
        console.error('[Ingest] Background processing error:', err);
      });

      return NextResponse.json({
        success: true,
        message: `Found ${files.length} files. Processing started in background.`,
        data: {
          directory: directory_path,
          filesFound: files.length,
          statusEndpoint: '/api/ingest/status',
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Directory scan failed: ' + error.message },
        { status: 500 }
      );
    }
  }

  // ===========================================================
  // RAG Generation Endpoint
  // ===========================================================
  if (routePath === '/generate-paper') {
    try {
      const body = await request.json();
      const {
        prompt, department, course, subject, courseCode,
        marksDivision, questionDivision, difficulty,
        freePrompt, customPrompt, useRAG = true,
      } = body;

      // Check if vector store has data for RAG
      if (useRAG) {
        const mod = getVectorStoreModule();
        const store = mod.getVectorStore();
        const stats = store.getStats();

        if (stats.totalChunks > 0 && stats.isBuilt) {
          const rag = getRAG();
          const paper = await rag.generateWithRAG({
            prompt: freePrompt ? customPrompt : (prompt || customPrompt || ''),
            marksDivision: marksDivision || 75,
            questionDivision: questionDivision || '',
            courseCode: courseCode || '',
            subject: subject || '',
            department: department || '',
            course: course || '',
            difficulty: difficulty || 'Medium',
            topK: 10,
          });
          return NextResponse.json({ success: true, data: paper, mode: 'rag' });
        }
      }

      // Fallback: Direct LLM generation (no RAG context)
      const llmBridge = getLLMBridge();

      const systemPrompt = `You are an expert university professor. Generate a question paper as a valid JSON object (NO markdown fences) with structure:
{"university":"University Name","courseCode":"${courseCode || 'CODE'}","subject":"${subject || 'Subject'}","department":"${department || 'Dept'}","course":"${course || 'Course'}","semester":"Semester","year":"${new Date().getFullYear()}","duration":"3 Hours","maxMarks":${marksDivision || 75},"difficulty":"${difficulty || 'Medium'}","instructions":["..."],"sections":[{"name":"Section A","subtitle":"...","instructions":"...","totalMarks":20,"questions":[{"number":1,"text":"...","marks":2}]}]}
Total section marks MUST equal ${marksDivision || 75}. Return ONLY the JSON.`;

      const userPrompt = freePrompt
        ? (customPrompt || prompt || 'Generate a general question paper')
        : `Generate a ${marksDivision || 75}-mark ${subject || 'general'} paper for ${course || 'students'}. Difficulty: ${difficulty || 'Medium'}. ${questionDivision ? 'Structure: ' + questionDivision : ''} ${customPrompt || ''}`;

      const llmResponse = await llmBridge.callLLM(systemPrompt, userPrompt);

      let paper;
      try {
        let cleaned = llmResponse.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        paper = JSON.parse(cleaned.trim());
      } catch {
        paper = { rawResponse: llmResponse, parseError: 'Could not parse LLM response as JSON' };
      }

      paper.generatedAt = new Date().toISOString();
      paper.aiModel = 'QuestionCraft AI (Direct LLM)';
      return NextResponse.json({ success: true, data: paper, mode: 'direct-llm' });

    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Generation failed: ' + error.message },
        { status: 500 }
      );
    }
  }

  // ===========================================================
  // Mock Generate (legacy fallback with 2s delay)
  // ===========================================================
  if (routePath === '/generate') {
    try {
      const body = await request.json();
      const { department, course, subject, year, difficulty, customPrompt, marksDivision, questionDivision, courseCode, freePrompt, theme } = body;

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const paper = {
        ...MOCK_PAPER,
        department: department || MOCK_PAPER.department,
        course: course || '',
        year: year || MOCK_PAPER.year,
        subject: subject || MOCK_PAPER.subject,
        difficulty: difficulty || 'Medium',
        marksDivision: marksDivision || 75,
        questionDivision: questionDivision || '',
        courseCode: courseCode || MOCK_PAPER.courseCode,
        freePrompt: freePrompt || false,
        theme: theme || 'dark',
        generatedAt: new Date().toISOString(),
        aiModel: 'QuestionCraft AI v2.1 (Mock)',
        customPrompt: customPrompt || null,
      };

      return NextResponse.json({ success: true, data: paper });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate: ' + error.message },
        { status: 500 }
      );
    }
  }

  // ===========================================================
  // Inject JSON (developer testing)
  // ===========================================================
  if (routePath === '/inject') {
    try {
      const body = await request.json();
      const { jsonData } = body;

      if (!jsonData) {
        return NextResponse.json({ success: false, error: 'No JSON data provided' }, { status: 400 });
      }

      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      return NextResponse.json({ success: true, data: parsed, message: 'JSON injected successfully' });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid JSON: ' + error.message }, { status: 400 });
    }
  }

  // ===========================================================
  // Feedback Endpoint
  // ===========================================================
  if (routePath === '/feedback') {
    try {
      const body = await request.json();
      const { questionId, professorId, isLiked, feedbackReason } = body;

      // Validate
      if (!questionId || typeof questionId !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing/invalid: questionId (string)' }, { status: 400 });
      }
      if (!professorId || typeof professorId !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing/invalid: professorId (string)' }, { status: 400 });
      }
      if (typeof isLiked !== 'boolean') {
        return NextResponse.json({ success: false, error: 'Missing/invalid: isLiked (boolean)' }, { status: 400 });
      }
      if (!feedbackReason || typeof feedbackReason !== 'string') {
        return NextResponse.json({ success: false, error: 'Missing/invalid: feedbackReason (string)' }, { status: 400 });
      }

      const feedback = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        questionId, professorId, isLiked, feedbackReason,
        createdAt: new Date().toISOString(),
      };

      // Add feedback to vector store for future RAG context
      try {
        const mod = getVectorStoreModule();
        const store = mod.getVectorStore();
        store.addDocument(
          `Feedback on question ${questionId}: ${isLiked ? 'LIKED' : 'DISLIKED'}. Reason: ${feedbackReason}`,
          { type: 'feedback', questionId, professorId, isLiked }
        );
      } catch (e) {
        console.error('[Feedback] Could not add to vector store:', e.message);
      }

      return NextResponse.json({
        success: true, data: feedback,
        message: 'Feedback recorded and added to knowledge base.',
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Feedback failed: ' + error.message }, { status: 500 });
    }
  }

  // ===========================================================
  // Vector Store Management
  // ===========================================================
  if (routePath === '/vector-store/clear') {
    try {
      const mod = getVectorStoreModule();
      const store = mod.getVectorStore();
      store.clear();
      return NextResponse.json({ success: true, message: 'Vector store cleared.' });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  if (routePath === '/vector-store/rebuild') {
    try {
      const mod = getVectorStoreModule();
      const store = mod.getVectorStore();
      store.buildIndex();
      return NextResponse.json({ success: true, message: 'Index rebuilt.', data: store.getStats() });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  if (routePath === '/vector-store/search') {
    try {
      const body = await request.json();
      const { query, topK = 5 } = body;

      if (!query) {
        return NextResponse.json({ success: false, error: 'Missing: query' }, { status: 400 });
      }

      const mod = getVectorStoreModule();
      const store = mod.getVectorStore();
      const results = store.search(query, topK);

      return NextResponse.json({
        success: true,
        data: { results, totalResults: results.length, query },
      });
    } catch (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}
