import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Grid,
  Users,
  HardDrive,
  Eye,
  Edit,
  Trash2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import type { Document, SystemStatus } from '../../types';
import { api } from '../../services/api';
import { MaterialModal } from '../../components/materials/MaterialModal';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { TableRowSkeleton } from '../../components/ui/SkeletonLoaders';

export const AdminDashboardPage: React.FC = () => {
  const [materials, setMaterials] = useState<Document[]>([]);
  const [stats, setStats] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedMaterial, setSelectedMaterial] = useState<Document | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [docs, sysStats] = await Promise.all([
        api.getDocuments(),
        api.getSettings(),
      ]);
      setMaterials(docs);
      setStats(sysStats);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.deleteDocument(deleteTarget.id);
      setMaterials((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Admin Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">Manage educational resources, student categories, and library content.</p>
        </div>
        <button
          onClick={() => navigate('/admin/materials/upload')}
          className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Material</span>
        </button>
      </div>

      {/* Stats Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Materials</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">{stats?.totalDocuments || materials.length}</p>
          <span className="text-[11px] text-slate-400 font-medium">Indexed documents</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Categories</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">8</p>
          <span className="text-[11px] text-slate-400 font-medium">Curated domains</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">124</p>
          <span className="text-[11px] text-slate-400 font-medium">Faculty & Students</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Storage Used</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900">{formatSize(stats?.totalStorageBytes || 0)}</p>
          <span className="text-[11px] text-slate-400 font-medium">Local disk storage</span>
        </div>
      </div>

      {/* Materials Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Recently Uploaded Materials</h2>
          <button
            onClick={() => navigate('/admin/materials')}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
          >
            <span>Manage All ({materials.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">Material Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Format</th>
                <th className="px-5 py-3.5">Uploader</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 font-medium">
                    No learning materials uploaded yet. Click "Upload New Material" to add your first document.
                  </td>
                </tr>
              ) : (
                materials.slice(0, 6).map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-bold text-slate-900">{mat.filename}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60 capitalize">
                        {mat.tags && mat.tags[0] ? mat.tags[0] : 'General'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-[11px] uppercase text-indigo-600">{mat.fileType}</td>
                    <td className="px-5 py-4 text-slate-600 font-medium">Faculty Admin</td>
                    <td className="px-5 py-4 text-slate-500 font-medium">
                      {new Date(mat.uploadDate || mat.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 capitalize border border-emerald-200">
                        {mat.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right space-x-1">
                      <button
                        onClick={() => setSelectedMaterial(mat)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Inspector"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/materials/edit/${mat.id}`)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Metadata"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(mat)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MaterialModal
        material={selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        isAdmin={true}
      />

      <DeleteModal
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.filename || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
};

