import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  Brain,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Volume2,
  FileText,
  HelpCircle,
  Award,
  ChevronRight,
  Zap,
  Target,
  Clock,
  Layers,
  Check,
  X,
  Loader2,
} from 'lucide-react';
import { api } from '../../services/api';
import type {
  LearningPathRecord,
  StudyMode,
  SummaryResult,
  QuizGenerateResponse,
  AttemptResult,
} from '../../services/api';
import type { Document } from '../../types';
import { SpeechPlayer } from '../../components/ui/SpeechPlayer';
import { TextSizeControls, getTextSizeClass, type TextSize } from '../../components/ui/TextSizeControls';
import { FeedbackModal } from '../../components/feedback/FeedbackModal';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

export const SmartLearningPathPage: React.FC = () => {
  const { documentId } = useParams<{ documentId?: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDark } = useTheme();

  // Selected document & learning path state
  const [activeDocId, setActiveDocId] = useState<string | null>(documentId || null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [allPaths, setAllPaths] = useState<LearningPathRecord[]>([]);
  const [currentPath, setCurrentPath] = useState<LearningPathRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Workflow current step: 1 to 6
  const [activeStep, setActiveStep] = useState<number>(1);

  // Step 2: Understand State
  const [studyMode, setStudyMode] = useState<StudyMode>('summary');
  const [studyLanguage, setStudyLanguage] = useState<'en' | 'hi' | 'mr'>(
    (i18n.language as 'en' | 'hi' | 'mr') || 'en'
  );
  const [studyContent, setStudyContent] = useState<string | null>(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>('base');

  // Step 3: Practice Quiz State
  const [quizData, setQuizData] = useState<QuizGenerateResponse | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Map<string, number | boolean>>(new Map());
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<AttemptResult | null>(null);

  // Step 6: Follow-up Quiz State
  const [followUpData, setFollowUpData] = useState<QuizGenerateResponse | null>(null);
  const [followUpAnswers, setFollowUpAnswers] = useState<Map<string, number | boolean>>(new Map());
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpResult, setFollowUpResult] = useState<AttemptResult | null>(null);

  // Feedback modal
  const [showFeedback, setShowFeedback] = useState(false);

  // Load initial documents & paths
  useEffect(() => {
    loadInitialData();
  }, [documentId]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [docs, paths] = await Promise.all([
        api.getDocuments(),
        api.listLearningPaths(),
      ]);
      setDocuments(docs);
      setAllPaths(paths);

      const targetId = documentId || (docs.length > 0 ? docs[0].id : null);
      if (targetId) {
        setActiveDocId(targetId);
        await loadDocumentPath(targetId);
      }
    } catch (err) {
      console.error('Failed to load learning path data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentPath = async (docId: string) => {
    try {
      const pathRecord = await api.getLearningPath(docId);
      setCurrentPath(pathRecord);
      setActiveStep(pathRecord.step || 1);
    } catch (err) {
      console.error('Error fetching document learning path:', err);
    }
  };

  const handleSelectDocument = (docId: string) => {
    setActiveDocId(docId);
    navigate(`/library/learn/${docId}`);
    loadDocumentPath(docId);
  };

  // ─── Step 2: Generate Study Material ──────────────────────────────────────────

  const handleGenerateStudyContent = useCallback(
    async (mode: StudyMode, lang = studyLanguage) => {
      if (!activeDocId) return;
      setStudyLoading(true);
      setStudyMode(mode);
      try {
        const res = await api.generateSummary(activeDocId, lang, 'medium', mode);
        setStudyContent(res.summary);
        await api.updateLearningPathProgress(activeDocId, 2);
      } catch (err) {
        console.error('Study content generation error:', err);
        setStudyContent('Unable to generate study content. Please check document or provider.');
      } finally {
        setStudyLoading(false);
      }
    },
    [activeDocId, studyLanguage]
  );

  // Auto-generate summary when reaching Step 2 if not present
  useEffect(() => {
    if (activeStep === 2 && !studyContent && activeDocId) {
      handleGenerateStudyContent('summary');
    }
  }, [activeStep, activeDocId, studyContent, handleGenerateStudyContent]);

  // ─── Step 3: Practice Quiz ────────────────────────────────────────────────────

  const handleStartPracticeQuiz = async () => {
    if (!activeDocId) return;
    setQuizLoading(true);
    setActiveStep(3);
    try {
      const data = await api.generateQuiz(activeDocId, {
        questionCount: 5,
        difficulty: 'medium',
        quizType: 'mcq',
        language: studyLanguage,
      });
      setQuizData(data);
      setQuizAnswers(new Map());
      setQuizResult(null);
      await api.updateLearningPathProgress(activeDocId, 3);
    } catch (err) {
      console.error('Failed to generate practice quiz:', err);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSubmitPracticeQuiz = async () => {
    if (!quizData || !activeDocId) return;
    setQuizSubmitting(true);
    const answersList = quizData.questions.map((q) => ({
      questionId: q.id,
      answer: quizAnswers.get(q.id) ?? (q.type === 'true_false' ? false : 0),
    }));

    try {
      const result = await api.submitQuizAttempt(quizData.quiz.quizId, answersList);
      setQuizResult(result);

      // Sync results to Smart Learning Path engine for gap analysis
      const updatedPath = await api.syncQuizToLearningPath(
        activeDocId,
        quizData.quiz.quizId,
        result.score,
        result.total,
        result.weakTopics || [],
        result.strongTopics || [],
        studyLanguage
      );

      setCurrentPath(updatedPath);
      setActiveStep(4); // Advance to Knowledge Gap Analysis
    } catch (err) {
      console.error('Error submitting quiz attempt:', err);
    } finally {
      setQuizSubmitting(false);
    }
  };

  // ─── Step 6: Follow-up Quiz for Improvement ───────────────────────────────────

  const handleStartFollowUpQuiz = async () => {
    if (!activeDocId) return;
    setFollowUpLoading(true);
    try {
      const data = await api.generateFollowUpQuiz(activeDocId, studyLanguage, 'medium');
      setFollowUpData(data);
      setFollowUpAnswers(new Map());
      setFollowUpResult(null);
      setActiveStep(6);
    } catch (err) {
      console.error('Error generating follow-up quiz:', err);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const handleSubmitFollowUpQuiz = async () => {
    if (!followUpData || !activeDocId) return;
    setFollowUpSubmitting(true);
    const answersList = followUpData.questions.map((q) => ({
      questionId: q.id,
      answer: followUpAnswers.get(q.id) ?? (q.type === 'true_false' ? false : 0),
    }));

    try {
      const result = await api.submitQuizAttempt(followUpData.quiz.quizId, answersList);
      setFollowUpResult(result);

      // Re-sync to update score and show before/after improvement!
      const updatedPath = await api.syncQuizToLearningPath(
        activeDocId,
        followUpData.quiz.quizId,
        result.score,
        result.total,
        result.weakTopics || [],
        result.strongTopics || [],
        studyLanguage
      );
      setCurrentPath(updatedPath);
    } catch (err) {
      console.error('Error submitting follow-up attempt:', err);
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  // Text size classes
  const getTextSizeClass = () => {
    switch (textSize) {
      case 'sm':
        return 'text-xs leading-relaxed';
      case 'lg':
        return 'text-base leading-relaxed';
      case 'xl':
        return 'text-lg leading-loose';
      default:
        return 'text-sm leading-relaxed';
    }
  };

  const stepsList = [
    { num: 1, label: 'Document', icon: FileText },
    { num: 2, label: 'Understand', icon: Brain },
    { num: 3, label: 'Practice', icon: HelpCircle },
    { num: 4, label: 'Knowledge Gaps', icon: AlertTriangle },
    { num: 5, label: 'Revise', icon: BookOpen },
    { num: 6, label: 'Improve', icon: TrendingUp },
  ];

  const activeDoc = documents.find((d) => d.id === activeDocId);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-8 text-white border border-slate-800 shadow-2xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Signature Experience · Smart Learning Path</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Upload Once. <span className="gradient-text">Learn in Your Language.</span> Practice at Your Level.
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              A continuous, connected cycle: Understand core ideas, test yourself with document-grounded quizzes, identify knowledge gaps, and revise targeted weak spots.
            </p>
          </div>

          {activeDoc && (
            <div className="flex flex-col gap-2 bg-slate-900/80 border border-slate-700/80 p-4 rounded-2xl shrink-0 max-w-xs backdrop-blur-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Material</span>
              <p className="text-xs font-bold text-white line-clamp-1">{activeDoc.filename}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/50 text-blue-300 border border-blue-700/50 uppercase">
                  {activeDoc.fileType}
                </span>
                {currentPath?.lastPercentage !== null && currentPath?.lastPercentage !== undefined && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${currentPath.lastPercentage >= 70 ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-amber-950 text-amber-300 border-amber-700'}`}>
                    Mastery: {currentPath.lastPercentage}%
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Step Progress Stepper ─────────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl overflow-x-auto shadow-sm">
        <div className="flex items-center justify-between min-w-[650px] gap-2">
          {stepsList.map((s, idx) => {
            const Icon = s.icon;
            const isCompleted = activeStep > s.num;
            const isCurrent = activeStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => setActiveStep(s.num)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                      : isCompleted
                      ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700/80'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isCurrent
                        ? 'bg-white text-blue-600'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className="text-xs whitespace-nowrap">{s.label}</span>
                </button>
                {idx < stepsList.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-700 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ─── Main Workflow Content ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Interactive Step Area (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {/* ─── Step 1: Document Selection ───────────────────────────────────── */}
          {activeStep === 1 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Step 1: Choose Curriculum Document to Study
                  </h2>
                  <p className="text-xs text-slate-400">
                    Select any uploaded PDF, DOCX, PPTX, or text material to begin your intelligent learning cycle.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const isSelected = doc.id === activeDocId;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDocument(doc.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-950/40 border-blue-500/60 shadow-md ring-1 ring-blue-500/40'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {doc.fileType}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white mt-3 line-clamp-1">{doc.filename}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {doc.description || 'Uploaded document ready for AI understanding and interactive practice.'}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-xs">
                        <span className="text-slate-400">
                          Status: <span className="text-emerald-400 font-semibold">{doc.status}</span>
                        </span>
                        <span className="text-blue-400 font-bold flex items-center gap-1">
                          {isSelected ? 'Selected' : 'Select'} <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {activeDoc && (
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
                  >
                    <span>Proceed to Step 2: Understand</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 2: Understand (Study Modes & Multilingual Learning) ────── */}
          {activeStep === 2 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    Step 2: Understand the Document
                  </h2>
                  <p className="text-xs text-slate-400">
                    Learn in your preferred language with simplified explanations, key definitions, or structured summaries.
                  </p>
                </div>

                {/* Accessibility Controls: Speech & Text Size */}
                <div className="flex items-center gap-2">
                  {studyContent && (
                    <SpeechPlayer text={studyContent} language={studyLanguage} />
                  )}
                  <TextSizeControls currentSize={textSize} onChange={setTextSize} />
                </div>
              </div>

              {/* Mode and Language Selectors */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800">
                {/* Study Mode Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'summary', label: 'Summary' },
                    { id: 'simplified', label: 'Simplified (ELI5)' },
                    { id: 'key_concepts', label: 'Key Definitions' },
                    { id: 'revision_points', label: 'Revision Notes' },
                    { id: 'chapter_breakdown', label: 'Section Breakdown' },
                    { id: 'revision_questions', label: 'Study Questions' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleGenerateStudyContent(m.id as StudyMode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        studyMode === m.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Language Switcher */}
                <div className="flex items-center gap-1">
                  {[
                    { code: 'en', label: 'EN' },
                    { code: 'hi', label: 'हिन्दी' },
                    { code: 'mr', label: 'मराठी' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setStudyLanguage(lang.code as any);
                        handleGenerateStudyContent(studyMode, lang.code as any);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        studyLanguage === lang.code
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Study Content Body */}
              <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800/80 min-h-[220px]">
                {studyLoading ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400">
                      AI is reading and synthesizing {studyMode.replace('_', ' ')} in{' '}
                      {studyLanguage === 'hi' ? 'Hindi' : studyLanguage === 'mr' ? 'Marathi' : 'English'}...
                    </p>
                  </div>
                ) : studyContent ? (
                  <div className={`text-slate-200 whitespace-pre-line ${getTextSizeClass()}`}>
                    {studyContent}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Click any study mode above to generate customized explanations.
                  </div>
                )}
              </div>

              {/* Next Action */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  onClick={() => setShowFeedback(true)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Report issue with this explanation</span>
                </button>

                <button
                  onClick={handleStartPracticeQuiz}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
                >
                  <span>Proceed to Step 3: Practice Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Practice Quiz ────────────────────────────────────────── */}
          {activeStep === 3 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-amber-400" />
                    Step 3: Document Practice Quiz
                  </h2>
                  <p className="text-xs text-slate-400">
                    Test your understanding with questions grounded in the extracted document content.
                  </p>
                </div>
                <button
                  onClick={handleStartPracticeQuiz}
                  className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate Quiz</span>
                </button>
              </div>

              {quizLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">
                    Generating document-grounded quiz questions in{' '}
                    {studyLanguage === 'hi' ? 'Hindi' : studyLanguage === 'mr' ? 'Marathi' : 'English'}...
                  </p>
                </div>
              ) : quizData ? (
                <div className="space-y-6">
                  {quizData.questions.map((q, qIndex) => {
                    const currentSelected = quizAnswers.get(q.id);
                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-blue-400">Question {qIndex + 1} of {quizData.questions.length}</span>
                          {q.topic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950/70 text-indigo-300 border border-indigo-800/50">
                              Topic: {q.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-white">{q.question}</p>

                        {/* MCQ Options */}
                        {q.type === 'mcq' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                            {q.options.map((opt, optIdx) => {
                              const isChecked = currentSelected === optIdx;
                              return (
                                <button
                                  key={optIdx}
                                  onClick={() =>
                                    setQuizAnswers(new Map(quizAnswers).set(q.id, optIdx))
                                  }
                                  className={`p-3 rounded-xl text-xs font-medium text-left border transition-all ${
                                    isChecked
                                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* True / False Options */}
                        {q.type === 'true_false' && (
                          <div className="flex gap-3 pt-2">
                            {[true, false].map((val) => (
                              <button
                                key={String(val)}
                                onClick={() =>
                                  setQuizAnswers(new Map(quizAnswers).set(q.id, val))
                                }
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                  currentSelected === val
                                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                {val ? 'True' : 'False'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSubmitPracticeQuiz}
                      disabled={quizSubmitting || quizAnswers.size === 0}
                      className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                    >
                      {quizSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Scoring Quiz...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit & Identify Knowledge Gaps</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p>Click "Start Practice Quiz" to generate interactive questions.</p>
                  <button
                    onClick={handleStartPracticeQuiz}
                    className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500"
                  >
                    Start Practice Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ─── Step 4: Knowledge Gap Identification ─────────────────────────── */}
          {activeStep === 4 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    Step 4: Knowledge Gap Analysis
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real analysis of your strengths and weak topics based on document scoring.
                  </p>
                </div>

                {quizResult && (
                  <div className="text-right">
                    <div className="text-2xl font-extrabold text-white">
                      {quizResult.score} / {quizResult.total}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Score: {quizResult.percentage}%
                    </span>
                  </div>
                )}
              </div>

              {/* Topic Breakdown Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Performance by Topic
                </h3>

                {quizResult?.topicBreakdown && quizResult.topicBreakdown.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {quizResult.topicBreakdown.map((tb, idx) => {
                      const isWeak = tb.percentage < 70;
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border ${
                            isWeak
                              ? 'bg-rose-950/30 border-rose-800/40'
                              : 'bg-emerald-950/30 border-emerald-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{tb.topic}</span>
                            <span
                              className={`text-[11px] font-extrabold px-2 py-0.5 rounded ${
                                isWeak
                                  ? 'bg-rose-900/60 text-rose-300'
                                  : 'bg-emerald-900/60 text-emerald-300'
                              }`}
                            >
                              {tb.percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isWeak ? 'bg-rose-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${tb.percentage}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-2">
                            {isWeak ? 'Needs revision before retrying' : 'Concept mastered successfully'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                    No topic breakdown data available yet. Complete a quiz to analyze knowledge gaps.
                  </div>
                )}
              </div>

              {/* Scored Questions Review */}
              {quizResult?.scoredQuestions && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Detailed Question Review
                  </h3>
                  <div className="space-y-2">
                    {quizResult.scoredQuestions.map((sq, i) => (
                      <div
                        key={i}
                        className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                          sq.correct
                            ? 'bg-emerald-950/20 border-emerald-800/40'
                            : 'bg-rose-950/20 border-rose-800/40'
                        }`}
                      >
                        {sq.correct ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-white">
                            Question {i + 1} ({sq.topic}):{' '}
                            <span className={sq.correct ? 'text-emerald-400' : 'text-rose-400'}>
                              {sq.correct ? 'Correct' : 'Incorrect'}
                            </span>
                          </p>
                          <p className="text-slate-300 text-[11px]">{sq.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Advance to Step 5: Revise */}
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => setActiveStep(5)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all"
                >
                  <span>Proceed to Step 5: Grounded Revision</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 5: Grounded Revision ────────────────────────────────────── */}
          {activeStep === 5 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Step 5: Grounded Revision Recommendations
                  </h2>
                  <p className="text-xs text-slate-400">
                    Targeted document excerpts and tutor guidance tailored directly to your knowledge gaps.
                  </p>
                </div>
              </div>

              {currentPath?.revisions && currentPath.revisions.length > 0 ? (
                <div className="space-y-4">
                  {currentPath.revisions.map((rev, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Focus Topic: {rev.topic}
                        </span>
                        {rev.pageReference && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Source Reference: Page {rev.pageReference}
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                          Source Document Excerpt
                        </span>
                        <p className="italic font-mono text-slate-300">"{rev.excerpt}"</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/40 text-xs text-blue-200">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                          Coach Revision Advice
                        </span>
                        <p>{rev.advice}</p>
                      </div>

                      <SpeechPlayer text={`${rev.topic}. ${rev.advice}`} language={studyLanguage} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Award className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold text-white text-sm">No Critical Knowledge Gaps Detected!</p>
                  <p>You scored well on all topics. Proceed to the improvement follow-up to test mastery.</p>
                </div>
              )}

              {/* Advance to Step 6: Follow-up Quiz */}
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={handleStartFollowUpQuiz}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Proceed to Step 6: Targeted Follow-up Quiz</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 6: Improve (Targeted Follow-up Quiz) ─────────────────────── */}
          {activeStep === 6 && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    Step 6: Improve with Targeted Follow-up Quiz
                  </h2>
                  <p className="text-xs text-slate-400">
                    A short, focused quiz targeting solely your weak areas to measure verifiable improvement.
                  </p>
                </div>

                {/* Score Comparison Badge */}
                {currentPath?.previousPercentage !== null && currentPath?.lastPercentage !== null && (
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Attempt 1</span>
                      <span className="text-sm font-extrabold text-slate-300">
                        {currentPath?.previousPercentage ?? 0}%
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Attempt 2</span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {currentPath?.lastPercentage}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {followUpLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400">
                    Generating targeted follow-up quiz targeting your identified weak topics...
                  </p>
                </div>
              ) : followUpData && !followUpResult ? (
                <div className="space-y-6">
                  {followUpData.questions.map((q, qIndex) => {
                    const currentSelected = followUpAnswers.get(q.id);
                    return (
                      <div
                        key={q.id}
                        className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-400">Follow-up {qIndex + 1} of {followUpData.questions.length}</span>
                          {q.topic && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800/50">
                              Target Weak Topic: {q.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-sm font-bold text-white">{q.question}</p>

                        {q.type === 'mcq' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                            {q.options.map((opt, optIdx) => {
                              const isChecked = currentSelected === optIdx;
                              return (
                                <button
                                  key={optIdx}
                                  onClick={() =>
                                    setFollowUpAnswers(new Map(followUpAnswers).set(q.id, optIdx))
                                  }
                                  className={`p-3 rounded-xl text-xs font-medium text-left border transition-all ${
                                    isChecked
                                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                                  }`}
                                >
                                  <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSubmitFollowUpQuiz}
                      disabled={followUpSubmitting || followUpAnswers.size === 0}
                      className="px-7 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
                    >
                      {followUpSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Scoring Follow-up...</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-4 h-4" />
                          <span>Submit & Compare Improvement</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : followUpResult ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-extrabold text-white">Learning Loop Complete!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    You scored <strong className="text-emerald-400">{followUpResult.score} / {followUpResult.total} ({followUpResult.percentage}%)</strong> on your follow-up quiz.
                  </p>

                  <div className="pt-4 flex justify-center gap-3">
                    <button
                      onClick={() => setActiveStep(2)}
                      className="px-5 py-2.5 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold rounded-xl"
                    >
                      Review Understand Step
                    </button>
                    <button
                      onClick={() => setActiveStep(1)}
                      className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-500 text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20"
                    >
                      Study Another Document
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p>Ready to test your improvement on targeted weak topics?</p>
                  <button
                    onClick={handleStartFollowUpQuiz}
                    className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
                  >
                    Start Follow-up Quiz
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── Right Column: Active Learning Paths & Progress (1 col) ──────── */}
        <div className="space-y-6">
          {/* Active Course Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              Learning Progress
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Document</span>
                <p className="text-xs font-bold text-white line-clamp-1">
                  {currentPath?.documentTitle || 'No document selected'}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold">Current Cycle Step</span>
                <p className="text-xs font-bold text-blue-400">
                  Step {activeStep} of 6: {stepsList[activeStep - 1]?.label}
                </p>
              </div>

              {currentPath?.lastPercentage !== null && currentPath?.lastPercentage !== undefined && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Latest Score</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          currentPath.lastPercentage >= 70 ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${currentPath.lastPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-extrabold text-white">
                      {currentPath.lastPercentage}%
                    </span>
                  </div>
                </div>
              )}

              {/* Weak topics chips */}
              {currentPath?.weakTopics && currentPath.weakTopics.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-rose-400 font-bold uppercase block mb-1.5">
                    Gaps Identified
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentPath.weakTopics.map((wt, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/50 text-rose-300 border border-rose-800/40"
                      >
                        {wt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* All Paths List */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              All Learning Tracks ({allPaths.length})
            </h3>

            <div className="space-y-2">
              {allPaths.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectDocument(p.documentId)}
                  className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all ${
                    p.documentId === activeDocId
                      ? 'bg-blue-950/40 border-blue-600/50 text-white'
                      : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold line-clamp-1">{p.documentTitle}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Step {p.step}/6</span>
                    {p.lastPercentage !== null && (
                      <span className="text-emerald-400 font-bold">{p.lastPercentage}%</span>
                    )}
                  </div>
                </button>
              ))}

              {allPaths.length === 0 && (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Start studying a document to track your progress.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        relatedDocumentId={activeDocId || undefined}
        relatedDocumentTitle={activeDoc?.filename}
      />
    </div>
  );
};
