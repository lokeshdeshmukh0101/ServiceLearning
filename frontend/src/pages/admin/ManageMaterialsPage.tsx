import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, Trash2, RefreshCw, FileText } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';
import { MaterialModal } from '../../components/materials/MaterialModal';
import { DeleteModal } from '../../components/ui/DeleteModal';
import { TableRowSkeleton } from '../../components/ui/SkeletonLoaders';

export const ManageMaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [selectedMaterial, setSelectedMaterial] = useState<Document | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocuments();
      setMaterials(docs);
    } catch (err) {
      console.error('Failed to load materials:', err);
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

  const filteredMaterials = materials.filter((item) => {
    if (search && !item.filename.toLowerCase().includes(search.toLowerCase()) && !item.description?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (categoryFilter && (!item.tags || !item.tags.some((t) => t.toLowerCase().includes(categoryFilter.toLowerCase())))) {
      return false;
    }
    if (typeFilter && item.fileType.toLowerCase() !== typeFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Manage Learning Materials</h1>
          <p className="text-xs text-slate-500">Edit, tag, or remove educational resources from the library.</p>
        </div>
        <button
          onClick={() => navigate('/admin/materials/upload')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Upload New Material
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename or description..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Categories</option>
              <option value="Programming">Programming</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Excel">Excel</option>
              <option value="Web Development">Web Development</option>
              <option value="Computer Networks">Computer Networks</option>
              <option value="Data Structures">Data Structures</option>
              <option value="Prompt Engineering">Prompt Engineering</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="">All Formats</option>
              <option value="pdf">PDF Books (.pdf)</option>
              <option value="docx">Word (.docx)</option>
              <option value="txt">Text (.txt)</option>
              <option value="md">Markdown (.md)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>Showing {filteredMaterials.length} material(s)</span>
          <button
            onClick={() => {
              setSearch('');
              setCategoryFilter('');
              setTypeFilter('');
            }}
            className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md bg-white flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Size</th>
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
            ) : filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  No materials match your current search and filter criteria.
                </td>
              </tr>
            ) : (
              filteredMaterials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="line-clamp-1">{mat.filename}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 capitalize">
                      {mat.tags && mat.tags[0] ? mat.tags[0] : 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] uppercase text-slate-600">{mat.fileType}</td>
                  <td className="px-4 py-3 text-slate-500">{formatSize(mat.fileSize)}</td>
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
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => navigate(`/admin/materials/edit/${mat.id}`)}
                      className="p-1 text-slate-500 hover:text-amber-600 rounded-md"
                      title="Edit Material"
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
