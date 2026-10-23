import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, RefreshCw, BookOpen, Sparkles } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';
import { MaterialCard } from '../../components/materials/MaterialCard';
import { MaterialModal } from '../../components/materials/MaterialModal';
import { MaterialCardSkeleton } from '../../components/ui/SkeletonLoaders';
import { useAudit } from '../../context/AuditContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// ─── Highlight Helper ───────────────────────────────────────────────────────
function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5 font-bold not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const LibraryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialFileType = searchParams.get('type') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [appliedQuery, setAppliedQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedFileType, setSelectedFileType] = useState(initialFileType);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'format'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [materials, setMaterials] = useState<Document[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Document | null>(null);

  const { addLog } = useAudit();
  const { user } = useAuth();
  const { isDark } = useTheme();

  useEffect(() => {
    fetchMaterials();
  }, [searchParams, selectedFileType]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await api.getCategories();
      if (Array.isArray(cats)) {
        setCategories(cats);
      }
    } catch (err) {
      console.error('Failed to load categories for library:', err);
    }
  };

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || searchQuery;
      const cat = searchParams.get('category') || selectedCategory;
      const type = searchParams.get('type') || selectedFileType;
      const docs = await api.getDocuments(q, cat, type);
      setMaterials(docs);
    } catch (err) {
      console.error('Failed to fetch library documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string> = {};
    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (selectedCategory) params.category = selectedCategory;
    if (selectedFileType) params.type = selectedFileType;
    setSearchParams(params);
    setAppliedQuery(searchQuery.trim());

    if (searchQuery.trim()) {
      addLog({
        actor: user?.name || 'Student',
        actorRole: 'VIEWER',
        action: 'SEARCH',
        target: searchQuery.trim(),
        detail: `Searched in Library${selectedCategory ? ` (category: ${selectedCategory})` : ''}`,
      });
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setAppliedQuery('');
    setSelectedCategory('');
    setSelectedFileType('');
    setSortBy('newest');
    setSearchParams({});
  };

  const sortedMaterials = [...materials].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.uploadDate || b.createdAt).getTime() - new Date(a.uploadDate || a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.uploadDate || a.createdAt).getTime() - new Date(b.uploadDate || b.createdAt).getTime();
    if (sortBy === 'format') {
      const fc = (a.fileType || '').localeCompare(b.fileType || '');
      return fc !== 0 ? fc : a.filename.localeCompare(b.filename);
    }
    return a.filename.localeCompare(b.filename);
  });

  const categoriesOptions = categories.map((c) => c.name);

  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const inputCls = isDark
    ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400 focus:ring-blue-400/30 focus:border-blue-400'
    : 'border-slate-300 bg-white text-slate-700 focus:ring-blue-600/10 focus:border-blue-500';
  const selectCls = isDark
    ? 'bg-slate-700 border-slate-600 text-slate-200'
    : 'bg-white border-slate-300 text-slate-700';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-2xl font-bold ${text}`}>Learning Library</h1>
          <p className={`text-xs mt-0.5 ${subtext}`}>
            Explore all available educational learning resources.
            {appliedQuery && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[11px] font-bold">
                <Search className="w-3 h-3" />
                Showing results for: &quot;{appliedQuery}&quot;
              </span>
            )}
          </p>
        </div>

        <div className={`flex items-center gap-2 p-1 rounded-lg border self-start md:self-auto ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? (isDark ? 'bg-slate-700 text-blue-400 shadow-sm' : 'bg-white text-blue-700 shadow-sm') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
          >
            <Grid className="w-4 h-4" /><span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${viewMode === 'list' ? (isDark ? 'bg-slate-700 text-blue-400 shadow-sm' : 'bg-white text-blue-700 shadow-sm') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900')}`}
          >
            <List className="w-4 h-4" /><span>List</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleFilterSubmit} className={`p-4 rounded-2xl border shadow-xs space-y-3 ${card}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename or text..."
              className={`w-full pl-9 pr-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 ${inputCls}`}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              const params: Record<string, string> = {};
              if (searchQuery.trim()) params.q = searchQuery.trim();
              if (e.target.value) params.category = e.target.value;
              setSearchParams(params);
            }}
            className={`w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${selectCls}`}
          >
            <option value="">All Categories</option>
            {categoriesOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className={`w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${selectCls}`}
          >
            <option value="">All File Formats</option>
            <option value="pdf">PDF Books (.pdf)</option>
            <option value="docx">Word Docs (.docx)</option>
            <option value="txt">Text & Markdown (.txt / .md)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className={`w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 ${selectCls}`}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name">Sort: Alphabetical (A-Z)</option>
            <option value="format">Sort: File Format</option>
          </select>
        </div>

        <div className={`flex items-center justify-between pt-2 border-t text-xs ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
          <span>Showing <strong className={text}>{sortedMaterials.length}</strong> material(s)</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className={`px-3 py-1.5 text-xs border rounded-lg flex items-center gap-1 transition-colors ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-300 bg-white hover:bg-slate-50'}`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <MaterialCardSkeleton /><MaterialCardSkeleton /><MaterialCardSkeleton />
        </div>
      ) : sortedMaterials.length === 0 ? (
        <div className={`p-12 rounded-xl border text-center space-y-3 ${card}`}>
          <BookOpen className={`w-12 h-12 mx-auto ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
          <h3 className={`text-lg font-semibold ${text}`}>No materials found</h3>
          <p className={`text-xs max-w-sm mx-auto ${subtext}`}>Try adjusting your search keywords or clearing active filters.</p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
          >
            Clear Active Search & Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {sortedMaterials.map((mat) => (
            <MaterialCard
              key={mat.id}
              material={mat}
              searchQuery={appliedQuery}
              onView={(item) => setSelectedMaterial(item)}
            />
          ))}
        </div>
      ) : (
        <div className={`rounded-2xl border overflow-hidden shadow-xs ${card}`}>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider ${isDark ? 'bg-slate-900/60 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="px-4 py-3 cursor-pointer hover:text-blue-500" onClick={() => setSortBy('name')}>Material Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 cursor-pointer hover:text-blue-500" onClick={() => setSortBy('format')}>Format {sortBy === 'format' && '▼'}</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3 cursor-pointer hover:text-blue-500" onClick={() => setSortBy('newest')}>Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-slate-100'}`}>
              {sortedMaterials.map((mat) => (
                <tr key={mat.id} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50'}`}>
                  <td className={`px-4 py-3 font-semibold ${text}`}>
                    {highlight(mat.filename, appliedQuery)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] capitalize ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                      {mat.tags && mat.tags[0] ? mat.tags[0] : 'General'}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-mono text-[11px] uppercase ${isDark ? 'text-indigo-400' : 'text-slate-600'}`}>{mat.fileType}</td>
                  <td className={`px-4 py-3 ${subtext}`}>{(mat.fileSize / 1024).toFixed(1)} KB</td>
                  <td className={`px-4 py-3 ${subtext}`}>{new Date(mat.uploadDate || mat.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedMaterial(mat)}
                      className="px-3 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Sparkles className="w-3 h-3" />
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MaterialModal
        material={selectedMaterial}
        searchQuery={appliedQuery}
        onClose={() => setSelectedMaterial(null)}
      />
    </div>
  );
};
