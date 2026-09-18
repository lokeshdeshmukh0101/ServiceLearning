import React from 'react';
import { BookOpen, Download, Eye, Star, FileText, FileCode, File, Tag as TagIcon, Trash2 } from 'lucide-react';
import type { Document } from '../types';

interface AmazonBookCardProps {
  document: Document;
  onRead: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete?: (doc: Document) => void;
}

export const AmazonBookCard: React.FC<AmazonBookCardProps> = ({
  document,
  onRead,
  onDownload,
  onDelete,
}) => {
  const getCoverStyle = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return 'from-rose-600 via-rose-700 to-slate-900 border-rose-500/30';
    if (t === 'docx' || t === 'doc') return 'from-sky-600 via-indigo-700 to-slate-900 border-sky-500/30';
    return 'from-emerald-600 via-teal-700 to-slate-900 border-emerald-500/30';
  };

  const getFormatBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return 'bg-rose-500 text-white';
    if (t === 'docx' || t === 'doc') return 'bg-sky-500 text-white';
    return 'bg-emerald-500 text-white';
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-sky-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-sky-500/10 flex flex-col justify-between group relative">
      <div>
        {/* Book Cover Header */}
        <div
          onClick={() => onRead(document)}
          className={`h-48 bg-gradient-to-br ${getCoverStyle(
            document.fileType
          )} p-5 flex flex-col justify-between relative cursor-pointer border-b overflow-hidden group-hover:scale-[1.02] transition-transform duration-300`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider font-mono shadow-md ${getFormatBadge(
                document.fileType
              )}`}
            >
              {document.fileType}
            </span>
            <span className="text-[11px] font-semibold text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded-full border border-white/10 font-mono">
              {formatSize(document.fileSize)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-2">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-extrabold text-white text-base line-clamp-2 leading-snug drop-shadow-md">
              {document.filename}
            </h4>
          </div>
        </div>

        {/* Book Information Body */}
        <div className="p-4 space-y-3">
          {/* Star Rating & Reviews Bar */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-bold text-slate-200 ml-1">5.0</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">Free Download</span>
          </div>

          {/* Description */}
          {document.description ? (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {document.description}
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic">No description provided for this document.</p>
          )}

          {/* Tag Badges */}
          {document.tags && document.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {document.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800"
                >
                  <TagIcon className="w-2.5 h-2.5 text-sky-400" /> #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer Buttons */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <button
          onClick={() => onRead(document)}
          className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Eye className="w-4 h-4 text-sky-400" /> Read
        </button>
        <button
          onClick={() => onDownload(document)}
          className="flex-1 px-3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 transition-all"
        >
          <Download className="w-4 h-4" /> Download
        </button>
        {onDelete && (
          <button
            onClick={() => onDelete(document)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
            title="Admin Delete Document"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
