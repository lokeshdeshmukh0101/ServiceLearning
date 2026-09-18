import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles, Filter, Search, Tag as TagIcon, ArrowRight, ShieldCheck, Download, Star, Layout } from 'lucide-react';
import type { Document, SystemStatus } from '../types';
import { api } from '../services/api';
import { AmazonBookCard } from '../components/AmazonBookCard';
import { DocumentViewerModal } from '../components/DocumentViewerModal';

interface StorefrontPageProps {
  searchQuery: string;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  status: SystemStatus | null;
  onNavigateToUpload: () => void;
}

export const StorefrontPage: React.FC<StorefrontPageProps> = ({
  searchQuery,
  selectedCategory,
  setSelectedCategory,
  status,
  onNavigateToUpload,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedCategory, selectedTag]);

  const loadData = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocuments(
        searchQuery,
        selectedTag || undefined,
        selectedCategory || undefined
      );
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to fetch console documents:', err);
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
    if (window.confirm(`Are you sure you want to delete "${doc.filename}" from the library?`)) {
      try {
        await api.deleteDocument(doc.id);
        if (selectedDoc?.id === doc.id) {
          setSelectedDoc(null);
        }
        loadData();
      } catch (err) {
        alert('Failed to delete document from database.');
      }
    }
  };

  const allTags = Array.from(new Set(documents.flatMap((d) => d.tags || [])));
  const totalCount = status?.totalDocuments !== undefined ? status.totalDocuments : documents.length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* View Console Hero Promo Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-950 border border-sky-500/20 p-8 md:p-12 shadow-2xl">
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Digital Library View Console
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Explore Digital Books, Notes & Research Documents
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Instant public access to verified academic materials. Read extracted text online or download files directly.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('catalog-grid');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-sm shadow-xl shadow-sky-500/25 transition-all flex items-center gap-2"
            >
              <Layout className="w-4 h-4" /> Explore Catalog ({totalCount})
            </button>
            <button
              onClick={onNavigateToUpload}
              className="px-6 py-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
            >
              Upload New Document
            </button>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-400 via-indigo-500 to-transparent pointer-events-none" />
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase text-slate-400 font-mono mr-2">Formats:</span>
          {[
            { label: 'All Formats', value: '' },
            { label: 'PDF Books', value: 'pdf' },
            { label: 'Word Documents', value: 'docx' },
            { label: 'Text & Markdown', value: 'txt' },
          ].map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat.value
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold uppercase text-slate-400 font-mono mr-1">Tags:</span>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedTag === tag
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                #{tag}
              </button>
            ))}
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-rose-400 hover:underline ml-1"
              >
                Clear Tag
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Catalog Grid */}
      <div id="catalog-grid" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            View Console Catalog
            <span className="text-xs font-mono font-normal text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              {documents.length} document(s)
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading View Console...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl py-16 px-6 text-center">
            <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700">
              <BookOpen className="w-8 h-8 text-sky-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-200">No documents found</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mt-1 mb-6">
              No digital books or documents match your search query. Try clearing your search or upload a new file.
            </p>
            <button
              onClick={onNavigateToUpload}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-sky-500/20"
            >
              Upload Document to View Console
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {documents.map((doc) => (
              <AmazonBookCard
                key={doc.id}
                document={doc}
                onRead={(d) => setSelectedDoc(d)}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reader Modal */}
      <DocumentViewerModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onUpdated={loadData}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
};
