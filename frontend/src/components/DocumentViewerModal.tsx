import React, { useState } from 'react';
import { X, FileText, Download, Copy, Check, Tag as TagIcon, FileCode, Edit3, Calendar, HardDrive } from 'lucide-react';
import type { Document } from '../types';
import { TagBadge } from './TagBadge';
import { api } from '../services/api';

interface DocumentViewerModalProps {
  document: Document | null;
  onClose: () => void;
  onUpdated: () => void;
  onDownload: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  onClose,
  onUpdated,
  onDownload,
  onDelete,
}) => {
  if (!document) return null;

  const [activeTab, setActiveTab] = useState<'text' | 'pdf' | 'details'>('text');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(document.description || '');
  const [tagInput, setTagInput] = useState((document.tags || []).join(', '));
  const [saving, setSaving] = useState(false);

  const handleCopyText = () => {
    if (document.extractedText) {
      navigator.clipboard.writeText(document.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsedTags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
      await api.updateDocument(document.id, description, parsedTags);
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      console.error('Failed to update document metadata:', err);
    } finally {
      setSaving(false);
    }
  };

  const isPdf = document.fileType.toLowerCase() === 'pdf';
  const downloadUrl = api.getDownloadUrl(document.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
              <FileText className="w-7 h-7 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 line-clamp-1">{document.filename}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <span className="uppercase text-sky-400 font-bold">{document.fileType}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  {(document.fileSize / 1024).toFixed(1)} KB
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(document.uploadDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(document)}
              className="px-3.5 py-2 rounded-xl bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(document)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Delete Document"
              >
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection Navigation */}
        <div className="px-6 border-b border-slate-800 flex items-center gap-6 bg-slate-950/30 text-sm font-medium">
          <button
            onClick={() => setActiveTab('text')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'text'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" /> Extracted Text
          </button>
          {isPdf && (
            <button
              onClick={() => setActiveTab('pdf')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'pdf'
                  ? 'border-sky-400 text-sky-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" /> PDF Preview
            </button>
          )}
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-sky-400 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TagIcon className="w-4 h-4" /> Metadata & Tags
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-900/40">
          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">
                  {document.extractedText ? `${document.extractedText.length} characters` : '0 characters'}
                </span>
                <button
                  onClick={handleCopyText}
                  disabled={!document.extractedText}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto select-text">
                {document.extractedText || 'No text extracted from this document.'}
              </div>
            </div>
          )}

          {activeTab === 'pdf' && isPdf && (
            <div className="w-full h-[55vh] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
              <iframe
                src={downloadUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-slate-300">Description & Tags</h4>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                    <p className="text-sm text-slate-300">
                      {document.description || 'No description provided.'}
                    </p>
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Tags
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {document.tags && document.tags.length > 0 ? (
                        document.tags.map((t) => <TagBadge key={t} name={t} />)
                      ) : (
                        <span className="text-xs text-slate-500 italic">No tags assigned.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                      placeholder="Enter a brief document description..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                      placeholder="e.g. CN, DAA, Exam Notes"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
