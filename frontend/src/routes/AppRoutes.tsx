import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ViewerLayout } from '../layouts/ViewerLayout';
import { AdminLayout } from '../layouts/AdminLayout';

import { Login } from '../pages/Login';
import { ViewerDashboardPage } from '../pages/viewer/ViewerDashboardPage';
import { LibraryPage } from '../pages/viewer/LibraryPage';
import { CategoriesPage } from '../pages/viewer/CategoriesPage';
import { RecentPage } from '../pages/viewer/RecentPage';
import { DownloadsPage } from '../pages/viewer/DownloadsPage';
import { ProfilePage } from '../pages/viewer/ProfilePage';

import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { ManageMaterialsPage } from '../pages/admin/ManageMaterialsPage';
import { UploadMaterialPage } from '../pages/admin/UploadMaterialPage';
import { EditMaterialPage } from '../pages/admin/EditMaterialPage';
import { ManageCategoriesPage } from '../pages/admin/ManageCategoriesPage';
import { ManageUsersPage } from '../pages/admin/ManageUsersPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

import { NotFoundPage } from '../pages/NotFoundPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default Landing & Auth Route */}
      <Route path="/" element={<Navigate to="/library/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      {/* Viewer Routes wrapped in ViewerLayout */}
      <Route
        path="/library/dashboard"
        element={
          <ViewerLayout>
            <ViewerDashboardPage />
          </ViewerLayout>
        }
      />
      <Route
        path="/library"
        element={
          <ViewerLayout>
            <LibraryPage />
          </ViewerLayout>
        }
      />
      <Route
        path="/library/categories"
        element={
          <ViewerLayout>
            <CategoriesPage />
          </ViewerLayout>
        }
      />
      <Route
        path="/library/recent"
        element={
          <ViewerLayout>
            <RecentPage />
          </ViewerLayout>
        }
      />
      <Route
        path="/library/downloads"
        element={
          <ViewerLayout>
            <DownloadsPage />
          </ViewerLayout>
        }
      />
      <Route
        path="/library/profile"
        element={
          <ViewerLayout>
            <ProfilePage />
          </ViewerLayout>
        }
      />

      {/* Admin Routes wrapped in AdminLayout */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminLayout>
            <AdminDashboardPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/materials"
        element={
          <AdminLayout>
            <ManageMaterialsPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/materials/upload"
        element={
          <AdminLayout>
            <UploadMaterialPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/materials/edit/:id"
        element={
          <AdminLayout>
            <EditMaterialPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <AdminLayout>
            <ManageCategoriesPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminLayout>
            <ManageUsersPage />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminLayout>
            <AdminSettingsPage />
          </AdminLayout>
        }
      />

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
