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
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Document | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [docs, sysStats] = await Promise.all([
        api.getDocuments(),
        api.getSettings(),
      ]);
      setMaterials(docs);
      setStats(sysStats);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const categoriesList = [
    { name: 'Programming', icon: Code, desc: 'Python, C++, Java & syntax guides', bg: 'bg-indigo-50 border-indigo-100 text-indigo-600' },
    { name: 'Artificial Intelligence', icon: Cpu, desc: 'AI foundations & neural networks', bg: 'bg-blue-50 border-blue-100 text-blue-600' },
    { name: 'Machine Learning', icon: Brain, desc: 'Algorithms & predictive modeling', bg: 'bg-violet-50 border-violet-100 text-violet-600' },
    { name: 'Excel', icon: FileSpreadsheet, desc: 'Data analysis & spreadsheet formulas', bg: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
    { name: 'Web Development', icon: Globe, desc: 'HTML, CSS, React & full-stack development', bg: 'bg-cyan-50 border-cyan-100 text-cyan-600' },
    { name: 'Computer Networks', icon: Network, desc: 'Protocols, TCP/IP & network architecture', bg: 'bg-amber-50 border-amber-100 text-amber-600' },
    { name: 'Data Structures', icon: Database, desc: 'Arrays, Trees, Graphs & Algorithms', bg: 'bg-rose-50 border-rose-100 text-rose-600' },
    { name: 'Prompt Engineering', icon: Sparkles, desc: 'LLM techniques & instruction design', bg: 'bg-sky-50 border-sky-100 text-sky-600' },
  ];

  const quickSearchTags = ['Python', 'Machine Learning', 'Excel Formulas', 'SQL Database'];

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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categories</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">8</p>
          <span className="text-[11px] text-slate-400 font-medium">Academic learning domains</span>
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
          {categoriesList.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/library?category=${encodeURIComponent(cat.name)}`)}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-card-hover transition-all duration-200 cursor-pointer space-y-3 group"
            >
              <div className={`p-3 w-11 h-11 rounded-xl border ${cat.bg} transition-transform group-hover:scale-110 duration-200 flex items-center justify-center`}>
                <cat.icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{cat.desc}</p>
              </div>
            </div>
          ))}
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

