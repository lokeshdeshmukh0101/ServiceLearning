import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareWarning,
  Search,
  Clock,
  CheckCircle2,
  RefreshCw,
  Star,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  X,
  FileText,
  Save,
  User,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api';
import { AdminNavTabs } from '../../components/navigation/AdminNavTabs';
import { MaterialModal } from '../../components/materials/MaterialModal';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import type { Document } from '../../types';

interface FeedbackReport {
  id: string;
  title: string;
  description: string;
  category: string;
  rating?: number;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  adminNotes?: string;
  submittedBy: string;
  hasScreenshot?: boolean;
  relatedDocumentId?: string;
  createdAt: string;
  updatedAt?: string;
}

const CATEGORIES = [
  'ALL',
  'AI Summary/Quiz Issue',
  'Translation Issue',
  'Accessibility Issue',
  'Broken File',
  'Incorrect Content',
  'Feature Request',
  'Other',
];

export const ManageReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { showSuccess, showError } = useToast();

  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Editing state
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [editingStatus, setEditingStatus] = useState<Record<string, FeedbackReport['status']>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Modals
  const [screenshotModalUrl, setScreenshotModalUrl] = useState<string | null>(null);
  const [documentsMap, setDocumentsMap] = useState<Record<string, Document>>({});
  const [activeMaterial, setActiveMaterial] = useState<Document | null>(null);

  useEffect(() => {
    loadReports();
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      const map: Record<string, Document> = {};
      docs.forEach((doc) => {
        map[doc.id] = doc;
      });
      setDocumentsMap(map);
    } catch {
      // Quiet fail if offline
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.listFeedback();
      const fetchedReports = data.reports || [];
      setReports(fetchedReports);

      // Initialize editing states
      const notesMap: Record<string, string> = {};
      const statusMap: Record<string, FeedbackReport['status']> = {};
      fetchedReports.forEach((r: FeedbackReport) => {
        notesMap[r.id] = r.adminNotes || '';
        statusMap[r.id] = r.status;
      });
      setEditingNotes(notesMap);
      setEditingStatus(statusMap);
    } catch (err) {
      console.error('Failed to load reports:', err);
      showError('Failed to load reports from server.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.listFeedback();
      const fetchedReports = data.reports || [];
      setReports(fetchedReports);
      const notesMap: Record<string, string> = {};
      const statusMap: Record<string, FeedbackReport['status']> = {};
      fetchedReports.forEach((r: FeedbackReport) => {
        notesMap[r.id] = r.adminNotes || '';
        statusMap[r.id] = r.status;
      });
      setEditingNotes(notesMap);
      setEditingStatus(statusMap);
      showSuccess('Report list refreshed.');
    } catch (err) {
      console.error('Failed to refresh reports:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveReport = async (reportId: string) => {
    setSavingId(reportId);
    try {
      const newStatus = editingStatus[reportId];
      const newNotes = editingNotes[reportId];

      const res = await api.updateFeedback(reportId, {
        status: newStatus,
        adminNotes: newNotes,
      });

      // Update state in place
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: newStatus, adminNotes: newNotes, updatedAt: new Date().toISOString() } : r
        )
      );

      showSuccess('Issue report updated successfully!', 'Saved');
    } catch (err: any) {
      showError(err?.response?.data?.error || 'Failed to update report.');
    } finally {
      setSavingId(null);
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.adminNotes && r.adminNotes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [reports, statusFilter, categoryFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((r) => r.status === 'Open').length;
    const inProgress = reports.filter((r) => r.status === 'In Progress').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const closed = reports.filter((r) => r.status === 'Closed').length;
    return { total, open, inProgress, resolved, closed };
  }, [reports]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Navigation Tabs */}
      <AdminNavTabs />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-rose-900/20 border border-amber-500/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <MessageSquareWarning className="w-7 h-7" />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('nav.manageReports', 'Reported Issues & Feedback')}
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Manage student-reported issues, track problem resolution, and communicate fixes.
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-2 self-start md:self-auto ${
            isDark
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200/80'}`}>
          <div className="text-xs font-medium text-slate-400">Total Reports</div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">{stats.total}</div>
        </div>
        <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200/80'}`}>
          <div className="text-xs font-medium text-slate-400">Open / Pending</div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{stats.open}</div>
        </div>
        <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200/80'}`}>
          <div className="text-xs font-medium text-slate-400">In Progress</div>
          <div className="text-2xl font-extrabold text-indigo-400 mt-1">{stats.inProgress}</div>
        </div>
        <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200/80'}`}>
          <div className="text-xs font-medium text-slate-400">Resolved</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{stats.resolved}</div>
        </div>
        <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200/80'}`}>
          <div className="text-xs font-medium text-slate-400">Closed</div>
          <div className="text-2xl font-extrabold text-slate-400 mt-1">{stats.closed}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full md:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition-all ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-amber-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500 focus:bg-white'
              }`}
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs border outline-none w-full sm:w-auto font-medium ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-amber-500'
                : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-amber-500'
            }`}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Categories' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm'
                  : isDark
                  ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700/60'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading student reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'}`}>
          <div className="w-14 h-14 rounded-2xl bg-slate-700/30 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-400" />
          </div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            No Reports Found
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
              ? 'No reports match your selected filters. Try clearing your search or category filters.'
              : 'Great job! There are currently no reports submitted by students.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const relatedDoc = report.relatedDocumentId ? documentsMap[report.relatedDocumentId] : null;
            const currentStatus = editingStatus[report.id] || report.status;
            const currentNotes = editingNotes[report.id] ?? (report.adminNotes || '');
            const isSaving = savingId === report.id;

            return (
              <div
                key={report.id}
                className={`p-6 rounded-2xl border transition-all duration-200 space-y-4 ${
                  isDark
                    ? 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/40">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {report.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: #{report.id.slice(0, 8)}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-700/40 px-2 py-0.5 rounded-md">
                      <User className="w-3 h-3" />
                      <span>Reporter: {report.submittedBy}</span>
                    </span>
                    {report.rating && (
                      <div className="flex items-center gap-0.5 ml-1">
                        {[...Array(report.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(report.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {report.title}
                  </h3>
                  <p className={`text-xs whitespace-pre-wrap leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {report.description}
                  </p>
                </div>

                {/* Attachments / Links */}
                <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                  {relatedDoc && (
                    <button
                      onClick={() => setActiveMaterial(relatedDoc)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-medium transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Document: {relatedDoc.filename}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>
                  )}

                  {report.hasScreenshot && (
                    <button
                      onClick={() => setScreenshotModalUrl(api.getScreenshotUrl(report.id))}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-medium transition-colors"
                    >
                      <span>View Student Screenshot</span>
                    </button>
                  )}
                </div>

                {/* Admin Management Section */}
                <div className="mt-4 p-4 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Status & Resolution Controls</span>
                    </div>

                    {/* Status Selector */}
                    <div className="flex items-center gap-1.5">
                      {(['Open', 'In Progress', 'Resolved', 'Closed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setEditingStatus((prev) => ({ ...prev, [report.id]: st }))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            currentStatus === st
                              ? st === 'Open'
                                ? 'bg-amber-500 text-white shadow-xs'
                                : st === 'In Progress'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : st === 'Resolved'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-600 text-white shadow-xs'
                              : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Admin Notes Input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Resolution Note for Student (visible on student's report dashboard)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Reviewed document translation; error corrected in revision 1.2."
                      value={currentNotes}
                      onChange={(e) =>
                        setEditingNotes((prev) => ({ ...prev, [report.id]: e.target.value }))
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSaveReport(report.id)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                    >
                      {isSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Screenshot Preview Modal */}
      {screenshotModalUrl && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
          onClick={() => setScreenshotModalUrl(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl p-4 max-w-2xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">Attached Screenshot</h4>
              <button
                onClick={() => setScreenshotModalUrl(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 flex justify-center bg-slate-950 rounded-xl p-2 overflow-hidden max-h-[70vh]">
              <img
                src={screenshotModalUrl}
                alt="Student Screenshot"
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {activeMaterial && (
        <MaterialModal
          material={activeMaterial}
          onClose={() => setActiveMaterial(null)}
        />
      )}
    </div>
  );
};
