import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';
import type { Document } from '../../types';
import { api } from '../../services/api';

export const DownloadsPage: React.FC = () => {
  const [downloads, setDownloads] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocuments();
      setDownloads(docs);
    } catch (err) {
      console.error('Failed to load downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-navy-800 flex items-center gap-2">
          <Download className="w-6 h-6 text-emerald-600" />
          My Download History
        </h1>
        <p className="text-xs text-slate-500">
          Access your downloaded educational files and session study resources.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">Material Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Access Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">Loading downloads...</td>
              </tr>
            ) : downloads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No download history recorded yet.
                </td>
              </tr>
            ) : (
              downloads.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>{doc.filename}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-700 capitalize">
                      {doc.tags && doc.tags[0] ? doc.tags[0] : 'General'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] uppercase text-slate-600">{doc.fileType}</td>
                  <td className="px-4 py-3 text-slate-500">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={api.getDownloadUrl(doc.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download Again
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
