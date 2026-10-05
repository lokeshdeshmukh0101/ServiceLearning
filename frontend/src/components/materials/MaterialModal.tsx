import React, { useState } from 'react';
import { X, Download, FileText, Calendar, Tag, User, Eye, Check, Edit3 } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';

interface MaterialModalProps {
  material: Document | null;
  onClose: () => void;
  onUpdate?: (updated: Document) => void;
  isAdmin?: boolean;
}

export const MaterialModal: React.FC<MaterialModalProps> = ({
  material,
  onClose,
  onUpdate,
  isAdmin = false,
}) => {
  if (!material) return null;

  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagsInput, setTagsInput] = useState(material.tags ? material.tags.join(', ') : '');
  const [descInput, setDescInput] = useState(material.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const tagsArray = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      const updated = await api.updateDocument(material.id, descInput, tagsArray);
      if (onUpdate) onUpdate(updated);
      setIsEditingTags(false);
    } catch (err) {
      console.error('Failed to update document:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 line-clamp-1 tracking-tight">
                {material.filename}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {material.fileType}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {formatSize(material.fileSize)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
            aria-label="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-xs font-medium text-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-lg text-slate-500 border border-slate-200">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Uploaded Date</p>
                <p className="font-semibold text-slate-800">{new Date(material.uploadDate || material.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-lg text-slate-500 border border-slate-200">
                <User className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Access Mode</p>
                <p className="font-semibold text-slate-800">{isAdmin ? 'Faculty Administrator' : 'Student Viewer'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-lg text-slate-500 border border-slate-200">
                <Tag className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400 font-bold">Document Status</p>
                <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 capitalize">
                  {material.status}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Description & Tags</h3>
              {isAdmin && !isEditingTags && (
                <button
                  onClick={() => setIsEditingTags(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Metadata</span>
                </button>
              )}
            </div>

            {isEditingTags ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingTags(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-200/60 font-medium">
                  {material.description || 'No detailed description provided for this learning material.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {material.tags && material.tags.length > 0 ? (
                    material.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No category tags attached</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Extracted Text Inspector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Extracted Document Content</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Indexed for AI Search</span>
            </div>
            <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl text-xs font-mono max-h-64 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
              {material.extractedText || 'Extracted document text processing complete.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-all"
          >
            Close Inspector
          </button>
          <a
            href={api.getDownloadUrl(material.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Document ({formatSize(material.fileSize)})</span>
          </a>
        </div>
      </div>
    </div>
  );
};

