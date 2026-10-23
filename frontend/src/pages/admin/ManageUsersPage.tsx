import React, { useState } from 'react';
import { ShieldCheck, UserCheck, UserX, Plus, HardDrive, Edit2, Check, X } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
  status: 'Active' | 'Deactivated';
  department: string;
  quotaMB: number;         // storage quota in MB
  usedMB: number;          // simulated used storage in MB
}

const INITIAL_USERS: ManagedUser[] = [
  {
    id: 'u-1',
    name: 'Lokesh',
    email: 'lokesh.admin@knowledgehub.edu',
    role: 'ADMIN',
    status: 'Active',
    department: 'Computer Science & Service Learning',
    quotaMB: 500,
    usedMB: 212,
  },
  {
    id: 'u-2',
    name: 'Om',
    email: 'om.student@knowledgehub.edu',
    role: 'VIEWER',
    status: 'Active',
    department: 'Software Engineering',
    quotaMB: 100,
    usedMB: 64,
  },
  {
    id: 'u-3',
    name: 'Vedant',
    email: 'vedant.student@knowledgehub.edu',
    role: 'VIEWER',
    status: 'Active',
    department: 'Computer Science',
    quotaMB: 100,
    usedMB: 31,
  },
  {
    id: 'u-4',
    name: 'Omkar',
    email: 'omkar.student@knowledgehub.edu',
    role: 'VIEWER',
    status: 'Active',
    department: 'Data Science',
    quotaMB: 150,
    usedMB: 98,
  },
  {
    id: 'u-5',
    name: 'Aarav',
    email: 'aarav.student@knowledgehub.edu',
    role: 'VIEWER',
    status: 'Active',
    department: 'Information Technology',
    quotaMB: 100,
    usedMB: 7,
  },
  {
    id: 'u-6',
    name: 'Priya',
    email: 'priya.student@knowledgehub.edu',
    role: 'VIEWER',
    status: 'Deactivated',
    department: 'Artificial Intelligence',
    quotaMB: 100,
    usedMB: 55,
  },
];

