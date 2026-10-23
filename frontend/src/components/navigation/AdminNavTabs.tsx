import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Grid, Users, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AdminNavTabs: React.FC = () => {
  const { t } = useTranslation();

  const tabs = [
    { label: t('nav.overview', 'Overview'), path: '/admin/dashboard', icon: LayoutDashboard },
    { label: t('nav.manageMaterials', 'Learning Materials'), path: '/admin/materials', icon: FileText },
    { label: t('nav.manageCategories', 'Manage Categories'), path: '/admin/categories', icon: Grid },
    { label: t('nav.manageUsers', 'Manage Users & Roles'), path: '/admin/users', icon: Users },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/90 dark:border-slate-800 pb-3 mb-6">
      <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800" aria-label="Admin Navigation Tabs">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25 ring-1 ring-amber-400/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
              }`
            }
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      <NavLink
        to="/admin/materials/upload"
        className="px-4 py-2 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>{t('document.upload', 'Upload Document')}</span>
      </NavLink>
    </div>
  );
};
