import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, Upload, Settings, HardDrive, Sparkles } from 'lucide-react';
import type { SystemStatus } from '../types';

interface SidebarProps {
  status: SystemStatus | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ status }) => {
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const navItems = [
    { to: '/', label: 'Library', icon: BookOpen },
    { to: '/upload', label: 'Upload', icon: Upload },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-lg select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
              Digital Library
            </h1>
            <span className="text-xs text-sky-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 inline" /> Library Engine
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Storage Footer */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-sky-400" />
              Storage Used
            </span>
            <span className="font-mono text-slate-300">
              {formatBytes(status?.totalStorageBytes)}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  ((status?.totalStorageBytes || 0) / (500 * 1024 * 1024)) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <div className="text-[11px] text-slate-500 flex justify-between pt-0.5">
            <span>{status?.totalDocuments || 0} Documents</span>
            <span>Local Database</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