function QuotaBar({ used, quota, isDark }: { used: number; quota: number; isDark: boolean }) {
  const pct = Math.min(100, Math.round((used / quota) * 100));
  const color =
    pct >= 90 ? 'bg-red-500' :
    pct >= 70 ? 'bg-amber-500' :
    'bg-emerald-500';
  return (
    <div className="w-full space-y-1">
      <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className={`text-[10px] font-semibold ${pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-600' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {used} MB / {quota} MB ({pct}%)
      </p>
    </div>
  );
}

export const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [editQuotaId, setEditQuotaId] = useState<string | null>(null);
  const [quotaInputVal, setQuotaInputVal] = useState<number>(100);
  const { addLog } = useAudit();
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth();

  const card = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200';
  const text = isDark ? 'text-slate-100' : 'text-slate-900';
  const subtext = isDark ? 'text-slate-400' : 'text-slate-500';
  const headBg = isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200';
  const rowHover = isDark ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50';
  const divider = isDark ? 'divide-slate-700' : 'divide-slate-100';
  const inputCls = isDark
    ? 'bg-slate-700 border-slate-600 text-slate-200'
    : 'bg-white border-slate-300 text-slate-700';

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId && u.role !== 'ADMIN') {
          const newStatus = u.status === 'Active' ? 'Deactivated' : 'Active';
          addLog({
            actor: currentUser?.name || 'Admin',
            actorRole: 'ADMIN',
            action: 'EDIT',
            target: u.name,
            detail: `Account ${newStatus.toLowerCase()}`,
          });
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const startEditQuota = (u: ManagedUser) => {
    setEditQuotaId(u.id);
    setQuotaInputVal(u.quotaMB);
  };

  const saveQuota = (userId: string, userName: string) => {
    const newQuota = Math.max(1, quotaInputVal);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, quotaMB: newQuota } : u));
    addLog({
      actor: currentUser?.name || 'Admin',
      actorRole: 'ADMIN',
      action: 'QUOTA_UPDATE',
      target: userName,
      detail: `Storage quota updated to ${newQuota} MB`,
    });
    setEditQuotaId(null);
  };

  // Summary stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const totalUsedMB = users.reduce((s, u) => s + u.usedMB, 0);
  const totalQuotaMB = users.reduce((s, u) => s + u.quotaMB, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Manage Users & Access</h1>
          <p className={`text-xs font-medium mt-1 ${subtext}`}>
            Activate accounts, manage storage quotas, and control institutional permissions.
          </p>
        </div>
        <button
          onClick={() => alert('User invitations managed via institutional SSO connection.')}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Invite Student
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: totalUsers, sub: 'Faculty & Students', color: 'text-blue-600', bg: isDark ? 'bg-blue-900/30' : 'bg-blue-50' },
          { label: 'Active Users', value: activeUsers, sub: 'Accounts active', color: 'text-emerald-600', bg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-50' },
          { label: 'Total Storage Used', value: `${totalUsedMB} MB`, sub: 'Across all users', color: 'text-amber-600', bg: isDark ? 'bg-amber-900/30' : 'bg-amber-50' },
          { label: 'Total Quota Allocated', value: `${totalQuotaMB} MB`, sub: 'Combined limits', color: 'text-purple-600', bg: isDark ? 'bg-purple-900/30' : 'bg-purple-50' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className={`p-5 rounded-2xl border shadow-xs space-y-2 ${card}`}>
            <div className={`p-2.5 rounded-xl w-fit ${bg}`}>
              <HardDrive className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-2xl font-extrabold ${text}`}>{value}</p>
            <div>
              <p className={`text-[11px] font-bold uppercase tracking-wide ${color}`}>{label}</p>
              <p className={`text-[10px] font-medium ${subtext}`}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-xs ${card}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b font-bold uppercase tracking-wider ${headBg} ${subtext}`}>
              <th className="px-5 py-3.5">User</th>
              <th className="px-5 py-3.5">Department</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Storage Quota</th>
              <th className="px-5 py-3.5">Account Status</th>
              <th className="px-5 py-3.5 text-right">Controls</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${divider}`}>
            {users.map((u) => (
              <tr key={u.id} className={`transition-colors ${rowHover}`}>
                {/* User */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${u.role === 'ADMIN' ? (isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-800') : (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700')}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-bold ${text}`}>{u.name}</p>
                      <p className={`font-mono text-[10px] ${subtext}`}>{u.email}</p>
                    </div>
                  </div>
                </td>

                {/* Department */}
                <td className={`px-5 py-4 ${subtext}`}>{u.department}</td>

                {/* Role */}
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${u.role === 'ADMIN' ? (isDark ? 'bg-amber-900/40 text-amber-400 border border-amber-700/50' : 'bg-amber-100 text-amber-800 border border-amber-200') : (isDark ? 'bg-blue-900/40 text-blue-400 border border-blue-700/50' : 'bg-blue-50 text-blue-700 border border-blue-100')}`}>
                    {u.role === 'ADMIN' ? (
                      <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin</span>
                    ) : 'Viewer'}
                  </span>
                </td>

                {/* Storage Quota */}
                <td className="px-5 py-4 min-w-[180px]">
                  {editQuotaId === u.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        value={quotaInputVal}
                        onChange={(e) => setQuotaInputVal(Number(e.target.value))}
                        className={`w-20 text-xs px-2 py-1 rounded-lg border focus:outline-none focus:ring-1 focus:ring-amber-500 ${inputCls}`}
                      />
                      <span className={`text-[11px] ${subtext}`}>MB</span>
                      <button onClick={() => saveQuota(u.id, u.name)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditQuotaId(null)} className="p-1 text-red-500 hover:bg-red-50 rounded-md">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <QuotaBar used={u.usedMB} quota={u.quotaMB} isDark={isDark} />
                      <button
                        onClick={() => startEditQuota(u)}
                        className={`flex items-center gap-1 text-[11px] font-semibold transition-colors ${isDark ? 'text-slate-400 hover:text-amber-400' : 'text-slate-400 hover:text-amber-600'}`}
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                        Edit Quota
                      </button>
                    </div>
                  )}
                </td>

                {/* Status */}
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${u.status === 'Active' ? (isDark ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-800') : (isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-800')}`}>
                    {u.status}
                  </span>
                </td>

                {/* Controls */}
                <td className="px-5 py-4 text-right">
                  {u.role === 'ADMIN' ? (
                    <span className={`text-[11px] italic font-medium ${subtext}`}>Primary Admin (Protected)</span>
                  ) : u.status === 'Active' ? (
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors inline-flex items-center gap-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors inline-flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Activate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
