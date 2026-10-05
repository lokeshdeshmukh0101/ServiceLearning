import React from 'react';
import { FileText, FileCode, File, Eye, Download, Calendar, ArrowUpRight } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';

interface MaterialCardProps {
  material: Document;
  onView: (material: Document) => void;
  onDownloadTrack?: (material: Document) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onView,
  onDownloadTrack,
}) => {
  const fileExt = material.fileType?.toLowerCase() || 'file';

  const getFormatBadge = () => {
    if (fileExt === 'pdf') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-4 h-4 text-rose-600" />
          <span>PDF</span>
        </div>
      );
    }
    if (fileExt === 'docx' || fileExt === 'doc') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60 text-xs font-bold uppercase tracking-wider">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>DOCX</span>
        </div>
      );
    }
    if (fileExt === 'md' || fileExt === 'txt') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold uppercase tracking-wider">
          <FileCode className="w-4 h-4 text-emerald-600" />
          <span>{fileExt.toUpperCase()}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-xs font-bold uppercase tracking-wider">
        <File className="w-4 h-4 text-indigo-600" />
        <span>{fileExt.toUpperCase()}</span>
      </div>
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDownloadTrack) {
      onDownloadTrack(material);
    }
    window.open(api.getDownloadUrl(material.id), '_blank');
  };

  const category = material.tags && material.tags.length > 0 ? material.tags[0] : 'General';

  return (
    <div
      onClick={() => onView(material)}
      className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-card-hover hover:border-blue-300 transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
    >
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          {getFormatBadge()}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/60 capitalize">
            {category}
          </span>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 flex items-center justify-between gap-1">
            <span>{material.filename}</span>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed min-h-[36px]">
            {material.description || 'No description provided for this learning resource.'}
          </p>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            {formatSize(material.fileSize)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(material.uploadDate || material.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(material)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            title="Download Document"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get</span>
          </button>
        </div>
      </div>
    </div>
  );
};

