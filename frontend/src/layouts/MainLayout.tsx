import React, { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';
import { StoreNavbar } from '../components/StoreNavbar';
import { Toast } from '../components/Toast';
import type { ToastMessage } from '../components/Toast';
import { api } from '../services/api';
import type { SystemStatus } from '../types';

interface MainLayoutProps {
  children: (status: SystemStatus | null) => React.ReactNode;
  toast: ToastMessage | null;
  setToast: (toast: ToastMessage | null) => void;
  viewMode: 'storefront' | 'admin';
  setViewMode: (mode: 'storefront' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  toast,
  setToast,
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await api.getSettings();
      setStatus(data);
    } catch {
      // Quiet fallback if server is starting
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* Top Header Navbar */}
      <StoreNavbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        viewMode={viewMode}
        setViewMode={setViewMode}
        status={status}
      />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar shown in Admin mode */}
        {viewMode === 'admin' && <Sidebar status={status} />}

        {/* Main Content View */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-900/50">
          <div className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">{children(status)}</div>
        </main>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
