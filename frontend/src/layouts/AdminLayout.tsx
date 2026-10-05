import React, { useState } from 'react';
import { AdminSidebar } from '../components/navigation/AdminSidebar';
import { Menu, Search, Eye, ShieldAlert, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const { user, role, switchRole } = useAuth();
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/admin/materials?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  // Protected Route Check for Admin Layout
  if (role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl border border-slate-200 max-w-md text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Admin Access Restricted</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your account is currently set to <span className="font-bold capitalize">{role.toLowerCase()}</span> mode. Switch to Admin mode to manage library content and user accounts.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/library/dashboard')}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Return to Viewer Dashboard
            </button>
            <button
              onClick={() => switchRole('ADMIN')}
              className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl shadow-md transition-colors"
            >
              Switch to Admin Mode
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Desktop Sticky Sidebar */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex">
          <AdminSidebar onCloseMobile={() => setMobileOpen(false)} />
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Navbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Quick Admin Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-48 md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Manage materials & resources..."
                className="w-full pl-10 pr-10 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-800"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">
                <Command className="w-2.5 h-2.5" /> K
              </div>
            </form>
          </div>

          {/* User Profile & Role Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => switchRole('VIEWER')}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 rounded-xl transition-all"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>Preview Student Library</span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-amber-500/20 ring-2 ring-amber-500/20">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider">Faculty Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

