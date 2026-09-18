import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Upload, LayoutGrid, List, FileText, FileCode, HardDrive, BookOpen, X, Filter } from 'lucide-react';
import type { Document, SystemStatus } from '../types';
import { api } from '../services/api';
import { StatsCard } from '../components/StatsCard';
import { DocumentCard } from '../components/DocumentCard';
import { DocumentTable } from '../components/DocumentTable';
import { DocumentViewerModal } from '../components/DocumentViewerModal';
import type { ToastMessage } from '../components/Toast';

interface DashboardPageProps {
  setToast: (toast: ToastMessage | null) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setToast }) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedTag, selectedType]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docs, sysStatus] = await Promise.all([
        api.getDocuments(searchQuery, selectedTag || undefined, selectedType || undefined),
        api.getSettings(),
      ]);
      setDocuments(docs);
      setStatus(sysStatus);
    } catch (err) {
      console.error('Failed to load library data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc: Document) => {
    const link = window.document.createElement('a');
    link.href = api.getDownloadUrl(doc.id);
    link.download = doc.filename;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleDelete = async (doc: Document) => {
    if (window.confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
      try {
        await api.deleteDocument(doc.id);
        setToast({ type: 'success', id: Date.now().toString(), text: `Deleted "${doc.filename}" successfully.` });
        if (selectedDoc?.id === doc.id) {
          setSelectedDoc(null);
        }
        loadData();
      } catch (err) {
        setToast({ type: 'error', id: Date.now().toString(), text: 'Failed to delete document.' });
      }
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Collect unique tags across all documents for quick tag filter chips
  const allTags = Array.from(new Set(documents.flatMap((d) => d.tags || [])));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Digital Library</h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize, search, and manage your uploaded knowledge documents.
          </p>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Documents"
          value={status?.totalDocuments || 0}
          subtitle="Indexed in library"
          icon={BookOpen}
          color="sky"
        />
        <StatsCard
          title="PDF Documents"
          value={status?.pdfCount || 0}
          subtitle="PDF text extracted"
          icon={FileText}
          color="indigo"
        />
        <StatsCard
          title="DOCX / Text"
          value={(status?.docxCount || 0) + (status?.txtCount || 0)}
          subtitle="Word & Markdown"
          icon={FileCode}
          color="emerald"
        />
        <StatsCard
          title="Storage Used"
          value={formatBytes(status?.totalStorageBytes)}
          subtitle="Local file storage"
          icon={HardDrive}
          color="amber"
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your library by filename, tag, or content..."
              className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter Select */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={selectedType || ''}
                onChange={(e) => setSelectedType(e.target.value || null)}
                className="appearance-none bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-xl px-4 py-3 pr-8 focus:outline-none focus:border-sky-500"
              >
                <option value="">All Formats</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="txt">TXT</option>
                <option value="md">Markdown (.md)</option>
              </select>
              <Filter className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* View Mode Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tag Filters Pills Bar */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
            <span className="text-xs font-semibold uppercase text-slate-400">Filter Tags:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTag === tag
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-rose-400 hover:underline ml-2"
              >
                Clear Tag Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Document Grid / Table View */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading your digital library...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl py-16 px-6 text-center">
          <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
            <BookOpen className="w-8 h-8 text-sky-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-200">Your library is empty</h3>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1 mb-6">
            Upload your first PDF, DOCX, TXT, or Markdown document to start organizing and chatting.
          </p>
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20"
          >
            Upload your first document
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={(d) => setSelectedDoc(d)}
              onDownload={handleDownload}
              onDelete={handleDelete}
              onTagClick={(tag) => setSelectedTag(tag)}
            />
          ))}
        </div>
      ) : (
        <DocumentTable
          documents={documents}
          onView={(d) => setSelectedDoc(d)}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onTagClick={(tag) => setSelectedTag(tag)}
        />
      )}

      {/* Document Inspector Modal */}
      <DocumentViewerModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onUpdated={loadData}
        onDownload={handleDownload}
      />
    </div>
  );
};
