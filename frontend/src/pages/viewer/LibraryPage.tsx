import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, RefreshCw, BookOpen } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';
import { MaterialCard } from '../../components/materials/MaterialCard';
import { MaterialModal } from '../../components/materials/MaterialModal';
import { MaterialCardSkeleton } from '../../components/ui/SkeletonLoaders';

export const LibraryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedFileType, setSelectedFileType] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [materials, setMaterials] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Document | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, [searchParams]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const cat = searchParams.get('category') || '';
      const type = selectedFileType;

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
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedFileType('');
    setSearchParams({});
  };

  const sortedMaterials = [...materials].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.uploadDate || b.createdAt).getTime() - new Date(a.uploadDate || a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.uploadDate || a.createdAt).getTime() - new Date(b.uploadDate || b.createdAt).getTime();
    }
    return a.filename.localeCompare(b.filename);
  });

  const categoriesOptions = [
    'Programming',
    'Artificial Intelligence',
    'Machine Learning',
    'Excel',
    'Web Development',
    'Computer Networks',
    'Data Structures',
    'Prompt Engineering',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Learning Library</h1>
          <p className="text-xs text-slate-500">Explore all available educational learning resources.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleFilterSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search filename or text..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                const params: Record<string, string> = {};
                if (searchQuery.trim()) params.q = searchQuery.trim();
                if (e.target.value) params.category = e.target.value;
                setSearchParams(params);
              }}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Categories</option>
              {categoriesOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All File Formats</option>
              <option value="pdf">PDF Books (.pdf)</option>
              <option value="docx">Word Docs (.docx)</option>
              <option value="txt">Text & Markdown (.txt / .md)</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {sortedMaterials.length} material(s)</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg bg-white flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <MaterialCardSkeleton />
          <MaterialCardSkeleton />
          <MaterialCardSkeleton />
        </div>
      ) : sortedMaterials.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-800">No materials found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or clearing active category filters.
          </p>
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
              onView={(item) => setSelectedMaterial(item)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3">Material Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Format</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{mat.filename}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 capitalize">
                      {mat.tags && mat.tags[0] ? mat.tags[0] : 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] uppercase text-slate-600">{mat.fileType}</td>
                  <td className="px-4 py-3 text-slate-500">{(mat.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(mat.uploadDate || mat.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setSelectedMaterial(mat)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 rounded-md"
                    >
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
        onClose={() => setSelectedMaterial(null)}
      />
    </div>
  );
};
