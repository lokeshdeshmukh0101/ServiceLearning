import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Grid,
  Upload,
  FileText,
  Users,
  Settings,
  LogOut,
  X,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const AdminSidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroup1 = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Library View', icon: Library, path: '/library' },
    { label: 'Categories', icon: Grid, path: '/admin/categories' },
  ];

  const navGroup2 = [
    { label: 'Upload Material', icon: Upload, path: '/admin/materials/upload' },
    { label: 'Manage Materials', icon: FileText, path: '/admin/materials' },
    { label: 'Manage Users', icon: Users, path: '/admin/users' },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 min-h-screen flex flex-col justify-between border-r border-slate-800/80 select-none shadow-2xl relative z-20">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-xl shadow-lg shadow-amber-500/20 ring-1 ring-white/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">KnowledgeHub</h1>
              <p className="text-[11px] text-amber-400 font-medium uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Faculty Admin
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Badge */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <span className="text-slate-300 font-semibold truncate">{user?.name}</span>
          </div>
          <button
            onClick={() => switchRole('VIEWER')}
            className="text-[10px] font-bold tracking-wider uppercase text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 shrink-0"
            title="Switch to Student Viewer"
          >
            <Eye className="w-3 h-3 text-blue-400" />
            Viewer View
          </button>
        </div>

        {/* Navigation Group 1 */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Overview
            </span>
          </div>

          {navGroup1.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20 border border-amber-400/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-4 pb-1 border-t border-slate-800/80 mt-4 px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Management & Controls
            </span>
          </div>

          {navGroup2.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-0.5'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-slate-800/80 space-y-1.5 bg-slate-950/60">
        <NavLink
          to="/admin/settings"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>System Settings</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-200"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

