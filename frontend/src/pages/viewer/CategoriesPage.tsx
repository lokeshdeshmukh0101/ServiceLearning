import React from 'react';
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
} from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'cat-1',
      name: 'Programming',
      icon: Code,
      desc: 'Core language guides, code snippets, Python, C++, Java, and syntax cheatsheets.',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'cat-2',
      name: 'Artificial Intelligence',
      icon: Cpu,
      desc: 'Foundational AI lectures, neural networks, intelligent agents, and search strategies.',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'cat-3',
      name: 'Machine Learning',
      icon: Brain,
      desc: 'Supervised & unsupervised learning models, regression, classification, and evaluation.',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      id: 'cat-4',
      name: 'Excel',
      icon: FileSpreadsheet,
      desc: 'Data analysis workbooks, lookup formulas, pivot tables, and statistical modeling.',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'cat-5',
      name: 'Web Development',
      icon: Globe,
      desc: 'Modern web development, HTML5, CSS3, JavaScript, React framework, and REST APIs.',
      color: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      id: 'cat-6',
      name: 'Computer Networks',
      icon: Network,
      desc: 'OSI 7-layer model, TCP/IP networking protocols, routing, subnetting, and socket programming.',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'cat-7',
      name: 'Data Structures',
      icon: Database,
      desc: 'Abstract data types, stacks, queues, linked lists, trees, graphs, and Big-O efficiency.',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'cat-8',
      name: 'Prompt Engineering',
      icon: Sparkles,
      desc: 'Large language model techniques, zero-shot/few-shot prompting, and AI instruction design.',
      color: 'bg-sky-50 text-sky-700 border-sky-200',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-navy-800">Academic Categories</h1>
        <p className="text-xs text-slate-500">
          Browse KnowledgeHub learning resources categorized by academic domain and subject area.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/library?category=${encodeURIComponent(cat.name)}`)}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-400 transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className={`p-3 w-12 h-12 rounded-xl flex items-center justify-center border ${cat.color}`}>
                <cat.icon className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{cat.desc}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-normal">
                <BookOpen className="w-3.5 h-3.5" />
                Active Domain
              </span>
              <span className="flex items-center gap-1">
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
