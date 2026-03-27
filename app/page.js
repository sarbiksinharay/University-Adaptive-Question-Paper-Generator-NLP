'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Code2,
  Printer,
  Download,
  Loader2,
  GraduationCap,
  BookOpen,
  Calendar,
  BarChart3,
  MessageSquare,
  Zap,
  Menu,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// ============================================================
// Department & Course Data (from university question paper tree)
// ============================================================
const DEPARTMENTS = [
  { code: 'SOBAS', name: 'SOBAS - School of Basic & Applied Sciences' },
  { code: 'SOBE', name: 'SOBE - School of Business & Economics' },
  { code: 'SOE', name: 'SOE - School of Education' },
  { code: 'SOET', name: 'SOET - School of Engineering & Technology' },
  { code: 'SOHMS', name: 'SOHMS - School of Health & Medical Sciences' },
  { code: 'SOLACS', name: 'SOLACS - School of Liberal Arts, Commerce & Social Sciences' },
  { code: 'SOLB', name: 'SOLB - School of Life Sciences & Biotechnology' },
  { code: 'SOLJ', name: 'SOLJ - School of Law & Justice' },
  { code: 'SOMC', name: 'SOMC - School of Media & Communication' },
  { code: 'SOSA', name: 'SOSA - School of Science & Agriculture' },
];

const COURSES_MAP = {
  SOBAS: [
    'B.Sc Chemistry', 'M.Sc Chemistry',
    'B.Sc Physics', 'M.Sc Physics',
    'B.Sc Mathematics', 'M.Sc Mathematics',
    'B.Sc Applied Mathematics', 'M.Sc Applied Mathematics',
    'B.Sc Geography', 'M.Sc Geography', 'M.Sc Geoinformatics',
    'B.Sc Statistics & Data Analytics', 'M.Sc Statistics & Data Science',
    'BA Psychology', 'B.Sc Psychology', 'MA Psychology', 'M.Sc Psychology',
    'B.Sc Environmental Science', 'M.Sc Environmental Science',
    'B.Sc Forensic Science', 'M.Sc Forensic Science',
  ],
  SOBE: [
    'BBA (H)', 'BBA (Digital Marketing)', 'BBA (Entrepreneurship)',
    'BBA (Logistics & Supply Chain)', 'BBA (Business Analytics)', 'BBA (EFB)',
    'MBA', 'MBA (Dual)', 'MBA (Business Analytics)',
    'MBA (Logistics & Supply Chain)', 'MBA (Data Science)',
    'MBA (Communication Management)', 'MBA (Media Management)',
    'B.Com', 'M.Com',
    'BA Economics', 'B.Sc Economics', 'MA Economics', 'M.Sc Economics',
  ],
  SOE: [
    'B.Ed', 'BA Education', 'MA Education',
  ],
  SOET: [
    'B.Tech Civil Engineering',
    'B.Tech Computer Science & Engineering',
    'B.Tech CSE (AI & ML)', 'B.Tech CSE (Cyber Security & Forensics)',
    'B.Tech Electronics & Communication Engineering',
    'B.Tech Electrical Engineering', 'B.Tech Electrical & Electronics Engineering',
    'B.Tech Mechanical Engineering',
    'B.Tech Biomedical Engineering',
    'B.Tech Biotechnology',
    'M.Tech CSE', 'M.Tech Structural Engineering',
    'M.Tech Environmental Engineering', 'M.Tech Statistics & Data Science',
    'BCA', 'BCA (BFSI)', 'BCA (GA)',
    'MCA',
    'B.Sc Computer Science',
  ],
  SOHMS: [
    'B.Pharm', 'D.Pharm',
    'M.Pharm Pharmaceutics', 'M.Pharm Pharmacology',
    'BMLT', 'MLT',
    'B.Sc FND (Food, Nutrition & Dietetics)', 'B.Sc Optometry',
  ],
  SOLACS: [
    'BA Bengali', 'MA Bengali',
    'BA English', 'MA English',
    'BA History', 'MA History',
    'BA Political Science', 'MA Political Science',
    'BA Political Science & International Relations', 'MA Political Science & International Relations',
    'BA Psychology', 'B.Sc Psychology', 'MA Psychology', 'M.Sc Psychology',
    'BA Sociology', 'B.Sc Sociology', 'MA Sociology',
    'BA Public Administration & Governance', 'MA Public Administration & Governance',
  ],
  SOLB: [
    'B.Sc Biochemistry', 'M.Sc Biochemistry',
    'B.Sc Biotechnology', 'B.Tech Biotechnology', 'M.Sc Biotechnology', 'M.Tech Biotechnology',
    'B.Sc Microbiology', 'M.Sc Microbiology',
    'B.Sc Genetics',
  ],
  SOLJ: [
    'BA LLB', 'BBA LLB', 'B.Sc LLB', 'LLB', 'LLM',
  ],
  SOMC: [
    'BA Journalism & Mass Communication', 'BA Media & Communication',
    'B.Sc Media Technology', 'B.Sc Graphics, Animation & Media Technology',
    'MA Film & Television', 'MA Journalism & Mass Communication',
    'MBA Communication Management', 'MBA Media Management',
  ],
  SOSA: [
    'B.Sc Agriculture',
  ],
};

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

