import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Code,
  Cpu,
  Brain,
  FileSpreadsheet,
  Globe,
  Network,
  Database,
  Sparkles,
  ArrowRight,
  BookOpen,
  Loader2,
  Grid,
} from 'lucide-react';
import { api, type Category } from '../../services/api';

const ICON_MAP: Record<string, any> = {
  Programming: Code,
  'Artificial Intelligence': Cpu,
  'Machine Learning': Brain,
  Excel: FileSpreadsheet,
  'Web Development': Globe,
  'Computer Networks': Network,
  'Data Structures': Database,
  'Prompt Engineering': Sparkles,
};

const COLOR_PALETTE = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-sky-50 text-sky-700 border-sky-200',
];

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-navy-800">Academic Categories</h1>
        <p className="text-xs text-slate-500">
          Browse KnowledgeHub learning resources categorized by academic domain and subject area.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading categories…</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs">No categories found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const IconComponent = ICON_MAP[cat.name] || Grid;
            const colorClass = COLOR_PALETTE[idx % COLOR_PALETTE.length];
            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/library?category=${encodeURIComponent(cat.name)}`)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className={`p-3 w-12 h-12 rounded-xl flex items-center justify-center border ${colorClass}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                      {cat.description || 'Academic domain category for curated study resources.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                  <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                    <BookOpen className="w-3.5 h-3.5" />
                    {cat.count ?? 0} {cat.count === 1 ? 'material' : 'materials'}
                  </span>
                  <span className="flex items-center gap-1">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
