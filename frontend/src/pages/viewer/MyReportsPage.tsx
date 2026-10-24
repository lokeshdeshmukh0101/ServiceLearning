import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareWarning,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Star,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { FeedbackModal } from '../../components/feedback/FeedbackModal';
import { MaterialModal } from '../../components/materials/MaterialModal';
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
  hasScreenshot?: boolean;
  relatedDocumentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export const MyReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [reports, setReports] = useState<FeedbackReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [screenshotModalUrl, setScreenshotModalUrl] = useState<string | null>(null);

  // Material inspection
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
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await api.listFeedback();
      setReports(data.reports || []);
    } catch (err) {
      console.error('Failed to refresh reports:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.adminNotes && r.adminNotes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [reports, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const open = reports.filter((r) => r.status === 'Open').length;
    const inProgress = reports.filter((r) => r.status === 'In Progress').length;
    const resolved = reports.filter((r) => r.status === 'Resolved' || r.status === 'Closed').length;
    return { total, open, inProgress, resolved };
  }, [reports]);

  const getStatusBadge = (status: FeedbackReport['status']) => {
    switch (status) {
      case 'Open':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Open (Under Review)</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Closed</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/20 border border-blue-500/20 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <MessageSquareWarning className="w-7 h-7" />
          </div>
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('nav.myReports', 'My Reported Issues')}
            </h1>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Track your reported issues, translation discrepancies, and admin resolution updates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Refresh reports"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Report New Issue</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-slate-800/60 border-slate-700/60' : 'bg-white border-slate-200/80'}`}>
          <div className="text-xs font-medium text-slate-400">Total Reported</div>
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
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-3 ${isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200'}`}>
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search your reports by title or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none transition-all ${
              isDark
                ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-500 focus:bg-white'
            }`}
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : isDark
                  ? 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700/60'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Reports' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading your reports...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border ${isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-white border-slate-200'}`}>
          <div className="w-14 h-14 rounded-2xl bg-slate-700/30 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            {searchQuery || statusFilter !== 'ALL' ? 'No matching reports found' : 'No reports filed yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'Found an error in a summary, quiz, broken file, or translation? File a report and track admin updates here.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>File an Issue Report</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const relatedDoc = report.relatedDocumentId ? documentsMap[report.relatedDocumentId] : null;

            return (
              <div
                key={report.id}
                className={`p-5 rounded-2xl border transition-all duration-200 ${
                  isDark
                    ? 'bg-slate-800/70 border-slate-700/80 hover:border-slate-600'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Top Row: Category, Date, Status */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-700/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {report.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: #{report.id.slice(0, 8)}
                    </span>
                    {report.rating && (
                      <div className="flex items-center gap-0.5 ml-1">
                        {[...Array(report.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {getStatusBadge(report.status)}
                  </div>
                </div>

                {/* Report Content */}
                <div className="pt-3 space-y-2">
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {report.title}
                  </h3>
                  <p className={`text-xs whitespace-pre-wrap leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {report.description}
                  </p>
                </div>

                {/* Document Reference & Screenshot Link */}
                <div className="flex flex-wrap items-center gap-3 pt-3 text-xs">
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
                      <span>View Attached Screenshot</span>
                    </button>
                  )}
                </div>

                {/* Admin Notes / Resolution Box */}
                {report.adminNotes && (
                  <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Admin Resolution Note:</span>
                    </div>
                    <p className="text-xs text-emerald-200/90 whitespace-pre-wrap pl-5.5">
                      {report.adminNotes}
                    </p>
                  </div>
                )}
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
                alt="Issue Screenshot"
                className="max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadReports();
        }}
      />

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
