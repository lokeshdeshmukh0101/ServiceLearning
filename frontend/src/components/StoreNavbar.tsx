import React from 'react';
import { Search, BookOpen, HardDrive, Shield, Layout, Sparkles, Filter } from 'lucide-react';
import type { SystemStatus } from '../types';

interface StoreNavbarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  viewMode: 'storefront' | 'admin';
  setViewMode: (mode: 'storefront' | 'admin') => void;
  status: SystemStatus | null;
}

export const StoreNavbar: React.FC<StoreNavbarProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  viewMode,
  setViewMode,
  status,
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner Bar */}
      <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 text-white text-xs py-1.5 px-6 flex items-center justify-between font-medium">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Welcome to View Console — Instant public access to digital library documents
        </span>
        <div className="flex items-center gap-4">
          <span className="font-mono text-sky-200">{status?.totalDocuments || 0} Documents Available</span>
          <span className="hidden sm:inline">|</span>
          <span className="hidden sm:inline text-sky-100">SQLite Powered</span>
        </div>
      </div>

      {/* Main Search & Navigation Header (View Console) */}
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          onClick={() => setViewMode('storefront')}
          className="flex items-center gap-3 cursor-pointer group flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Layout className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
              view<span className="text-sky-400">console</span>
            </span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">
              Digital Library Portal
            </span>
          </div>
        </div>

        {/* Search Bar with Category Selector */}
        <div className="flex-1 max-w-2xl flex items-center bg-slate-900 rounded-2xl border border-slate-800 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all overflow-hidden">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 text-slate-300 text-xs px-3 py-3 border-r border-slate-800 focus:outline-none cursor-pointer hidden md:block"
          >
            <option value="">All Formats</option>
            <option value="pdf">PDF Books</option>
            <option value="docx">Word Documents</option>
            <option value="txt">Text & Markdown</option>
          </select>
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents, notes, topics, or tags (e.g., Computer Networks, CIDR)..."
              className="w-full pl-4 pr-10 py-2.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>
          <button className="bg-sky-500 hover:bg-sky-400 text-white px-5 py-3 flex items-center justify-center transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Toggle Pill */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setViewMode(viewMode === 'storefront' ? 'admin' : 'storefront')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border shadow-sm ${
              viewMode === 'storefront'
                ? 'bg-slate-900 hover:bg-slate-800 text-sky-400 border-slate-800'
                : 'bg-sky-500 text-white border-sky-400 shadow-sky-500/20'
            }`}
          >
            {viewMode === 'storefront' ? (
              <>
                <Shield className="w-4 h-4 text-sky-400" /> Switch to Admin Upload Portal
              </>
            ) : (
              <>
                <Layout className="w-4 h-4" /> Back to View Console
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
