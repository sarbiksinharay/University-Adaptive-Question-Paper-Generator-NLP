import { NextResponse } from 'next/server';

// ============================================================
// Mock Question Paper Data
// ============================================================
const MOCK_QUESTION_PAPERS = {
  'Operating Systems': {
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
      'Use of scientific calculator is permitted.',
    ],
    sections: [
      {
        name: 'Section A',
        subtitle: 'Short Answer Questions',
        instructions: 'Attempt ALL questions. Each question carries 2 marks.',
        totalMarks: 20,
        questions: [
          { number: 1, text: 'Define an operating system and list its primary functions.', marks: 2 },
          { number: 2, text: 'What is the difference between a process and a thread?', marks: 2 },
          { number: 3, text: 'Explain the concept of virtual memory in brief.', marks: 2 },
          { number: 4, text: 'What are semaphores? How are they used in process synchronization?', marks: 2 },
          { number: 5, text: 'Differentiate between internal and external fragmentation.', marks: 2 },
          { number: 6, text: 'What is a deadlock? State the necessary conditions for deadlock.', marks: 2 },
          { number: 7, text: 'Define thrashing and explain when it occurs.', marks: 2 },
          { number: 8, text: 'What is the role of a file allocation table (FAT)?', marks: 2 },
          { number: 9, text: 'Explain the concept of context switching.', marks: 2 },
          { number: 10, text: 'What is spooling? Give an example.', marks: 2 },
        ],
      },
      {
        name: 'Section B',
        subtitle: 'Medium Answer Questions',
        instructions: 'Attempt ANY FIVE questions. Each question carries 5 marks.',
        totalMarks: 25,
        questions: [
          { number: 11, text: 'Explain the Process State Diagram with all possible transitions. Describe each state in detail.', marks: 5 },
          { number: 12, text: 'Compare and contrast the following CPU scheduling algorithms: FCFS, SJF, and Round Robin. Provide examples.', marks: 5 },
          { number: 13, text: 'Describe the Banker\'s Algorithm for deadlock avoidance with a suitable example.', marks: 5 },
          { number: 14, text: 'Explain the different page replacement algorithms: FIFO, LRU, and Optimal. Which performs best and why?', marks: 5 },
          { number: 15, text: 'What are the different disk scheduling algorithms? Explain SCAN and C-SCAN with examples.', marks: 5 },
          { number: 16, text: 'Discuss the Producer-Consumer problem and provide a solution using semaphores.', marks: 5 },
          { number: 17, text: 'Explain the different memory allocation strategies: First Fit, Best Fit, and Worst Fit.', marks: 5 },
        ],
      },
      {
        name: 'Section C',
        subtitle: 'Long Answer Questions',
        instructions: 'Attempt ANY THREE questions. Each question carries 10 marks.',
        totalMarks: 30,
        questions: [
          { number: 18, text: 'a) Explain the architecture of a modern operating system with a detailed diagram. Discuss the role of each layer.\nb) Compare monolithic kernel and microkernel architectures with advantages and disadvantages of each.', marks: 10 },
          { number: 19, text: 'a) Describe paging and segmentation as memory management techniques. How does a page table work?\nb) Solve the following: Given a system with 4 frames and the reference string 1,2,3,4,1,2,5,1,2,3,4,5, calculate page faults using FIFO and LRU.', marks: 10 },
          { number: 20, text: 'a) Explain the Dining Philosophers Problem. Provide a solution using monitors.\nb) What is the Reader-Writer problem? Discuss a solution that gives priority to readers.', marks: 10 },
          { number: 21, text: 'a) Describe the Unix/Linux file system architecture in detail with inodes, directory structure, and file permissions.\nb) Explain the different file access methods and file organization techniques used in operating systems.', marks: 10 },
        ],
      },
    ],
  },
  'Data Structures': {
    university: 'National University of Technology',
    courseCode: 'BCA-201',
    subject: 'Data Structures',
    department: 'BCA',
    semester: 'III',
    year: '2023',
    duration: '3 Hours',
    maxMarks: 75,
    instructions: [
      'Attempt all sections as directed.',
      'Figures to the right indicate full marks.',
      'Write pseudo-code or code in C/C++ where required.',
    ],
    sections: [
      {
        name: 'Section A',
        subtitle: 'Short Answer Questions',
        instructions: 'Attempt ALL questions. Each question carries 2 marks.',
        totalMarks: 20,
        questions: [
          { number: 1, text: 'Define an abstract data type (ADT).', marks: 2 },
          { number: 2, text: 'What is the time complexity of binary search?', marks: 2 },
          { number: 3, text: 'Differentiate between stack and queue.', marks: 2 },
          { number: 4, text: 'What is a linked list? List its types.', marks: 2 },
          { number: 5, text: 'Define a complete binary tree.', marks: 2 },
          { number: 6, text: 'What is hashing? Name two collision resolution techniques.', marks: 2 },
          { number: 7, text: 'Explain the concept of recursion with an example.', marks: 2 },
          { number: 8, text: 'What is a priority queue?', marks: 2 },
          { number: 9, text: 'Define Big-O notation.', marks: 2 },
          { number: 10, text: 'What are the applications of a graph data structure?', marks: 2 },
        ],
      },
      {
        name: 'Section B',
        subtitle: 'Medium Answer Questions',
        instructions: 'Attempt ANY FIVE questions. Each question carries 5 marks.',
        totalMarks: 25,
        questions: [
          { number: 11, text: 'Implement a stack using arrays. Write push and pop operations.', marks: 5 },
          { number: 12, text: 'Explain the different tree traversal techniques: Inorder, Preorder, and Postorder.', marks: 5 },
          { number: 13, text: 'Compare and analyze Bubble Sort, Selection Sort, and Insertion Sort.', marks: 5 },
          { number: 14, text: 'Explain BFS and DFS graph traversal algorithms with examples.', marks: 5 },
          { number: 15, text: 'Describe AVL trees and explain rotation operations.', marks: 5 },
        ],
      },
      {
        name: 'Section C',
        subtitle: 'Long Answer Questions',
        instructions: 'Attempt ANY THREE questions. Each question carries 10 marks.',
        totalMarks: 30,
        questions: [
          { number: 16, text: 'a) Implement a doubly linked list with insertion and deletion operations.\nb) Compare singly linked list, doubly linked list, and circular linked list.', marks: 10 },
          { number: 17, text: 'a) Explain Quick Sort algorithm with its working. Analyze time complexity for best, average, and worst case.\nb) Sort the array [38, 27, 43, 3, 9, 82, 10] using Merge Sort. Show all steps.', marks: 10 },
          { number: 18, text: 'a) Explain Dijkstra\'s shortest path algorithm with an example.\nb) What is a minimum spanning tree? Explain Kruskal\'s algorithm.', marks: 10 },
        ],
      },
    ],
  },
};

