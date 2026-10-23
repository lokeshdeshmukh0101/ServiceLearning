import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, UserX, Plus, HardDrive, Edit2, Check, X, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { useAudit } from '../../context/AuditContext';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api, type ManagedUser } from '../../services/api';
import { AdminNavTabs } from '../../components/navigation/AdminNavTabs';

function QuotaBar({ used, quota, isDark }: { used: number; quota: number; isDark: boolean }) {
  const safeQuota = Math.max(1, quota);
  const pct = Math.min(100, Math.round((used / safeQuota) * 100));
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
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editQuotaId, setEditQuotaId] = useState<string | null>(null);
  const [quotaInputVal, setQuotaInputVal] = useState<number>(100);

  // New User form state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'VIEWER'>('VIEWER');
  const [newDept, setNewDept] = useState('');
  const [newQuota, setNewQuota] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError('Failed to load users from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRole: 'ADMIN' | 'VIEWER') => {
    try {
      const updated = await api.updateUser(userId, { role: targetRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u)));
      addLog({
        actor: currentUser?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'EDIT',
        target: updated.name,
        detail: `Role changed to ${targetRole}`,
      });
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update user role');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const newStatus = user.status === 'Active' ? 'Deactivated' : 'Active';
    try {
      const updated = await api.updateUser(userId, { status: newStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: updated.status } : u)));
      addLog({
        actor: currentUser?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'EDIT',
        target: user.name,
        detail: `Account status set to ${newStatus}`,
      });
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update account status');
    }
  };

  const startEditQuota = (u: ManagedUser) => {
    setEditQuotaId(u.id);
    setQuotaInputVal(u.quotaMB);
  };

  const saveQuota = async (userId: string, userName: string) => {
    const newQuota = Math.max(1, quotaInputVal);
    try {
      const updated = await api.updateUser(userId, { quotaMB: newQuota });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, quotaMB: updated.quotaMB } : u)));
      addLog({
        actor: currentUser?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'QUOTA_UPDATE',
        target: userName,
        detail: `Storage quota updated to ${newQuota} MB`,
      });
      setEditQuotaId(null);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to update quota');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    setIsSubmitting(true);
    try {
      const created = await api.createUser({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        department: newDept.trim() || 'General Studies',
        quotaMB: Number(newQuota) || 100,
      });
      setUsers((prev) => [...prev, created]);
      addLog({
        actor: currentUser?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'CREATE',
        target: created.name,
        detail: `Created user account (${created.role})`,
      });
      setNewName('');
      setNewEmail('');
      setNewDept('');
      setIsAdding(false);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to remove user "${userName}"?`)) return;
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      addLog({
        actor: currentUser?.name || 'Admin',
        actorRole: 'ADMIN',
        action: 'DELETE',
        target: userName,
        detail: 'Deleted user account',
      });
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to delete user');
    }
  };

  // Summary stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'Active').length;
  const totalUsedMB = users.reduce((s, u) => s + (u.usedMB || 0), 0);
  const totalQuotaMB = users.reduce((s, u) => s + (u.quotaMB || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      <AdminNavTabs />
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <div>
          <h1 className={`text-2xl font-extrabold tracking-tight ${text}`}>Manage Users & Access</h1>
          <p className={`text-xs font-medium mt-1 ${subtext}`}>
            Activate accounts, switch roles between Admin and Viewer, and configure storage limits. All changes are saved to the database.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add User / Student
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={loadUsers} className="ml-auto underline font-bold">Retry</button>
        </div>
      )}

      {/* Add User Modal / Box */}
      {isAdding && (
        <form onSubmit={handleCreateUser} className={`p-5 rounded-2xl border space-y-4 shadow-sm animate-fade-in ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50/80 border-blue-200'}`}>
          <h3 className={`text-sm font-bold ${text}`}>Register New Institutional User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="e.g. Rohini Sharma"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputCls}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Email *</label>
              <input
                type="email"
                placeholder="rohini@knowledgehub.edu"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputCls}`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Role *</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'ADMIN' | 'VIEWER')}
                className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputCls}`}
              >
                <option value="VIEWER">Student Viewer</option>
                <option value="ADMIN">Faculty Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Department</label>
              <input
                type="text"
                placeholder="Computer Science"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputCls}`}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border ${isDark ? 'border-slate-600 text-slate-300' : 'border-slate-300 text-slate-600 bg-white'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 font-bold shadow-sm transition-all"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save User to Database
            </button>
          </div>
        </form>
      )}

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
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-semibold">Loading users from database…</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b font-bold uppercase tracking-wider text-[11px] ${headBg} ${subtext}`}>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Role (Interactive)</th>
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

                  {/* Role Dropdown */}
                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as 'ADMIN' | 'VIEWER')}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                        u.role === 'ADMIN'
                          ? isDark
                            ? 'bg-amber-900/40 text-amber-300 border-amber-600'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                          : isDark
                          ? 'bg-indigo-900/40 text-indigo-300 border-indigo-600'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      }`}
                    >
                      <option value="VIEWER">Student Viewer</option>
                      <option value="ADMIN">Faculty Admin</option>
                    </select>
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
                        <QuotaBar used={u.usedMB || 0} quota={u.quotaMB || 100} isDark={isDark} />
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
                  <td className="px-5 py-4 text-right space-x-1.5">
                    {u.status === 'Active' ? (
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Deactivate account"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Activate account"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                      title="Remove user"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
