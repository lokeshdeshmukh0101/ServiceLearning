import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LayoutDashboard,
  Library,
  Grid,
  Clock,
  Download,
  User,
  LogOut,
  X,
  ShieldCheck,
  Upload,
  FileText,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const ViewerSidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, role, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/library/dashboard' },
    { label: 'Library', icon: Library, path: '/library' },
    { label: 'Categories', icon: Grid, path: '/library/categories' },
    { label: 'Recently Added', icon: Clock, path: '/library/recent' },
    { label: 'My Downloads', icon: Download, path: '/library/downloads' },
  ];

  const adminNavItems = [
    { label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Upload Material', icon: Upload, path: '/admin/materials/upload' },
    { label: 'Manage Materials', icon: FileText, path: '/admin/materials' },
    { label: 'Manage Users', icon: Users, path: '/admin/users' },
    { label: 'Manage Categories', icon: Grid, path: '/admin/categories' },
    { label: 'System Settings', icon: Settings, path: '/admin/settings' },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-200 min-h-screen flex flex-col justify-between border-r border-slate-800/80 select-none shadow-2xl relative z-20">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold text-white tracking-tight">KnowledgeHub</h1>
              </div>
              <p className="text-[11px] text-indigo-400 font-medium tracking-wide">Service Learning Library</p>
            </div>
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Status Bar */}
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${role === 'ADMIN' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${role === 'ADMIN' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            </span>
            <span className="text-slate-300 font-semibold truncate">{user?.name}</span>
          </div>
          <button
            onClick={() => switchRole(role === 'ADMIN' ? 'VIEWER' : 'ADMIN')}
            className="text-[10px] font-bold tracking-wider uppercase text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/30 px-2.5 py-1 rounded-md transition-all flex items-center gap-1 shrink-0"
            title={role === 'ADMIN' ? 'Switch to Viewer Mode' : 'Switch to Faculty Admin'}
          >
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            {role === 'ADMIN' ? 'Viewer' : 'Admin'}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Navigation
            </span>
          </div>

          {navItems.map((item) => (
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

          {(role === 'ADMIN' || user?.role === 'ADMIN') && (
            <div className="pt-4 pb-1 border-t border-slate-800/80 mt-4 space-y-1.5">
              <div className="px-3 pb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Faculty Admin Console
                </span>
              </div>
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/25 border border-amber-400/30'
                        : 'text-amber-200/80 hover:bg-slate-900 hover:text-amber-100 hover:translate-x-0.5'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-slate-800/80 space-y-1.5 bg-slate-950/60">
        <NavLink
          to="/library/profile"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            }`
          }
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Profile</span>
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

