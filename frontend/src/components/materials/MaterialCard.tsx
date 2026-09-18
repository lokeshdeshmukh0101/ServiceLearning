import React from 'react';
import { FileText, FileCode, File, Eye, Download, Calendar } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';

interface MaterialCardProps {
  material: Document;
  onView: (material: Document) => void;
  onDownloadTrack?: (material: Document) => void;
}

// Compact academic card displaying document icon, title, description, category, format, and download actions.
export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onView,
  onDownloadTrack,
}) => {
  const fileExt = material.fileType?.toLowerCase() || 'file';

  const getFileIcon = () => {
    if (fileExt === 'pdf') {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    if (fileExt === 'docx' || fileExt === 'doc') {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (fileExt === 'md' || fileExt === 'txt') {
      return <FileCode className="w-5 h-5 text-teal-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
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

  const category = material.tags && material.tags.length > 0 ? material.tags[0] : 'General Learning';

  return (
    <div
      onClick={() => onView(material)}
      className="group bg-white rounded-[10px] border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-blue-50 transition-colors">
            {getFileIcon()}
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
            {category}
          </span>
        </div>

        <h3 className="text-base font-semibold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {material.filename}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
          {material.description || 'No description provided for this learning resource.'}
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
            {fileExt.toUpperCase()} • {formatSize(material.fileSize)}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(material.uploadDate || material.createdAt).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(material)}
            className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
            title="View Material Details"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </button>
          <button
            onClick={handleDownload}
            className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1"
            title="Download Document"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
