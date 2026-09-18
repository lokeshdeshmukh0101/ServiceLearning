import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { StorefrontPage } from './pages/StorefrontPage';
import { DashboardPage } from './pages/DashboardPage';
import { UploadPage } from './pages/UploadPage';
import { SettingsPage } from './pages/SettingsPage';
import type { ToastMessage } from './components/Toast';

export function App() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>('storefront');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <BrowserRouter>
      <MainLayout
        toast={toast}
        setToast={setToast}
        viewMode={viewMode}
        setViewMode={setViewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      >
        {(status) =>
          viewMode === 'storefront' ? (
            <StorefrontPage
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              status={status}
              onNavigateToUpload={() => setViewMode('admin')}
            />
          ) : (
            <Routes>
              <Route path="/" element={<DashboardPage setToast={setToast} />} />
              <Route path="/upload" element={<UploadPage setToast={setToast} />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          )
        }
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;
