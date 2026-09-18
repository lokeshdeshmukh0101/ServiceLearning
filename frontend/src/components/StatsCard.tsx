import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'sky' | 'indigo' | 'emerald' | 'amber' | 'purple';
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon: Icon, color }) => {
  const colorStyles = {
    sky: 'from-sky-500/10 to-sky-500/5 text-sky-400 border-sky-500/20',
    indigo: 'from-indigo-500/10 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20',
    purple: 'from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20',
  }[color];

  return (
    <div className={`p-5 rounded-2xl border bg-gradient-to-br backdrop-blur-md ${colorStyles} flex items-center justify-between`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-100 font-mono tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};