// Default fallback paper
const DEFAULT_PAPER = MOCK_QUESTION_PAPERS['Operating Systems'];

// ============================================================
// API Route Handlers
// ============================================================

export async function GET(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api', '');

  if (path === '/health' || path === '/') {
    return NextResponse.json({
      status: 'ok',
      message: 'QuestionCraft AI API is running',
      timestamp: new Date().toISOString(),
    });
  }

  // Get available subjects
  if (path === '/subjects') {
    return NextResponse.json({
      departments: ['BCA', 'MCA', 'B.Tech CS', 'B.Sc IT'],
      subjects: {
        'BCA': ['Operating Systems', 'Data Structures', 'Database Management', 'Computer Networks', 'Web Technologies'],
        'MCA': ['Advanced OS', 'Design & Analysis of Algorithms', 'Software Engineering', 'AI & Machine Learning'],
        'B.Tech CS': ['Operating Systems', 'Data Structures', 'Computer Architecture', 'Compiler Design'],
        'B.Sc IT': ['Programming in C', 'Data Structures', 'Operating Systems', 'Software Testing'],
      },
      years: ['2020', '2021', '2022', '2023', '2024', '2025'],
      difficulties: ['Easy', 'Medium', 'Hard'],
    });
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}

export async function POST(request) {
  const { pathname } = new URL(request.url);
  const path = pathname.replace('/api', '');

  // Generate question paper endpoint
  if (path === '/generate') {
    try {
      const body = await request.json();
      const { department, course, subject, year, difficulty, customPrompt, marksDivision, questionDivision, courseCode, freePrompt, theme } = body;

      // Simulate AI processing delay (2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Pick matching paper or use default
      let paper = MOCK_QUESTION_PAPERS[subject] || { ...DEFAULT_PAPER };
      
      // Override with requested params
      paper = {
        ...paper,
        department: department || paper.department,
        course: course || paper.course || '',
        year: year || paper.year,
        subject: subject || paper.subject,
        difficulty: difficulty || 'Medium',
        marksDivision: marksDivision || 75,
        questionDivision: questionDivision || '',
        courseCode: courseCode || paper.courseCode,
        freePrompt: freePrompt || false,
        theme: theme || 'dark',
        generatedAt: new Date().toISOString(),
        aiModel: 'QuestionCraft AI v2.1',
        customPrompt: customPrompt || null,
      };

      return NextResponse.json({ success: true, data: paper });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate question paper: ' + error.message },
        { status: 500 }
      );
    }
  }

  // Inject custom JSON endpoint (for developer testing)
  if (path === '/inject') {
    try {
      const body = await request.json();
      const { jsonData } = body;

      if (!jsonData) {
        return NextResponse.json(
          { success: false, error: 'No JSON data provided' },
          { status: 400 }
        );
      }

      // Validate it has the basic structure
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      return NextResponse.json({
        success: true,
        data: parsed,
        message: 'JSON injected successfully',
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON: ' + error.message },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ error: 'Route not found' }, { status: 404 });
}
