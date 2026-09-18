import React, { useState, useEffect } from 'react';
import { Settings, Server, Database, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import type { SystemStatus } from '../../types';
import { api } from '../../services/api';

export const AdminSettingsPage: React.FC = () => {
  const [stats, setStats] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setStats(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">System & Server Settings</h1>
          <p className="text-xs text-slate-500">Live operational metrics, database health, and AI service configurations.</p>
        </div>
        <button
          onClick={fetchSettings}
          className="px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Health Check
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Backend & Database Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            Backend API & Database Connection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">Server Status</span>
              <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Operational (Express API)
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">Database Storage</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-tealAcc" /> SQLite Local (dev.db)
              </p>
            </div>
          </div>
        </div>

        {/* AI & Embedding Status */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            AI Document Search & Vector Embeddings
          </h3>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">LLM Provider:</span>
              <span className="font-bold text-slate-800">{stats?.aiProvider || 'GEMINI'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">Generative Model:</span>
              <span className="font-mono text-slate-800">{stats?.model || 'gemini-2.5-flash'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 font-medium">API Key Configured:</span>
              <span className={`font-semibold ${stats?.aiConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
                {stats?.aiConfigured ? 'Yes (Active Key)' : 'Fallback Keyword Search Active'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
