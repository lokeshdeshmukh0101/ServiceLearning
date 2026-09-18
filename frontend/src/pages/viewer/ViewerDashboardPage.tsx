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
} from 'lucide-react';
import type { Document, SystemStatus } from '../../types';
import { api } from '../../services/api';
import { MaterialCard } from '../../components/materials/MaterialCard';
import { MaterialModal } from '../../components/materials/MaterialModal';
import { MaterialCardSkeleton } from '../../components/ui/SkeletonLoaders';

// Primary student learning dashboard providing quick search, category exploration, and real material listings.
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
    { name: 'Programming', icon: Code, desc: 'Python, C++, Java & syntax guides' },
    { name: 'Artificial Intelligence', icon: Cpu, desc: 'AI foundations & neural networks' },
    { name: 'Machine Learning', icon: Brain, desc: 'Algorithms & predictive modeling' },
    { name: 'Excel', icon: FileSpreadsheet, desc: 'Data analysis & spreadsheet formulas' },
    { name: 'Web Development', icon: Globe, desc: 'HTML, CSS, React & full-stack development' },
    { name: 'Computer Networks', icon: Network, desc: 'Protocols, TCP/IP & network architecture' },
    { name: 'Data Structures', icon: Database, desc: 'Arrays, Trees, Graphs & Algorithms' },
    { name: 'Prompt Engineering', icon: Sparkles, desc: 'LLM techniques & instruction design' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/library?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-navy-800 text-white p-8 rounded-2xl shadow-xs space-y-4 border border-navy-900 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Good Morning 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Access and explore the learning material from your Service Learning sessions. Read online or download files directly.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative max-w-xl z-10 pt-2">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search learning materials..."
            className="w-full pl-11 pr-24 py-3 text-xs md:text-sm bg-white text-slate-800 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Materials</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.totalDocuments || materials.length}</p>
          <span className="text-[11px] text-slate-400">Available resources</span>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Categories</span>
            <Grid className="w-4 h-4 text-tealAcc" />
          </div>
          <p className="text-2xl font-bold text-slate-900">8</p>
          <span className="text-[11px] text-slate-400">Academic domains</span>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Recently Added</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{materials.slice(0, 5).length}</p>
          <span className="text-[11px] text-slate-400">Latest session materials</span>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">My Downloads</span>
            <Download className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">Active</p>
          <span className="text-[11px] text-slate-400">Local document access</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Browse by Category</h2>
          <button
            onClick={() => navigate('/library/categories')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
              className="bg-white p-4 rounded-[10px] border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer space-y-2 group"
            >
              <div className="p-2.5 w-10 h-10 rounded-lg bg-slate-50 text-navy-800 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors flex items-center justify-center">
                <cat.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-2">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Recently Added</h2>
            <p className="text-xs text-slate-500">Real data retrieved from the KnowledgeHub backend.</p>
          </div>
          <button
            onClick={() => navigate('/library')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-semibold text-slate-700">No materials uploaded yet</h3>
            <p className="text-xs text-slate-500">
              When faculty members upload learning materials, they will appear here automatically.
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
