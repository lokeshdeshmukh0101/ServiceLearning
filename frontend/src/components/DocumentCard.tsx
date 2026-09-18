import React from 'react';
import { FileText, FileCode, File, Eye, Download, Trash2, Calendar, HardDrive, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { Document } from '../types';
import { TagBadge } from './TagBadge';

interface DocumentCardProps {
  document: Document;
  onView: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onTagClick?: (tag: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDownload,
  onDelete,
  onTagClick,
}) => {
  const getFileIcon = (fileType: string) => {
    const t = fileType.toLowerCase();
    if (t === 'pdf') return <FileText className="w-8 h-8 text-rose-400" />;
    if (t === 'docx' || t === 'doc') return <FileText className="w-8 h-8 text-sky-400" />;
    if (t === 'txt' || t === 'md' || t === 'markdown') return <FileCode className="w-8 h-8 text-emerald-400" />;
    return <File className="w-8 h-8 text-indigo-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-sky-500/5 group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 group-hover:scale-105 transition-transform">
            {getFileIcon(document.fileType)}
          </div>
          {/* Status Pill */}
          {document.status === 'processing' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Loader2 className="w-3 h-3 animate-spin" /> Processing
            </span>
          )}
          {document.status === 'ready' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Ready
            </span>
          )}
          {document.status === 'failed' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-3 h-3" /> Failed
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          onClick={() => onView(document)}
          className="font-semibold text-slate-100 text-base line-clamp-1 hover:text-sky-400 cursor-pointer transition-colors"
          title={document.filename}
        >
          {document.filename}
        </h3>

        {/* Description */}
        {document.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 mb-2">{document.description}</p>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/60 font-mono">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            {formatSize(document.fileSize)}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {formatDate(document.uploadDate)}
          </span>
        </div>

        {/* Tags */}
        {document.tags && document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {document.tags.map((tag) => (
              <TagBadge key={tag} name={tag} onClick={() => onTagClick && onTagClick(tag)} />
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-800/80">
        <button
          onClick={() => onView(document)}
          className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-sky-400 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="View Details & Extracted Text"
        >
          <Eye className="w-4 h-4" /> View
        </button>
        <button
          onClick={() => onDownload(document)}
          className="p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
          title="Download Document"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(document)}
          className="p-2 rounded-lg bg-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          title="Delete Document"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
