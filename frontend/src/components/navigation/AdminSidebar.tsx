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
    <aside className="w-64 bg-navy-800 text-slate-100 min-h-screen flex flex-col justify-between border-r border-navy-900 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-navy-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-tealAcc text-white rounded-lg shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">KnowledgeHub</h1>
              <p className="text-[11px] text-teal-300 font-semibold uppercase tracking-wider">Faculty Admin Portal</p>
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
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-slate-300 font-medium truncate max-w-[120px]">{user?.name}</span>
          </div>
          <button
            onClick={() => switchRole('VIEWER')}
            className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 px-2 py-0.5 rounded transition-colors flex items-center gap-1"
            title="Switch to Student Viewer"
          >
            <Eye className="w-3 h-3" />
            Viewer View
          </button>
        </div>

        {/* Navigation Group 1 */}
        <nav className="p-3 space-y-1">
          {navGroup1.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-tealAcc text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-navy-700 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="pt-3 pb-1 border-t border-navy-700/60">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Management
            </span>
          </div>

          {navGroup2.map((item) => (
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
          to="/admin/settings"
          onClick={onCloseMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? 'bg-tealAcc text-white font-semibold'
                : 'text-slate-300 hover:bg-navy-700 hover:text-white'
            }`
          }
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span>System Settings</span>
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
