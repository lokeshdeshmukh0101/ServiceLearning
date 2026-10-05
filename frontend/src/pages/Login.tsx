import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden relative z-10 animate-fade-in">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-8 text-center space-y-3 relative border-b border-slate-800">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30 border border-white/20">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Service Learning Portal
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">KnowledgeHub</h1>
            <p className="text-xs text-slate-300 font-medium mt-1">Digital Learning Library & Study Platform</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {/* Role Selection Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedRole('VIEWER')}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'VIEWER'
                  ? 'bg-white text-indigo-600 shadow-md border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              Student Viewer
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('ADMIN')}
              className={`py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
                selectedRole === 'ADMIN'
                  ? 'bg-white text-amber-600 shadow-md border border-slate-200/80 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin (Faculty)
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Institutional Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'ADMIN' ? 'lokesh.admin@knowledgehub.edu' : 'om.student@knowledgehub.edu'}
                className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Sign In as {selectedRole === 'ADMIN' ? 'Lokesh (Admin)' : 'Student Viewer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Section */}
          <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">
              Quick Presentation Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('VIEWER', 'Om')}
                className="px-3 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all text-center"
              >
                Login as Student (Om)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="px-3 py-2.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all text-center"
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

