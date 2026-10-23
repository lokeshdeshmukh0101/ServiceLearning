import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  BookOpen,
  Grid,
  Clock,
  Download,
  Code,
  Cpu,
  Brain,
  FileSpreadsheet,
  Globe,
  Network,
  Database,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Compass,
} from 'lucide-react';
import type { Document, SystemStatus } from '../../types';
import { api } from '../../services/api';
import { MaterialCard } from '../../components/materials/MaterialCard';
import { MaterialModal } from '../../components/materials/MaterialModal';
import { MaterialCardSkeleton } from '../../components/ui/SkeletonLoaders';

export const ViewerDashboardPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [materials, setMaterials] = useState<Document[]>([]);
  const [stats, setStats] = useState<SystemStatus | null>(null);
  const [liveCategories, setLiveCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Document | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [docs, sysStats, cats] = await Promise.all([
        api.getDocuments(),
        api.getSettings(),
        api.getCategories().catch(() => []),
      ]);
      setMaterials(docs);
      setStats(sysStats);
      if (cats && Array.isArray(cats)) {
        setLiveCategories(cats);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const CATEGORY_ICON_MAP: Record<string, any> = {
    Programming: Code,
    'Artificial Intelligence': Cpu,
    'Machine Learning': Brain,
    Excel: FileSpreadsheet,
    'Web Development': Globe,
    'Computer Networks': Network,
    'Data Structures': Database,
    'Prompt Engineering': Sparkles,
  };

  const CATEGORY_COLORS = [
    'bg-indigo-50 border-indigo-100 text-indigo-600',
    'bg-blue-50 border-blue-100 text-blue-600',
    'bg-violet-50 border-violet-100 text-violet-600',
    'bg-emerald-50 border-emerald-100 text-emerald-600',
    'bg-cyan-50 border-cyan-100 text-cyan-600',
    'bg-amber-50 border-amber-100 text-amber-600',
    'bg-rose-50 border-rose-100 text-rose-600',
    'bg-sky-50 border-sky-100 text-sky-600',
  ];

  const quickSearchTags = liveCategories.length > 0
    ? liveCategories.slice(0, 4).map((c) => c.name)
    : ['Python', 'SQL', 'Algorithms', 'React'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/library?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Banner with Modern Gradient Glow */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Ambient Background Glow Effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Service Learning Hub</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Explore Academic Resources & <span className="gradient-text">Study Materials</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Instant access to curated session documents, lab reference guides, and interactive AI study tools uploaded by faculty.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by topic, document name, or tag..."
              className="w-full pl-12 pr-28 py-3.5 text-xs md:text-sm bg-white/95 text-slate-900 rounded-2xl shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white placeholder-slate-400 transition-all font-medium"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md transition-all duration-200"
            >
              Search
            </button>
          </form>

          {/* Quick Search Tag Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-medium">Popular:</span>
            {quickSearchTags.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/library?q=${encodeURIComponent(tag)}`)}
                className="px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Signature USP Banner: Smart Learning Path */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl border border-indigo-500/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-extrabold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" /> Signature Experience
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
            Smart Learning Path: Upload once. Learn in your language. Practice at your level.
          </h2>
          <p className="text-xs md:text-sm text-indigo-200/90 leading-relaxed">
            Transform any static document into an interactive 6-step mastery journey: Understand with AI summaries, test your comprehension, identify weak topics, and take targeted follow-up quizzes.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-semibold text-indigo-300">
            <span className="flex items-center gap-1">1. Select</span>
            <span>&rarr;</span>
            <span className="flex items-center gap-1">2. Understand</span>
            <span>&rarr;</span>
            <span className="flex items-center gap-1">3. Practice</span>
            <span>&rarr;</span>
            <span className="flex items-center gap-1">4. Gap Detection</span>
            <span>&rarr;</span>
            <span className="flex items-center gap-1">5. Revision</span>
            <span>&rarr;</span>
            <span className="flex items-center gap-1 text-emerald-300">6. Improve</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/library/learning-path')}
          className="shrink-0 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center gap-2 relative z-10 group"
        >
          <span>Launch Learning Path</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Materials</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl md:text-3xl font-extrabold text-slate-900">{stats?.totalDocuments || materials.length}</p>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Available library resources</span>
        </div>

        <div
          onClick={() => navigate('/categories')}
          className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-300 transition-all space-y-2 cursor-pointer group"
          title="Browse all categories"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-teal-600 transition-colors">Categories</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">{stats?.totalCategories ?? (liveCategories.length || 8)}</p>
          <span className="text-[11px] text-teal-600 font-medium flex items-center gap-1">Browse domains ({stats?.totalCategories ?? (liveCategories.length || 8)}) →</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recently Added</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">{materials.slice(0, 5).length}</p>
          <span className="text-[11px] text-slate-400 font-medium">Recent session updates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Mode</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">Active</p>
          <span className="text-[11px] text-slate-400 font-medium">Direct document view & download</span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Browse by Category</h2>
            <p className="text-xs text-slate-500 font-medium">Select a domain to filter learning materials</p>
          </div>
          <button
            onClick={() => navigate('/library/categories')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {liveCategories.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No categories available at the moment.
            </div>
          ) : (
            liveCategories.map((cat, idx) => {
              const IconComp = CATEGORY_ICON_MAP[cat.name] || Grid;
              const colorCls = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              return (
                <div
                  key={cat.id || cat.name}
                  onClick={() => navigate(`/library?category=${encodeURIComponent(cat.name)}`)}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-card-hover transition-all duration-200 cursor-pointer space-y-3 group"
                >
                  <div className={`p-3 w-11 h-11 rounded-xl border ${colorCls} transition-transform group-hover:scale-110 duration-200 flex items-center justify-center`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {cat.description || 'Academic domain category for curated study resources.'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Materials */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Recently Uploaded Materials</h2>
            <p className="text-xs text-slate-500 font-medium">Real-time resources synchronized with the backend</p>
          </div>
          <button
            onClick={() => navigate('/library')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>View Full Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MaterialCardSkeleton />
            <MaterialCardSkeleton />
            <MaterialCardSkeleton />
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No materials uploaded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              When faculty members upload learning materials, they will automatically appear here for view and download.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {materials.slice(0, 6).map((item) => (
              <MaterialCard
                key={item.id}
                material={item}
                onView={(mat) => setSelectedMaterial(mat)}
              />
            ))}
          </div>
        )}
      </div>

      <MaterialModal
        material={selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
      />
    </div>
  );
};

