import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

export const Login: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('VIEWER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole, email, selectedRole === 'ADMIN' ? 'Lokesh' : 'Om');
    if (selectedRole === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/library/dashboard');
    }
  };

  const handleQuickDemo = (roleToSet: UserRole, studentName?: string) => {
    if (roleToSet === 'ADMIN') {
      login('ADMIN', 'lokesh.admin@knowledgehub.edu', 'Lokesh');
      navigate('/admin/dashboard');
    } else {
      const name = studentName || 'Om';
      login('VIEWER', `${name.toLowerCase()}.student@knowledgehub.edu`, name);
      navigate('/library/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-slide-up">
        {/* Top Header Card */}
        <div className="bg-navy-800 text-white p-8 text-center space-y-3 relative">
          <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-md border border-blue-400/30">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">KnowledgeHub</h1>
            <p className="text-xs text-slate-300 font-medium mt-1">Digital Learning Library • Service Learning Platform</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedRole('VIEWER')}
              className={`py-2 rounded-md flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'VIEWER'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              Student Viewer
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('ADMIN')}
              className={`py-2 rounded-md flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-navy-800 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin (Lokesh)
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'ADMIN' ? 'lokesh.admin@knowledgehub.edu' : 'om.student@knowledgehub.edu'}
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Sign In as {selectedRole === 'ADMIN' ? 'Lokesh (Admin)' : 'Student Viewer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Section */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">
              Quick Presentation Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('VIEWER', 'Om')}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors text-center"
              >
                Login as Student (Om)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="px-3 py-2 text-xs font-medium text-navy-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-center"
              >
                Login as Admin (Lokesh)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
