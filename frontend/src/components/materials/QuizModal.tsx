/**
 * QuizModal.tsx — Fully internationalised quiz UI.
 * All strings via useTranslation. Language passed to the quiz API from i18n.language.
 * Correct answers and explanations only shown after server-side scoring.
 */

import React, { useState, useCallback } from 'react';
import {
  X, Sparkles, Loader2, ChevronLeft, ChevronRight, Check, RotateCcw,
  Trophy, XCircle, BookOpen, Brain, AlertCircle, Compass, ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Document } from '../../types';
import { api, type ClientQuestion, type QuizGenerateResponse, type AttemptResult, type AttemptAnswer, type QuizOptions } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '../../i18n';

// ─── Sub-Types ────────────────────────────────────────────────────────────────

type Phase = 'config' | 'generating' | 'quiz' | 'submitting' | 'results' | 'error';

interface QuizConfig {
  questionCount: 5 | 10 | 15;
  difficulty: 'easy' | 'medium' | 'hard';
  quizType: 'mcq' | 'true_false' | 'mixed';
  language: AppLanguage;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface QuizModalProps {
  document: Document | null;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const QuizModal: React.FC<QuizModalProps> = ({ document, onClose }) => {
  const { isDark } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>('config');
  const [errorMsg, setErrorMsg] = useState('');
  const [config, setConfig] = useState<QuizConfig>({
    questionCount: 5,
    difficulty: 'medium',
    quizType: 'mcq',
    language: (i18n.language as AppLanguage) || 'en',
  });

  // Quiz state
  const [quizData, setQuizData] = useState<QuizGenerateResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<string, number | boolean>>(new Map());
  const [results, setResults] = useState<AttemptResult | null>(null);

  if (!document) return null;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    setPhase('generating');
    setErrorMsg('');
    const opts: QuizOptions = {
      questionCount: config.questionCount,
      difficulty: config.difficulty,
      quizType: config.quizType,
      language: config.language,
    };
    try {
      const data = await api.generateQuiz(document.id, opts);
      setQuizData(data);
      setCurrentIdx(0);
      setAnswers(new Map());
      setResults(null);
      setPhase('quiz');
    } catch (err: any) {
      const msg = err?.response?.data?.error || t('errors.serverError');
      setErrorMsg(msg);
      setPhase('error');
    }
  }, [document.id, config, t]);

  const handleSelectAnswer = (questionId: string, answer: number | boolean) => {
    setAnswers(prev => new Map(prev).set(questionId, answer));
  };

