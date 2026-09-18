import React, { useState, useEffect } from 'react';
import { Clock, Eye, Download, FileText } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';
import { MaterialModal } from '../../components/materials/MaterialModal';
import { TableRowSkeleton } from '../../components/ui/SkeletonLoaders';

export const RecentPage: React.FC = () => {
  const [materials, setMaterials] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<Document | null>(null);

  useEffect(() => {
    fetchRecent();
  }, []);

  const fetchRecent = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocuments();
      setMaterials(docs);
    } catch (err) {
      console.error('Failed to load recent materials:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
          <Clock className="w-6 h-6 text-amber-600" />
          Recently Added Materials
        </h1>
        <p className="text-xs text-slate-500">
          Chronological feed of newly uploaded educational notes, lectures, and research materials.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Material Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">File Type</th>
              <th className="px-4 py-3">Uploaded Date</th>
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
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  No recently added materials found.
                </td>
              </tr>
            ) : (
              materials.map((mat) => (
                <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>{mat.filename}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 capitalize">
                      {mat.tags && mat.tags[0] ? mat.tags[0] : 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] uppercase text-slate-600">{mat.fileType}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(mat.uploadDate || mat.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => setSelectedMaterial(mat)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <a
                      href={api.getDownloadUrl(mat.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
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
      />
    </div>
  );
};
