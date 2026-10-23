import React, { useState } from 'react';
import { ViewerSidebar } from '../components/navigation/ViewerSidebar';
import { Menu, Search, ShieldCheck, Command, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/ui/LanguageSelector';

interface LayoutProps {
  children: React.ReactNode;
}

export const ViewerLayout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const { user, switchRole } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/library?q=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        <ViewerSidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex">
          <ViewerSidebar onCloseMobile={() => setMobileOpen(false)} />
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Glassmorphic Header */}
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs transition-colors duration-300 ${isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-white/90 border-slate-200/80'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className={`md:hidden p-2 rounded-xl transition-colors ${isDark ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'}`}
              aria-label={t('nav.openMobileMenu')}
            >
              <Menu className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="relative w-48 md:w-80" role="search">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder={t('search.placeholder')}
                aria-label={t('search.placeholder')}
                className={`w-full pl-10 pr-10 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium ${isDark ? 'bg-slate-700/80 border-slate-600 text-slate-200 placeholder:text-slate-400 focus:bg-slate-700' : 'bg-slate-100/80 border-slate-200 text-slate-800 focus:bg-white'}`}
              />
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${isDark ? 'text-slate-400 bg-slate-800 border-slate-600' : 'text-slate-400 bg-white border-slate-200'}`}>
                <Command className="w-2.5 h-2.5" /> K
              </div>
            </form>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Dark/Light Mode Toggle */}
            <button
              id="viewer-theme-toggle"
              onClick={toggleTheme}
              title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
              aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
              className={`p-2 rounded-xl transition-all duration-300 ${isDark ? 'text-amber-400 hover:bg-slate-700 bg-slate-800 border border-slate-600' : 'text-slate-600 hover:bg-slate-100 bg-slate-50 border border-slate-200'}`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => switchRole('ADMIN')}
              aria-label={t('auth.adminPortal')}
              className={`hidden sm:flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs transition-all border ${isDark ? 'text-indigo-300 bg-indigo-900/40 border-indigo-700/50 hover:border-indigo-500' : 'text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200/80 hover:border-indigo-300'}`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>{t('auth.adminPortal')}</span>
            </button>

            <div className={`flex items-center gap-3 pl-3 border-l ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-md shadow-blue-500/20 ring-2 ring-indigo-500/20">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div className="hidden lg:block text-left">
                <p className={`text-xs font-bold leading-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{user?.name}</p>
                <p className={`text-[10px] font-semibold capitalize ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('auth.student')}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