// ============================================================
// Mock fetch function (simulates API call)
// ============================================================
async function fetchQuestionPaper(params) {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Generation failed');
  return data.data;
}

// ============================================================
// Skeleton Loader Component
// ============================================================
function SkeletonLoader() {
  return (
    <div className="space-y-6 p-8">
      {/* Header skeleton */}
      <div className="text-center space-y-3">
        <div className="h-8 w-3/4 mx-auto rounded-lg skeleton-shimmer" />
        <div className="h-4 w-1/2 mx-auto rounded-lg skeleton-shimmer" />
        <div className="h-4 w-2/3 mx-auto rounded-lg skeleton-shimmer" />
      </div>
      <div className="h-px bg-white/5 my-6" />
      {/* Sections skeleton */}
      {[1, 2, 3].map((s) => (
        <div key={s} className="space-y-4">
          <div className="h-6 w-48 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-64 rounded-lg skeleton-shimmer" />
          {[1, 2, 3, 4].map((q) => (
            <div key={q} className="flex justify-between items-center">
              <div className="h-4 rounded-lg skeleton-shimmer" style={{ width: `${60 + Math.random() * 30}%` }} />
              <div className="h-4 w-12 rounded-lg skeleton-shimmer" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Question Paper Renderer Component
// ============================================================
function QuestionPaperRenderer({ paper }) {
  if (!paper) return null;

  return (
    <div className="print-area">
      {/* Paper Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          {paper.university || 'University Name'}
        </h1>
        <div className="mt-2 flex items-center justify-center gap-2 text-zinc-400 text-sm">
          <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-xs font-medium">
            {paper.department || 'Department'}
          </span>
          <span>|</span>
          <span>Semester: {paper.semester || '-'}</span>
          <span>|</span>
          <span>Year: {paper.year || '-'}</span>
        </div>
        <h2 className="text-lg font-semibold text-blue-400 mt-3">
          {paper.course || paper.subject || 'Subject Name'}
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          {paper.subject ? `Subject: ${paper.subject} | ` : ''}Course Code: {paper.courseCode || '-'}
        </p>

        {/* Meta bar */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Duration: {paper.duration || '3 Hours'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
            <span>Max Marks: {paper.maxMarks || 75}</span>
          </div>
          {paper.difficulty && (
            <div className="flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${
                paper.difficulty === 'Easy' ? 'text-green-400' :
                paper.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
              }`} />
              <span className={`text-sm ${
                paper.difficulty === 'Easy' ? 'text-green-400' :
                paper.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {paper.difficulty}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {paper.instructions && paper.instructions.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-zinc-300 mb-2">General Instructions:</h3>
          <ul className="space-y-1">
            {paper.instructions.map((inst, i) => (
              <li key={i} className="text-sm text-zinc-500 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                {inst}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Separator className="bg-white/[0.06] my-6" />

      {/* Sections */}
      {(paper.sections || []).map((section, sIdx) => (
        <div key={sIdx} className="mb-8">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white">{section.name}</h3>
              {section.subtitle && (
                <p className="text-xs text-violet-400 font-medium mt-0.5">{section.subtitle}</p>
              )}
            </div>
            <span className="text-sm font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">
              {section.totalMarks} Marks
            </span>
          </div>

          {section.instructions && (
            <p className="text-sm text-zinc-500 italic mb-4 pl-1">{section.instructions}</p>
          )}

          {/* Questions */}
          <div className="space-y-3">
            {(section.questions || []).map((q, qIdx) => (
              <div
                key={qIdx}
                className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-sm font-bold text-zinc-500 mt-0.5 shrink-0 w-8">
                    Q.{q.number}
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{q.text}</p>
                </div>
                <span className="text-sm font-semibold text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/[0.06] shrink-0">
                  [{q.marks}]
                </span>
              </div>
            ))}
          </div>

          {sIdx < (paper.sections || []).length - 1 && (
            <Separator className="bg-white/[0.04] mt-6" />
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-white/[0.06] text-center">
        <p className="text-xs text-zinc-600">--- End of Question Paper ---</p>
        {paper.aiModel && (
          <p className="text-xs text-zinc-700 mt-1">Generated by {paper.aiModel} on {new Date(paper.generatedAt).toLocaleString()}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Main Dashboard Page
// ============================================================
export default function App() {
  // Sidebar state
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [subject, setSubject] = useState('');
  const [year, setYear] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');

  // Paper state
  const [paper, setPaper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Developer panel
  const [devPanelOpen, setDevPanelOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Available courses based on department
  const availableCourses = department ? COURSES_MAP[department] || [] : [];

  // Reset course and subject when department changes
  useEffect(() => {
    setCourse('');
    setSubject('');
  }, [department]);

  // DD-MM-YYYY date input handler
  const handleYearInput = (e) => {
    let raw = e.target.value.replace(/[^\d]/g, '');
    if (raw.length > 8) raw = raw.slice(0, 8);
    let formatted = '';
    if (raw.length > 4) {
      formatted = raw.slice(0, 2) + '-' + raw.slice(2, 4) + '-' + raw.slice(4);
    } else if (raw.length > 2) {
      formatted = raw.slice(0, 2) + '-' + raw.slice(2);
    } else {
      formatted = raw;
    }
    setYear(formatted);
  };

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ============================================================
  // Generate Paper Handler
  // ============================================================
  const handleGenerate = useCallback(async () => {
    if (!department || !course) {
      setError('Please select at least a Department and Course.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    setError(null);
    setPaper(null);

    try {
      const result = await fetchQuestionPaper({
        department,
        course,
        subject,
        year,
        difficulty,
        customPrompt,
      });
      setPaper(result);
      setSuccessMessage('Question paper generated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to generate paper. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [department, course, subject, year, difficulty, customPrompt]);

  // ============================================================
  // Inject JSON Handler
  // ============================================================
  const handleInjectJSON = useCallback(async () => {
    setJsonError('');
    try {
      const parsed = JSON.parse(jsonInput);
      const response = await fetch('/api/inject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonData: parsed }),
      });
      const data = await response.json();
      if (data.success) {
        setPaper(data.data);
        setSuccessMessage('JSON injected and rendered successfully!');
      } else {
        setJsonError(data.error || 'Injection failed');
      }
    } catch (err) {
      setJsonError('Invalid JSON format: ' + err.message);
    }
  }, [jsonInput]);

  // ============================================================
  // Print Handler
  // ============================================================
  const handlePrint = () => {
    window.print();
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="min-h-screen bg-black flex">
      {/* ============================================================ */}
      {/* Mobile Header */}
      {/* ============================================================ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-zinc-950/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">QuestionCraft</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg bg-white/5 text-white">
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ============================================================ */}
      {/* Sidebar Overlay (mobile) */}
      {/* ============================================================ */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ============================================================ */}
      {/* Sidebar Control Panel */}
      {/* ============================================================ */}
      <aside
        className={`no-print fixed lg:static inset-y-0 left-0 z-50 w-80 bg-zinc-950 border-r border-white/[0.06] flex flex-col transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">QuestionCraft</h1>
              <p className="text-xs text-zinc-500">AI Question Paper Generator</p>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-5">
            {/* Department Select */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Department
              </label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-white hover:bg-white/[0.05] transition-colors h-10 rounded-xl">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/[0.1] max-h-64">
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.code} value={d.code} className="text-zinc-300 focus:bg-white/[0.05] focus:text-white">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Select */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Course
              </label>
              <Select value={course} onValueChange={setCourse} disabled={!department}>
                <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-white hover:bg-white/[0.05] transition-colors h-10 rounded-xl disabled:opacity-40">
                  <SelectValue placeholder={department ? 'Select course' : 'Select department first'} />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/[0.1] max-h-64">
                  {availableCourses.map((c) => (
                    <SelectItem key={c} value={c} className="text-zinc-300 focus:bg-white/[0.05] focus:text-white">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject (Text Input) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Operating Systems"
                className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all"
              />
            </div>

            {/* Year (DD-MM-YYYY Input) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Year
              </label>
              <input
                type="text"
                value={year}
                onChange={handleYearInput}
                placeholder="DD-MM-YYYY"
                maxLength={10}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/30 transition-all font-mono tracking-wider"
              />
              <p className="text-[10px] text-zinc-600">Format: DD-MM-YYYY (e.g., 15-06-2023)</p>
            </div>

            {/* Difficulty Select */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Difficulty Level
              </label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-full bg-white/[0.03] border-white/[0.08] text-white hover:bg-white/[0.05] transition-colors h-10 rounded-xl">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/[0.1]">
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d} className="text-zinc-300 focus:bg-white/[0.05] focus:text-white">
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          d === 'Easy' ? 'bg-green-400' : d === 'Medium' ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        {d}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* Custom Prompt */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Custom Prompt / Instructions
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Add custom instructions for the AI... e.g., 'Include more numerical problems' or 'Focus on practical applications'"
                className="w-full h-28 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/30 resize-none transition-all"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 transition-all duration-300 glow-button disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Paper
                </span>
              )}
            </Button>
          </div>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>QuestionCraft AI v2.1 • Ready</span>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* Main Content Area */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col min-h-screen lg:min-h-0 pt-14 lg:pt-0">
        {/* Top Bar */}
        <div className="no-print h-14 border-b border-white/[0.06] bg-zinc-950/50 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <FileText className="w-4 h-4" />
            <span>Question Paper Preview</span>
            {paper && (
              <span className="ml-2 px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20">
                Generated
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {paper && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrint}
                  className="text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(paper, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `question-paper-${paper.subject || 'paper'}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export JSON</span>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-sm text-red-400 no-print">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-sm text-green-400 no-print">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {loading ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                <SkeletonLoader />
              </div>
            ) : paper ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm p-8 shadow-2xl shadow-black/20">
                <QuestionPaperRenderer paper={paper} />
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-white/[0.06] flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Paper Generated Yet</h3>
                <p className="text-sm text-zinc-600 max-w-md">
                  Select a department and course from the sidebar, then click
                  <span className="text-violet-400 font-medium"> "Generate Paper" </span>
                  to create an AI-powered question paper.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                  <span className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">1. Choose Department</span>
                  <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  <span className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">2. Select Course</span>
                  <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
                  <span className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">3. Generate</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* Developer / Tester Panel (Collapsible) */}
        {/* ============================================================ */}
        <div className="no-print border-t border-white/[0.06]">
          <Collapsible open={devPanelOpen} onOpenChange={setDevPanelOpen}>
            <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Code2 className="w-3.5 h-3.5" />
                <span>Developer / Tester Panel</span>
              </div>
              {devPanelOpen ? (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronUp className="w-4 h-4 text-zinc-500" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-6 pb-6 space-y-3">
                <p className="text-xs text-zinc-600">
                  Paste a valid JSON question paper object below and inject it to render directly.
                </p>
                <textarea
                  value={jsonInput}
                  onChange={(e) => {
                    setJsonInput(e.target.value);
                    setJsonError('');
                  }}
                  placeholder={`{\n  "university": "Your University",\n  "courseCode": "CS-101",\n  "subject": "Subject Name",\n  "sections": [...]\n}`}
                  className="w-full h-40 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-sm text-zinc-300 font-mono placeholder:text-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/30 resize-none transition-all"
                />
                {jsonError && (
                  <p className="text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {jsonError}
                  </p>
                )}
                <Button
                  onClick={handleInjectJSON}
                  disabled={!jsonInput.trim()}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 disabled:opacity-40"
                >
                  <Code2 className="w-3.5 h-3.5 mr-1.5" />
                  Inject JSON
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </main>
    </div>
  );
}
