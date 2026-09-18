import React, { useState } from 'react';
import { ShieldCheck, UserCheck, UserX, Plus } from 'lucide-react';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
  status: 'Active' | 'Deactivated';
  department: string;
}

export const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<ManagedUser[]>([
    {
      id: 'u-1',
      name: 'Lokesh',
      email: 'lokesh.admin@knowledgehub.edu',
      role: 'ADMIN',
      status: 'Active',
      department: 'Computer Science & Service Learning',
    },
    {
      id: 'u-2',
      name: 'Om',
      email: 'om.student@knowledgehub.edu',
      role: 'VIEWER',
      status: 'Active',
      department: 'Software Engineering',
    },
    {
      id: 'u-3',
      name: 'Vedant',
      email: 'vedant.student@knowledgehub.edu',
      role: 'VIEWER',
      status: 'Active',
      department: 'Computer Science',
    },
    {
      id: 'u-4',
      name: 'Omkar',
      email: 'omkar.student@knowledgehub.edu',
      role: 'VIEWER',
      status: 'Active',
      department: 'Data Science',
    },
    {
      id: 'u-5',
      name: 'Aarav',
      email: 'aarav.student@knowledgehub.edu',
      role: 'VIEWER',
      status: 'Active',
      department: 'Information Technology',
    },
    {
      id: 'u-6',
      name: 'Priya',
      email: 'priya.student@knowledgehub.edu',
      role: 'VIEWER',
      status: 'Deactivated',
      department: 'Artificial Intelligence',
    },
  ]);

  // Toggle user account activation status (Active <-> Deactivated)
  const toggleUserStatus = (userId: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === userId && u.role !== 'ADMIN') {
          const newStatus = u.status === 'Active' ? 'Deactivated' : 'Active';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Manage Users & Access</h1>
          <p className="text-xs text-slate-500">
            Activate or deactivate student viewer accounts and manage institutional permissions.
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

      {/* Users Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
              <th className="px-4 py-3">User Name</th>
              <th className="px-4 py-3">Email Address</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Account Status</th>
              <th className="px-4 py-3 text-right">Account Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-800 flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                      u.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {u.name.charAt(0)}
                  </div>
                  <span>{u.name}</span>
                </td>
                <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                <td className="px-4 py-3 text-slate-500">{u.department}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      u.role === 'ADMIN'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}
                  >
                    {u.role === 'ADMIN' ? 'Admin' : 'Viewer'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      u.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.role === 'ADMIN' ? (
                    <span className="text-[11px] text-slate-400 font-medium italic">
                      Primary Admin (Protected)
                    </span>
                  ) : u.status === 'Active' ? (
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors inline-flex items-center gap-1"
                      title="Deactivate Student Account"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Deactivate Account
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className="px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors inline-flex items-center gap-1"
                      title="Activate Student Account"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Activate Account
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
