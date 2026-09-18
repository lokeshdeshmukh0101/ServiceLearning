import React from 'react';
import { User, Mail, ShieldCheck, BookOpen, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-navy-800">My User Profile</h1>
        <p className="text-xs text-slate-500">
          Account details and institutional permissions for KnowledgeHub.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-full bg-navy-800 text-white flex items-center justify-center font-bold text-2xl shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-800">{user?.name}</h2>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase">
                Role: {user?.role}
              </span>
              <span className="text-xs text-slate-500">{user?.department}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-slate-500" /> Email Address
            </span>
            <p className="font-semibold text-slate-800 text-sm">{user?.email}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-slate-500" /> Access Tier
            </span>
            <p className="font-semibold text-slate-800 text-sm">Verified Academic Member</p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800">Account Switcher & Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => switchRole(user?.role === 'ADMIN' ? 'VIEWER' : 'ADMIN')}
              className="px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              Switch Role to {user?.role === 'ADMIN' ? 'Student Viewer' : 'Faculty Admin'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of KnowledgeHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
