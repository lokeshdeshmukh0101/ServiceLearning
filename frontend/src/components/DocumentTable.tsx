import React from 'react';
import { FileText, FileCode, File, Eye, Download, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { Document } from '../types';
import { TagBadge } from './TagBadge';

interface DocumentTableProps {
  documents: Document[];
  onView: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onTagClick?: (tag: string) => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({
  documents,
  onView,
  onDownload,
  onDelete,
  onTagClick,
}) => {
  const getFileIcon = (fileType: string) => {
    const t = fileType.toLowerCase();
    if (t === 'pdf') return <FileText className="w-5 h-5 text-rose-400" />;
    if (t === 'docx' || t === 'doc') return <FileText className="w-5 h-5 text-sky-400" />;
    if (t === 'txt' || t === 'md' || t === 'markdown') return <FileCode className="w-5 h-5 text-emerald-400" />;
    return <File className="w-5 h-5 text-indigo-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/80 text-xs uppercase text-slate-400 font-semibold border-b border-slate-800">
          <tr>
            <th className="px-6 py-4">Document</th>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Size</th>
            <th className="px-6 py-4">Upload Date</th>
            <th className="px-6 py-4">Tags</th>
            <th className="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80">
          {documents.map((doc) => (
            <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
              <td className="px-6 py-4 font-medium text-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex-shrink-0">
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div>
                    <span
                      onClick={() => onView(doc)}
                      className="hover:text-sky-400 cursor-pointer line-clamp-1"
                    >
                      {doc.filename}
                    </span>
                    {doc.status === 'processing' && (
                      <span className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Processing
                      </span>
                    )}
                    {doc.status === 'failed' && (
                      <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" /> Extraction failed
                      </span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 uppercase text-xs font-mono font-bold text-slate-400">
                {doc.fileType}
              </td>
              <td className="px-6 py-4 font-mono text-xs">{formatSize(doc.fileSize)}</td>
              <td className="px-6 py-4 font-mono text-xs">
                {new Date(doc.uploadDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {doc.tags?.map((t) => (
                    <TagBadge key={t} name={t} onClick={() => onTagClick && onTagClick(t)} />
                  ))}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onView(doc)}
                    className="p-2 rounded-lg bg-slate-800 hover:text-sky-400 transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownload(doc)}
                    className="p-2 rounded-lg bg-slate-800 hover:text-emerald-400 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(doc)}
                    className="p-2 rounded-lg bg-slate-800 hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
