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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const ViewerSidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout, switchRole } = useAuth();
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

  return (
    <aside className="w-64 bg-navy-800 text-slate-100 min-h-screen flex flex-col justify-between border-r border-navy-900 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">KnowledgeHub</h1>
              <p className="text-[11px] text-slate-300 font-medium">Digital Learning Library</p>
            </div>
          </div>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="md:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Badge */}
        <div className="px-5 py-3 bg-navy-900/60 flex items-center justify-between text-xs border-b border-navy-700">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-300 font-medium truncate max-w-[120px]">{user?.name}</span>
          </div>
          <button
            onClick={() => switchRole('ADMIN')}
            className="text-[11px] font-semibold text-blue-300 hover:text-white bg-blue-600/30 hover:bg-blue-600/50 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
            title="Switch to Faculty Admin"
          >
            <ShieldCheck className="w-3 h-3" />
            Admin Mode
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-navy-700 hover:text-white'
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
      <div className="p-3 border-t border-navy-700 space-y-1">
        <NavLink
          to="/library/profile"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-300 hover:bg-navy-700 hover:text-white'
            }`
          }
        >
          <User className="w-4 h-4 shrink-0" />
          <span>Profile</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
