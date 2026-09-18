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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Admin Dashboard</h1>
          <p className="text-xs text-slate-500">Manage educational resources, categories, and library content.</p>
        </div>
        <button
          onClick={() => navigate('/admin/materials/upload')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Upload New Material
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Materials</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats?.totalDocuments || materials.length}</p>
          <span className="text-[11px] text-slate-400">Indexed documents</span>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Categories</span>
            <Grid className="w-4 h-4 text-tealAcc" />
          </div>
          <p className="text-2xl font-bold text-slate-900">8</p>
          <span className="text-[11px] text-slate-400">Curated domains</span>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Total Users</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">124</p>
          <span className="text-[11px] text-slate-400">Faculty & Students</span>
        </div>

        <div className="bg-white p-5 rounded-[10px] border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-600">Storage Used</span>
            <HardDrive className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatSize(stats?.totalStorageBytes || 0)}</p>
          <span className="text-[11px] text-slate-400">Local disk storage</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recently Uploaded Materials</h2>
          <button
            onClick={() => navigate('/admin/materials')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Manage All Materials ({materials.length})
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
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
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No learning materials uploaded yet. Click "Upload New Material" to add your first document.
                  </td>
                </tr>
              ) : (
                materials.slice(0, 6).map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{mat.filename}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 capitalize">
                        {mat.tags && mat.tags[0] ? mat.tags[0] : 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] uppercase text-slate-600">{mat.fileType}</td>
                    <td className="px-4 py-3 text-slate-600">Faculty Admin</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(mat.uploadDate || mat.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 capitalize">
                        {mat.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <button
                        onClick={() => setSelectedMaterial(mat)}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded-md"
                        title="View Inspector"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/materials/edit/${mat.id}`)}
                        className="p-1 text-slate-500 hover:text-amber-600 rounded-md"
                        title="Edit Metadata"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(mat)}
                        className="p-1 text-slate-500 hover:text-red-600 rounded-md"
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
