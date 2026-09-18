import React, { useState, useEffect } from 'react';
import { HardDrive, ShieldCheck, RefreshCw } from 'lucide-react';
import type { SystemStatus } from '../types';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load system status:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">Settings & System</h1>
          <p className="text-slate-400 text-sm mt-1">
            Application storage, document statistics, and system health status.
          </p>
        </div>
        <button
          onClick={loadSettings}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title="Refresh Status"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Storage & Database Statistics */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">Library Storage</h3>
            <p className="text-xs text-slate-400">SQLite Database & File System metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center font-mono">
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-2xl font-bold text-slate-100 block">{status?.totalDocuments || 0}</span>
            <span className="text-[11px] text-slate-500 font-sans uppercase">Total Files</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-2xl font-bold text-slate-100 block">{status?.pdfCount || 0}</span>
            <span className="text-[11px] text-slate-500 font-sans uppercase">PDF Files</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-2xl font-bold text-slate-100 block">{status?.docxCount || 0}</span>
            <span className="text-[11px] text-slate-500 font-sans uppercase">DOCX Files</span>
          </div>
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <span className="text-2xl font-bold text-slate-100 block">{formatBytes(status?.totalStorageBytes)}</span>
            <span className="text-[11px] text-slate-500 font-sans uppercase">Disk Usage</span>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">About Digital Library</h3>
            <p className="text-xs text-slate-400">Version 1.0.0 — Document Management Application</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Built with React, Vite, TypeScript, Express, SQLite, and Prisma ORM.
          Designed for personal and team document organization, multi-format text extraction, instant search, and library management.
        </p>
      </div>
    </div>
  );
};
