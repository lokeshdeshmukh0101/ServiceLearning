import React, { useState } from 'react';
import { X, Download, FileText, Calendar, Tag, User, Eye, Check } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';

interface MaterialModalProps {
  material: Document | null;
  onClose: () => void;
  onUpdate?: (updated: Document) => void;
  isAdmin?: boolean;
}

// Detailed inspector modal displaying extracted text, page boundaries, tag editor, and download options.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800 line-clamp-1">
                {material.filename}
              </h2>
              <span className="text-xs text-slate-500 uppercase font-medium">
                {material.fileType} • {formatSize(material.fileSize)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            aria-label="Close inspector"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Uploaded: {new Date(material.uploadDate || material.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>Role: {isAdmin ? 'Faculty Admin' : 'Student Viewer'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <span>Status: <span className="text-emerald-600 font-semibold capitalize">{material.status}</span></span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Description & Categories</h3>
              {isAdmin && !isEditingTags && (
                <button
                  onClick={() => setIsEditingTags(true)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Edit Tags & Description
                </button>
              )}
            </div>

            {isEditingTags ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <textarea
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingTags(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-600 mb-3">
                  {material.description || 'No detailed description provided.'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {material.tags && material.tags.length > 0 ? (
                    material.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No tags attached</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Extracted Document Text
            </h3>
            <div className="bg-slate-900 text-slate-200 p-4 rounded-lg text-xs font-mono max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
              {material.extractedText || 'Extracted document text processing complete.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close Inspector
          </button>
          <a
            href={api.getDownloadUrl(material.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Download className="w-4 h-4" />
            Download File ({formatSize(material.fileSize)})
          </a>
        </div>
      </div>
    </div>
  );
};
