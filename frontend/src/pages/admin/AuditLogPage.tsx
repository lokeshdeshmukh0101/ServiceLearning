import React, { useState, useMemo } from 'react';
import {
  Activity,
  Trash2,
  RefreshCw,
  Upload,
  Download,
  Edit,
  Search,
  LogIn,
  LogOut,
  HardDrive,
  Filter,
  X,
  Clock,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useAudit, type AuditAction, type AuditEntry } from '../../context/AuditContext';
import { useTheme } from '../../context/ThemeContext';

const ACTION_META: Record<AuditAction, { label: string; icon: React.ElementType; color: string; darkColor: string; bg: string; darkBg: string }> = {
  UPLOAD:       { label: 'Upload',       icon: Upload,    color: 'text-blue-700',    darkColor: 'text-blue-400',   bg: 'bg-blue-50',    darkBg: 'bg-blue-900/30' },
  DELETE:       { label: 'Delete',       icon: Trash2,    color: 'text-red-700',     darkColor: 'text-red-400',    bg: 'bg-red-50',     darkBg: 'bg-red-900/30' },
  EDIT:         { label: 'Edit',         icon: Edit,      color: 'text-amber-700',   darkColor: 'text-amber-400',  bg: 'bg-amber-50',   darkBg: 'bg-amber-900/30' },
  DOWNLOAD:     { label: 'Download',     icon: Download,  color: 'text-emerald-700', darkColor: 'text-emerald-400',bg: 'bg-emerald-50', darkBg: 'bg-emerald-900/30' },
  LOGIN:        { label: 'Login',        icon: LogIn,     color: 'text-indigo-700',  darkColor: 'text-indigo-400', bg: 'bg-indigo-50',  darkBg: 'bg-indigo-900/30' },
  LOGOUT:       { label: 'Logout',       icon: LogOut,    color: 'text-slate-700',   darkColor: 'text-slate-400',  bg: 'bg-slate-100',  darkBg: 'bg-slate-700/40' },
  SEARCH:       { label: 'Search',       icon: Search,    color: 'text-purple-700',  darkColor: 'text-purple-400', bg: 'bg-purple-50',  darkBg: 'bg-purple-900/30' },
  QUOTA_UPDATE: { label: 'Quota Update', icon: HardDrive, color: 'text-teal-700',    darkColor: 'text-teal-400',   bg: 'bg-teal-50',    darkBg: 'bg-teal-900/30' },
};

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export const AuditLogPage: React.FC = () => {
  const { logs, clearLogs } = useAudit();
  const { isDark } = useTheme();
  const [filterAction, setFilterAction] = useState<AuditAction | ''>('');
  const [filterActor, setFilterActor] = useState('');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    return logs.filter((entry) => {
      if (filterAction && entry.action !== filterAction) return false;
      if (filterActor && !entry.actor.toLowerCase().includes(filterActor.toLowerCase())) return false;
      return true;
    });
  }, [logs, filterAction, filterActor]);

  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const headBg = isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';
  const divider = isDark ? 'divide-slate-700' : 'divide-slate-100';
  const inputCls = isDark
    ? 'bg-slate-700 border-slate-600 text-slate-200 placeholder:text-slate-400'
    : 'bg-white border-slate-300 text-slate-700';

  const actionCounts = useMemo(() => {
    const counts: Partial<Record<AuditAction, number>> = {};
    logs.forEach((l) => { counts[l.action] = (counts[l.action] || 0) + 1; });
    return counts;
  }, [logs]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight flex items-center gap-2 ${text}`}>
            <Activity className="w-6 h-6 text-amber-500" />
            Audit Log
          </h1>
          <p className={`text-xs font-medium mt-1 ${subtext}`}>
            Full activity history — uploads, edits, downloads, logins, and quota changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
            {logs.length} total events
          </span>
          <button
            onClick={() => setShowConfirmClear(true)}
            className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Logs
          </button>
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['UPLOAD', 'DOWNLOAD', 'EDIT', 'SEARCH'] as AuditAction[]).map((action) => {
          const meta = ACTION_META[action];
          const Icon = meta.icon;
          return (
            <button
              key={action}
              onClick={() => setFilterAction(filterAction === action ? '' : action)}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] ${filterAction === action ? (isDark ? `${meta.darkBg} border-current ${meta.darkColor}` : `${meta.bg} border-current ${meta.color}`) : card} ${filterAction === action ? 'ring-2 ring-current/30' : ''}`}
            >
              <div className={`p-2 rounded-xl w-fit mb-2 ${isDark ? meta.darkBg : meta.bg}`}>
                <Icon className={`w-4 h-4 ${isDark ? meta.darkColor : meta.color}`} />
              </div>
              <p className={`text-xl font-extrabold ${isDark ? meta.darkColor : meta.color}`}>{actionCounts[action] || 0}</p>
              <p className={`text-[11px] font-semibold uppercase tracking-wider mt-0.5 ${subtext}`}>{meta.label}s</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className={`flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border ${card}`}>
        <div className="relative flex-1">
          <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by user name..."
            value={filterActor}
            onChange={(e) => setFilterActor(e.target.value)}
            className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${inputCls}`}
          />
        </div>

        <div className="relative">
          <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value as AuditAction | '')}
            className={`pl-8 pr-8 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${inputCls}`}
          >
            <option value="">All Actions</option>
            {Object.entries(ACTION_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {(filterAction || filterActor) && (
          <button
            onClick={() => { setFilterAction(''); setFilterActor(''); }}
            className={`px-3 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 border transition-colors ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-600 border-slate-300 hover:bg-slate-100'}`}
          >
            <X className="w-3.5 h-3.5" />
            Clear Filters
          </button>
        )}

        <span className={`text-xs font-semibold self-center px-2 ${subtext}`}>
          {filtered.length} of {logs.length}
        </span>
      </div>

      {/* Log Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${card}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b font-bold uppercase tracking-wider ${headBg} ${subtext}`}>
              <th className="px-5 py-3.5">Action</th>
              <th className="px-5 py-3.5">Actor</th>
              <th className="px-5 py-3.5">Target / Resource</th>
              <th className="px-5 py-3.5">Detail</th>
              <th className="px-5 py-3.5 text-right">Time</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${divider}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className={`px-5 py-12 text-center font-medium ${subtext}`}>
                  No audit events match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((entry: AuditEntry) => {
                const meta = ACTION_META[entry.action];
                const Icon = meta.icon;
                return (
                  <tr key={entry.id} className={`transition-colors ${rowHover}`}>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${isDark ? `${meta.darkBg} ${meta.darkColor}` : `${meta.bg} ${meta.color}`}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${entry.actorRole === 'ADMIN' ? (isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-800') : (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700')}`}>
                          {entry.actor.charAt(0)}
                        </div>
                        <div>
                          <p className={`font-bold ${text}`}>{entry.actor}</p>
                          <p className={`text-[10px] flex items-center gap-0.5 ${subtext}`}>
                            {entry.actorRole === 'ADMIN' ? <ShieldCheck className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                            {entry.actorRole}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 font-semibold max-w-[200px] truncate ${text}`}>
                      {entry.target}
                    </td>
                    <td className={`px-5 py-3.5 max-w-[200px] ${subtext}`}>
                      {entry.detail || '—'}
                    </td>
                    <td className={`px-5 py-3.5 text-right ${subtext}`}>
                      <div className="flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(entry.timestamp)}</span>
                      </div>
                      <p className="text-[10px] mt-0.5">
                        {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Clear Dialog */}
      {showConfirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className={`rounded-2xl border shadow-2xl p-6 max-w-sm w-full text-center space-y-4 ${card}`}>
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className={`text-lg font-extrabold ${text}`}>Clear All Audit Logs?</h3>
            <p className={`text-xs ${subtext}`}>This will permanently remove all {logs.length} log entries. This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirmClear(false)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors ${isDark ? 'text-slate-300 border-slate-600 hover:bg-slate-700' : 'text-slate-700 border-slate-300 hover:bg-slate-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => { clearLogs(); setShowConfirmClear(false); }}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