  const handleSubmit = async () => {
    if (!quizData) return;
    setPhase('submitting');
    const answerList: AttemptAnswer[] = quizData.questions.map(q => ({
      questionId: q.id,
      answer: answers.get(q.id) ?? (q.type === 'true_false' ? false : 0),
    }));
    try {
      const result = await api.submitQuizAttempt(quizData.quiz.quizId, answerList);
      setResults(result);
      setPhase('results');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || t('quiz.errorSubmit'));
      setPhase('error');
    }
  };

  const handleRetry = () => {
    setPhase('config');
    setQuizData(null);
    setAnswers(new Map());
    setResults(null);
    setErrorMsg('');
  };

  // ─── Styling ───────────────────────────────────────────────────────────────

  const bg = isDark ? 'bg-slate-900' : 'bg-white';
  const border = isDark ? 'border-slate-700' : 'border-slate-200';
  const headerBg = isDark ? 'bg-slate-800/80' : 'bg-slate-50/80';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const cardBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const inputCls = isDark ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-slate-300 text-slate-700';

  const answeredCount = answers.size;
  const totalQ = quizData?.questions.length ?? 0;
  const currentQ = quizData?.questions[currentIdx];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className={`rounded-3xl shadow-2xl border w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden ${bg} ${border}`}>

        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${headerBg} ${border}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-purple-600 text-white rounded-2xl shadow-md">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-extrabold tracking-tight ${text}`}>{t('quiz.title')}</h2>
              <p className={`text-xs truncate max-w-xs ${subtext}`}>{document.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── CONFIG ────────────────────────────────────────────────── */}
          {phase === 'config' && (
            <div className="p-6 space-y-5">
              <div>
                <h3 className={`text-sm font-extrabold mb-4 ${text}`}>{t('quiz.configure')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  {/* Question count */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${subtext}`}>{t('quiz.questionCount')}</label>
                    <div className="flex gap-2">
                      {([5, 10, 15] as const).map(n => (
                        <button
                          key={n}
                          id={`quiz-count-${n}`}
                          onClick={() => setConfig(c => ({ ...c, questionCount: n }))}
                          className={`flex-1 py-2 text-sm font-bold rounded-xl border transition-all ${config.questionCount === n
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                            : `${inputCls} hover:border-violet-400`}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${subtext}`}>{t('quiz.difficulty')}</label>
                    <div className="flex gap-2">
                      {(['easy', 'medium', 'hard'] as const).map(d => (
                        <button
                          key={d}
                          id={`quiz-diff-${d}`}
                          onClick={() => setConfig(c => ({ ...c, difficulty: d }))}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all capitalize ${config.difficulty === d
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                            : `${inputCls} hover:border-violet-400`}`}
                        >
                          {t(`quiz.${d}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${subtext}`}>{t('quiz.type')}</label>
                    <div className="flex gap-2">
                      {([
                        { value: 'mcq', labelKey: 'quiz.mcq' },
                        { value: 'true_false', labelKey: 'quiz.trueFalse' },
                        { value: 'mixed', labelKey: 'quiz.mixed' },
                      ] as const).map(tp => (
                        <button
                          key={tp.value}
                          id={`quiz-type-${tp.value}`}
                          onClick={() => setConfig(c => ({ ...c, quizType: tp.value }))}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${config.quizType === tp.value
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                            : `${inputCls} hover:border-violet-400`}`}
                        >
                          {t(tp.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${subtext}`}>{t('quiz.language')}</label>
                    <div className="flex gap-2">
                      {([
                        { value: 'en' as AppLanguage, labelKey: 'language.en' },
                        { value: 'hi' as AppLanguage, labelKey: 'language.hi' },
                        { value: 'mr' as AppLanguage, labelKey: 'language.mr' },
                      ]).map(l => (
                        <button
                          key={l.value}
                          id={`quiz-lang-${l.value}`}
                          onClick={() => setConfig(c => ({ ...c, language: l.value }))}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${config.language === l.value
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                            : `${inputCls} hover:border-violet-400`}`}
                        >
                          {t(l.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className={`p-4 rounded-2xl border text-xs ${isDark ? 'bg-violet-900/20 border-violet-700/50 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-800'}`}>
                <p className="font-bold mb-1">{t('quiz.summaryLabel')}</p>
                <p>{t('quiz.summaryText', {
                  count: config.questionCount,
                  difficulty: t(`quiz.${config.difficulty}`),
                  type: t(`quiz.${config.quizType === 'true_false' ? 'trueFalse' : config.quizType}`),
                  lang: config.language.toUpperCase(),
                })}</p>
                <p className="mt-1 opacity-70">{t('quiz.summaryNote')}</p>
              </div>

              <button
                onClick={handleGenerate}
                id="quiz-generate-btn"
                className="w-full py-3 text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-2xl shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {t('quiz.generate')}
              </button>
            </div>
          )}

          {/* ── GENERATING ────────────────────────────────────────────── */}
          {phase === 'generating' && (
            <div className="p-12 flex flex-col items-center justify-center gap-5 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                <Brain className="w-6 h-6 text-violet-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <p className={`text-base font-bold ${text}`}>{t('quiz.generating')}</p>
                <p className={`text-xs mt-1 ${subtext}`}>{t('quiz.generatingSubtitle', { count: config.questionCount })}</p>
              </div>
            </div>
          )}

          {/* ── QUIZ ──────────────────────────────────────────────────── */}
          {phase === 'quiz' && quizData && currentQ && (
            <div className="p-6 space-y-5">
              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={`font-semibold ${subtext}`}>{t('quiz.question', { current: currentIdx + 1, total: totalQ })}</span>
                  <span className={`font-bold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{t('quiz.answered', { answered: answeredCount, total: totalQ })}</span>
                </div>
                <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${((currentIdx + 1) / totalQ) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question */}
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-violet-50/60 border-violet-200/60'}`}>
                <div className="flex items-start gap-3">
                  <span className={`shrink-0 w-7 h-7 rounded-xl text-xs font-extrabold flex items-center justify-center ${isDark ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-700'}`}>
                    {currentIdx + 1}
                  </span>
                  <p className={`text-sm font-semibold leading-relaxed ${text}`}>{currentQ.question}</p>
                </div>
              </div>

              {/* Options */}
              {currentQ.type === 'mcq' ? (
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, idx) => {
                    const selected = answers.get(currentQ.id) === idx;
                    return (
                      <button
                        key={idx}
                        id={`quiz-option-${currentIdx}-${idx}`}
                        onClick={() => handleSelectAnswer(currentQ.id, idx)}
                        aria-pressed={selected}
                        className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${selected
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/20 font-bold'
                          : `${cardBg} hover:border-violet-400 ${text}`}`}
                      >
                        <span className={`inline-block w-5 h-5 rounded-md text-xs font-extrabold text-center mr-3 leading-5 ${selected ? 'bg-white/20' : isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex gap-3">
                  {([{ label: t('quiz.true'), val: true }, { label: t('quiz.false'), val: false }]).map(({ label, val }) => {
                    const selected = answers.get(currentQ.id) === val;
                    return (
                      <button
                        key={label}
                        id={`quiz-tf-${currentIdx}-${label.toLowerCase()}`}
                        onClick={() => handleSelectAnswer(currentQ.id, val)}
                        aria-pressed={selected}
                        className={`flex-1 py-4 rounded-xl border text-sm font-extrabold transition-all ${selected
                          ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                          : `${cardBg} hover:border-violet-400 ${text}`}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  aria-label={t('quiz.previous')}
                  className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${currentIdx === 0 ? 'opacity-40 cursor-not-allowed' : ''} ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                >
                  <ChevronLeft className="w-4 h-4" /> {t('quiz.previous')}
                </button>

                {/* Question dots */}
                <div className="hidden sm:flex gap-1.5 flex-wrap justify-center max-w-xs">
                  {quizData.questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      aria-label={t('quiz.question', { current: i + 1, total: totalQ })}
                      aria-current={i === currentIdx ? 'true' : undefined}
                      className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all ${i === currentIdx
                        ? 'bg-violet-600 text-white'
                        : answers.has(q.id)
                        ? isDark ? 'bg-emerald-700 text-emerald-200' : 'bg-emerald-100 text-emerald-700'
                        : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                {currentIdx < totalQ - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(i => Math.min(totalQ - 1, i + 1))}
                    aria-label={t('quiz.next')}
                    className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-300 hover:bg-slate-100'}`}
                  >
                    {t('quiz.next')} <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="quiz-submit-btn"
                    onClick={handleSubmit}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl shadow-md transition-all hover:shadow-violet-500/30"
                  >
                    <Check className="w-4 h-4" /> {t('quiz.submit')}
                  </button>
                )}
              </div>

              {/* Submit from any page if all answered */}
              {answeredCount === totalQ && currentIdx < totalQ - 1 && (
                <button
                  id="quiz-submit-all-answered"
                  onClick={handleSubmit}
                  className="w-full py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md transition-all"
                >
                  <Check className="w-4 h-4 inline mr-1.5" /> {t('quiz.submitAllAnswered')}
                </button>
              )}
            </div>
          )}

          {/* ── SUBMITTING ────────────────────────────────────────────── */}
          {phase === 'submitting' && (
            <div className="p-12 flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
              <p className={`text-sm font-bold ${text}`}>{t('quiz.submitting')}</p>
            </div>
          )}

          {/* ── RESULTS ───────────────────────────────────────────────── */}
          {phase === 'results' && results && quizData && (
            <div className="p-6 space-y-5">
              {/* Score header */}
              <div className={`p-6 rounded-2xl border text-center ${results.percentage >= 80
                ? isDark ? 'bg-emerald-900/30 border-emerald-700/50' : 'bg-emerald-50 border-emerald-200'
                : results.percentage >= 50
                ? isDark ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-50 border-amber-200'
                : isDark ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200'}`}
              >
                <Trophy className={`w-10 h-10 mx-auto mb-2 ${results.percentage >= 80 ? 'text-emerald-500' : results.percentage >= 50 ? 'text-amber-500' : 'text-red-500'}`} />
                <p className={`text-3xl font-extrabold ${text}`}>{results.percentage}%</p>
                <p className={`text-sm mt-1 font-semibold ${subtext}`}>{t('quiz.score', { score: results.score, total: results.total })}</p>
                <p className={`text-xs mt-2 ${subtext}`}>
                  {results.percentage >= 80 ? t('quiz.excellent') : results.percentage >= 50 ? t('quiz.good') : t('quiz.review')}
                </p>
              </div>

              {/* Topic Breakdown & Knowledge Gap Coach */}
              {results.topicBreakdown && results.topicBreakdown.length > 0 && (
                <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-extrabold uppercase tracking-wider ${subtext}`}>Topic Performance</span>
                    <span className={`text-[11px] font-semibold ${subtext}`}>{results.topicBreakdown.length} topics evaluated</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {results.topicBreakdown.map((tb, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2.5 py-1 rounded-xl font-bold flex items-center gap-1.5 border ${
                          tb.accuracy >= 70
                            ? isDark ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/50' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : isDark ? 'bg-rose-900/30 text-rose-300 border-rose-700/50' : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {tb.accuracy >= 70 ? '✓' : '⚠️'} {tb.topic} ({tb.accuracy}%)
                      </span>
                    ))}
                  </div>

                  {results.weakTopics && results.weakTopics.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <p className={`text-xs font-bold ${text}`}>Weak Topics Detected:</p>
                        <p className="text-xs text-rose-500 font-semibold">{results.weakTopics.join(', ')}</p>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          navigate(`/library/learn/${document.id}`);
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-extrabold text-xs shadow-md flex items-center gap-1.5 transition-all"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Launch Guided Revision</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Question-by-question review */}
              <div>
                <h3 className={`text-sm font-extrabold mb-3 ${text}`}>{t('quiz.reviewSection')}</h3>
                <div className="space-y-3">
                  {quizData.questions.map((q, idx) => {
                    const scored = results.scoredQuestions.find(s => s.questionId === q.id);
                    if (!scored) return null;
                    return (
                      <div key={q.id} className={`p-4 rounded-2xl border ${scored.correct
                        ? isDark ? 'bg-emerald-900/20 border-emerald-700/50' : 'bg-emerald-50 border-emerald-200'
                        : isDark ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'}`}
                      >
                        <div className="flex items-start gap-2.5">
                          {scored.correct
                            ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            : <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold leading-snug ${text}`}>
                              <span className={`font-extrabold mr-1.5 ${subtext}`}>Q{idx + 1}.</span>
                              {q.question}
                            </p>
                            {/* Correct answer */}
                            {q.type === 'mcq' && !scored.correct && (
                              <p className={`text-xs mt-1.5 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {t('quiz.correctAnswer', { answer: q.options[scored.correctAnswer as number] })}
                              </p>
                            )}
                            {q.type === 'true_false' && !scored.correct && (
                              <p className={`text-xs mt-1.5 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {t('quiz.correctAnswer', { answer: scored.correctAnswer ? t('quiz.true') : t('quiz.false') })}
                              </p>
                            )}
                            {/* Explanation */}
                            <p className={`text-xs mt-1.5 italic leading-relaxed ${subtext}`}>
                              💡 {scored.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Retry */}
              <button
                id="quiz-retry-btn"
                onClick={handleRetry}
                className={`w-full flex items-center justify-center gap-2 py-3 text-xs font-extrabold rounded-2xl border transition-all ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              >
                <RotateCcw className="w-4 h-4" /> {t('quiz.retry')}
              </button>
            </div>
          )}

          {/* ── ERROR ─────────────────────────────────────────────────── */}
          {phase === 'error' && (
            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <p className={`text-sm font-bold ${text}`}>{t('quiz.error')}</p>
                <p className={`text-xs mt-1 max-w-sm ${subtext}`}>{errorMsg}</p>
              </div>
              <button
                id="quiz-error-retry-btn"
                onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all"
              >
                <RotateCcw className="w-4 h-4" /> {t('quiz.retry')}
              </button>
            </div>
          )}
        </div>

        {/* Footer — only in quiz phase */}
        {phase === 'quiz' && quizData && (
          <div className={`px-6 py-3 border-t flex items-center justify-between ${headerBg} ${border}`}>
            <span className={`text-xs font-medium ${subtext}`}>
              <BookOpen className="w-3.5 h-3.5 inline mr-1" />
              {document.filename}
            </span>
            <button
              onClick={handleSubmit}
              aria-label={t('quiz.submitCount', { answered: answeredCount, total: totalQ })}
              className="px-4 py-2 text-xs font-extrabold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {t('quiz.submitCount', { answered: answeredCount, total: totalQ })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
