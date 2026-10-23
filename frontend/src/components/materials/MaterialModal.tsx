import React, { useState } from 'react';
import {
  X, Download, FileText, Calendar, Tag, User, Eye, Check, Edit3,
  Sparkles, Loader2, BookOpen, Hash, Brain, Compass, MessageSquarePlus,
} from 'lucide-react';
import type { Document } from '../../types';
import { api, type StudyMode } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAudit } from '../../context/AuditContext';
import { useAuth } from '../../context/AuthContext';
import { QuizModal } from './QuizModal';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { AppLanguage } from '../../i18n';
import { SpeechPlayer } from '../ui/SpeechPlayer';
import { TextSizeControls, getTextSizeClass, type TextSize } from '../ui/TextSizeControls';
import { FeedbackModal } from '../feedback/FeedbackModal';

interface MaterialModalProps {
  material: Document | null;
  onClose: () => void;
  onUpdate?: (updated: Document) => void;
  isAdmin?: boolean;
  searchQuery?: string;
}

// ─── Highlight Helper ───────────────────────────────────────────────────────
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-300/80 text-amber-900 rounded px-0.5 font-bold not-italic">
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

type TabType = 'content' | 'summary' | 'quiz';

export const MaterialModal: React.FC<MaterialModalProps> = ({
  material,
  onClose,
  onUpdate,
  isAdmin = false,
  searchQuery = '',
}) => {
  const { isDark } = useTheme();
  const { addLog } = useAudit();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState(material?.tags ? material.tags.join(', ') : '');
  const [descInput, setDescInput] = useState(material?.description || '');
  const [showQuiz, setShowQuiz] = useState(false);
  const [summaryLanguage, setSummaryLanguage] = useState<AppLanguage>((i18n.language as AppLanguage) || 'en');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [studyMode, setStudyMode] = useState<StudyMode>('summary');
  const [textSize, setTextSize] = useState<TextSize>('base');
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  if (!material) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tagsArray = tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
      const updated = await api.updateDocument(material.id, descInput, tagsArray);
      if (onUpdate) onUpdate(updated);
      setIsEditingTags(false);
      addLog({
        actor: user?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'EDIT',
        target: material.filename,
        detail: `Updated tags: ${tagsArray.join(', ')}`,
      });
    } catch (err) {
      console.error('Failed to update document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSummary = async (modeOverride?: StudyMode) => {
    const targetMode = modeOverride || studyMode;
    setIsGeneratingSummary(true);
    setSummaryError(null);
    setActiveTab('summary');
    try {
      const result = await api.generateSummary(material.id, summaryLanguage, summaryLength, targetMode);
      setAiSummary(result.summary);
    } catch (err: any) {
      const msg = err?.response?.data?.error || t('summary.insufficientContent');
      setSummaryError(msg);
      setAiSummary(null);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDownload = () => {
    addLog({
      actor: user?.name || 'User',
      actorRole: isAdmin ? 'ADMIN' : 'VIEWER',
      action: 'DOWNLOAD',
      target: material.filename,
      detail: `Downloaded ${formatSize(material.fileSize)}`,
    });
  };

  // Styling helpers
  const bg = isDark ? 'bg-slate-900' : 'bg-white';
  const border = isDark ? 'border-slate-700' : 'border-slate-200';
  const headerBg = isDark ? 'bg-slate-800/80' : 'bg-slate-50/80';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const metaBg = isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50/80 border-slate-200/80';
  const metaItemBg = isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200';
  const tagBg = isDark ? 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50' : 'bg-indigo-50 text-indigo-700 border-indigo-100';
  const tabActive = isDark ? 'bg-slate-700 text-slate-100' : 'bg-white text-slate-900 shadow-sm';
  const tabInactive = isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700';
  const codeBlock = isDark ? 'bg-slate-950 text-slate-200 border-slate-800' : 'bg-slate-950 text-slate-200 border-slate-800';
  const inputCls = isDark ? 'bg-slate-700 border-slate-600 text-slate-200 focus:ring-blue-400' : 'border-slate-300 focus:ring-blue-500';

  // Find occurrences count for search query
  const occurrenceCount = searchQuery.trim() && material.extractedText
    ? (material.extractedText.match(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className={`rounded-3xl shadow-2xl border w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-colors duration-300 ${bg} ${border}`}>

        {/* ─── Header ──────────────────────────────────────────────── */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${headerBg} ${border}`}>
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-extrabold line-clamp-1 tracking-tight ${text}`}>
                <HighlightedText text={material.filename} query={searchQuery} />
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${isDark ? 'text-indigo-400 bg-indigo-900/40 border-indigo-700/50' : 'text-indigo-600 bg-indigo-50 border-indigo-100'}`}>
                  {material.fileType}
                </span>
                <span className={`text-xs font-medium ${subtext}`}>{formatSize(material.fileSize)}</span>
                {searchQuery.trim() && occurrenceCount > 0 && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Hash className="w-2.5 h-2.5" />
                    {occurrenceCount} match{occurrenceCount !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* AI Summary Button */}
            <button
              onClick={handleGenerateSummary}
              disabled={isGeneratingSummary}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${isDark ? 'text-purple-300 bg-purple-900/30 border-purple-700/50 hover:bg-purple-900/50' : 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100'} ${isGeneratingSummary ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGeneratingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {t('summary.generate')}
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'}`}
              aria-label={t('document.closeInspector')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Tab Bar ─────────────────────────────────────────────── */}
        <div className={`flex gap-1 px-6 pt-3 border-b ${border} ${headerBg}`}>
          {[
            { id: 'content' as TabType, label: t('nav.library'), icon: BookOpen },
            { id: 'summary' as TabType, label: t('summary.title').split(' ')[0] + ' ' + t('summary.title').split(' ')[1], icon: Sparkles },
            { id: 'quiz' as TabType, label: t('quiz.tabLabel'), icon: Brain },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 -mb-px ${activeTab === id ? `${tabActive} border-blue-500` : `${tabInactive} border-transparent`}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === 'summary' && aiSummary && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-purple-500" />
              )}
            </button>
          ))}
        </div>

        {/* ─── Content Body ─────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Metadata Row */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border text-xs font-medium ${metaBg}`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border ${metaItemBg}`}>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold ${subtext}`}>Uploaded Date</p>
                <p className={`font-semibold ${text}`}>{new Date(material.uploadDate || material.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border ${metaItemBg}`}>
                <User className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold ${subtext}`}>Access Mode</p>
                <p className={`font-semibold ${text}`}>{isAdmin ? 'Faculty Administrator' : 'Student Viewer'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg border ${metaItemBg}`}>
                <Tag className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className={`text-[10px] uppercase font-bold ${subtext}`}>Document Status</p>
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                  {material.status}
                </span>
              </div>
            </div>
          </div>

          {/* ── CONTENT TAB ───────────────────────────────────────── */}
          {activeTab === 'content' && (
            <>
              {/* Description & Tags */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-extrabold tracking-tight ${text}`}>Description & Tags</h3>
                  {isAdmin && !isEditingTags && (
                    <button
                      onClick={() => setIsEditingTags(true)}
                      className={`text-xs font-bold flex items-center gap-1 transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Metadata
                    </button>
                  )}
                </div>

                {isEditingTags ? (
                  <div className={`space-y-3 p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${text}`}>Description</label>
                      <textarea
                        value={descInput}
                        onChange={(e) => setDescInput(e.target.value)}
                        rows={2}
                        className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:ring-2 font-medium ${inputCls} ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-white'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold mb-1 ${text}`}>Tags (comma separated)</label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className={`w-full text-xs p-3 rounded-xl border focus:outline-none focus:ring-2 font-medium ${inputCls} ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-white'}`}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEditingTags(false)} className={`px-4 py-2 text-xs font-bold rounded-xl border ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 bg-white border-slate-300'}`}>Cancel</button>
                      <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-1 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className={`text-xs leading-relaxed p-4 rounded-2xl border font-medium ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-slate-50/60 border-slate-200/60 text-slate-600'}`}>
                      {material.description || 'No detailed description provided for this learning material.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {material.tags && material.tags.length > 0 ? (
                        material.tags.map((t, idx) => (
                          <span key={idx} className={`px-3 py-1 rounded-full text-xs font-semibold border ${tagBg}`}>#{t}</span>
                        ))
                      ) : (
                        <span className={`text-xs italic ${subtext}`}>No category tags attached</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Text with Highlight */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className={`text-sm font-extrabold flex items-center gap-2 ${text}`}>
                    <Eye className="w-4 h-4 text-blue-500" />
                    Extracted Document Content
                  </h3>
                  <div className="flex items-center gap-2">
                    <TextSizeControls currentSize={textSize} onChange={setTextSize} />
                    {material.extractedText && (
                      <SpeechPlayer text={material.extractedText.slice(0, 3000)} lang={summaryLanguage} compact label="Read Document" />
                    )}
                    {searchQuery.trim() && occurrenceCount > 0 && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        {occurrenceCount} keyword match{occurrenceCount !== 1 ? 'es' : ''} highlighted
                      </span>
                    )}
                  </div>
                </div>
                <div className={`p-5 rounded-2xl font-mono max-h-64 overflow-y-auto leading-relaxed border shadow-inner ${codeBlock} ${getTextSizeClass(textSize)}`}>
                  <HighlightedText
                    text={material.extractedText || 'Extracted document text processing complete.'}
                    query={searchQuery}
                  />
                </div>
              </div>
            </>
          )}

          {/* ── AI SUMMARY TAB ──────────────────────────────────────── */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-extrabold ${text}`}>{t('summary.title')}</h3>
                    <p className={`text-xs ${subtext}`}>{t('summary.subtitle')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Language Selector */}
                  <div className="flex items-center gap-1">
                    {(['en', 'hi', 'mr'] as AppLanguage[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => setSummaryLanguage(l)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          summaryLanguage === l
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : isDark ? 'text-slate-300 border-slate-600 hover:border-purple-500' : 'text-slate-600 border-slate-300 hover:border-purple-400'
                        }`}
                      >
                        {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'मराठी'}
                      </button>
                    ))}
                  </div>

                  <TextSizeControls currentSize={textSize} onChange={setTextSize} />

                  {aiSummary && (
                    <SpeechPlayer text={aiSummary} lang={summaryLanguage} compact label="Listen" />
                  )}
                </div>
              </div>

              {/* Study Mode Pills */}
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                {[
                  { mode: 'summary' as StudyMode, label: t('summary.modeOverview', 'Overview') },
                  { mode: 'simplified' as StudyMode, label: t('summary.modeSimplified', 'Simplified (ELI5)') },
                  { mode: 'key_concepts' as StudyMode, label: t('summary.modeKeyConcepts', 'Key Concepts') },
                  { mode: 'revision_points' as StudyMode, label: t('summary.modeRevisionPoints', 'Revision Notes') },
                  { mode: 'chapter_breakdown' as StudyMode, label: t('summary.modeChapterBreakdown', 'Section Breakdown') },
                  { mode: 'revision_questions' as StudyMode, label: t('summary.modeRevisionQuestions', 'Study Questions') },
                ].map(({ mode, label }) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setStudyMode(mode);
                      handleGenerateSummary(mode);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                      studyMode === mode
                        ? 'bg-purple-600 text-white shadow-sm'
                        : isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {isGeneratingSummary ? (
                <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center gap-4 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-purple-50/60 border-purple-200/60'}`}>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                    <Sparkles className="w-5 h-5 text-purple-600 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${text}`}>{t('summary.generating')}</p>
                    <p className={`text-xs mt-1 ${subtext}`}>{t('summary.generatingSubtitle')}</p>
                  </div>
                  <div className="flex gap-1">
                    {[0, 150, 300].map((delay) => (
                      <div key={delay} className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </div>
              ) : summaryError ? (
                <div className={`p-8 rounded-2xl border flex flex-col items-center gap-4 text-center ${isDark ? 'bg-red-900/20 border-red-700/50' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-sm font-bold text-red-500">{t('summary.error')}</p>
                  <p className={`text-xs ${subtext}`}>{summaryError}</p>
                  <button onClick={() => handleGenerateSummary()} className="text-xs font-bold text-purple-600 hover:text-purple-700">{t('summary.retry')}</button>
                </div>
              ) : aiSummary ? (
                <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-gradient-to-br from-purple-50/60 to-indigo-50/60 border-purple-200/60'} ${getTextSizeClass(textSize)}`}>
                  {aiSummary.split('\n\n').map((block, i) => {
                    if (block.startsWith('**') && block.endsWith('**')) {
                      return <h4 key={i} className={`font-extrabold uppercase tracking-wider ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{block.replace(/\*\*/g, '')}</h4>;
                    }
                    if (block.startsWith('**')) {
                      const [heading, ...rest] = block.split('\n');
                      return (
                        <div key={i}>
                          <h4 className={`font-extrabold uppercase tracking-wider mb-2 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{heading.replace(/\*\*/g, '')}</h4>
                          <div className="space-y-1.5">
                            {rest.map((line, j) => (
                              <p key={j} className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'} ${line.startsWith('•') ? 'pl-2' : ''}`}>{line}</p>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return <p key={i} className={`leading-relaxed italic ${subtext}`}>{block.replace(/\*/g, '')}</p>;
                  })}
                </div>
              ) : (
                <div className={`p-10 rounded-2xl border flex flex-col items-center justify-center gap-4 text-center ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <Sparkles className={`w-12 h-12 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                  <div>
                    <p className={`text-sm font-bold ${text}`}>{t('summary.noSummary')}</p>
                    <p className={`text-xs mt-1 ${subtext}`}>{t('summary.noSummaryHint')}</p>
                  </div>
                  <button
                    id="generate-summary-btn"
                    onClick={() => handleGenerateSummary()}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl shadow-md shadow-purple-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {t('summary.generate')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── QUIZ TAB ──────────────────────────────────────────────── */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-violet-900/40 text-violet-400' : 'bg-violet-100 text-violet-600'}`}>
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold ${text}`}>AI Quiz Generator</h3>
                  <p className={`text-xs ${subtext}`}>Test your understanding with document-grounded questions</p>
                </div>
              </div>
              <div className={`p-8 rounded-2xl border flex flex-col items-center gap-5 text-center ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-violet-50/60 border-violet-200/60'}`}>
                <Brain className={`w-12 h-12 ${isDark ? 'text-violet-500' : 'text-violet-400'}`} />
                <div>
                  <p className={`text-sm font-bold ${text}`}>Ready to test your knowledge?</p>
                  <p className={`text-xs mt-1 max-w-xs ${subtext}`}>
                    Generate a quiz with 5, 10, or 15 questions in multiple choice or true/false format, in English, Hindi, or Marathi.
                  </p>
                </div>
                <button
                  id="open-quiz-btn"
                  onClick={() => setShowQuiz(true)}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-extrabold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 rounded-xl shadow-md shadow-violet-500/20 transition-all"
                >
                  <Brain className="w-4 h-4" />
                  Start Quiz
                </button>
              </div>
              {showQuiz && (
                <QuizModal document={material} onClose={() => setShowQuiz(false)} />
              )}
            </div>
          )}
        </div>

        {/* ─── Footer ──────────────────────────────────────────────── */}
        <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${headerBg} ${border}`}>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-all ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-100'}`}
            >
              {t('document.closeInspector')}
            </button>
            <button
              onClick={() => setFeedbackOpen(true)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all ${isDark ? 'text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800' : 'text-slate-500 border-slate-200 hover:text-slate-800 hover:bg-slate-100'}`}
              title="Report an issue with this document, summary, or translation"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-500" />
              <span>Report Issue</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate(`/library/learn/${material.id}`);
              }}
              className="px-4 py-2.5 text-xs font-bold text-indigo-100 bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-500/40 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Smart Learning Path</span>
            </button>

            <a
              href={api.getDownloadUrl(material.id)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDownload}
              aria-label={t('document.downloadSize', { size: formatSize(material.fileSize) })}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('document.downloadSize', { size: formatSize(material.fileSize) })}
            </a>
          </div>
        </div>
      </div>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        documentId={material.id}
        documentTitle={material.filename}
      />
    </div>
  );
};

