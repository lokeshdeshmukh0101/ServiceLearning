import React, { createContext, useContext, useState } from 'react';

export type AuditAction =
  | 'UPLOAD'
  | 'DELETE'
  | 'EDIT'
  | 'DOWNLOAD'
  | 'LOGIN'
  | 'LOGOUT'
  | 'SEARCH'
  | 'QUOTA_UPDATE';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  actor: string;
  actorRole: 'ADMIN' | 'VIEWER';
  action: AuditAction;
  target: string;
  detail?: string;
}

interface AuditContextType {
  logs: AuditEntry[];
  addLog: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

const SEED_LOGS: AuditEntry[] = [
  {
    id: 'seed-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actor: 'Lokesh',
    actorRole: 'ADMIN',
    action: 'UPLOAD',
    target: 'data_structures_notes.pdf',
    detail: 'Uploaded 1.4 MB PDF to Programming category',
  },
  {
    id: 'seed-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    actor: 'Om',
    actorRole: 'VIEWER',
    action: 'DOWNLOAD',
    target: 'data_structures_notes.pdf',
    detail: 'Downloaded from Library',
  },
  {
    id: 'seed-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    actor: 'Lokesh',
    actorRole: 'ADMIN',
    action: 'EDIT',
    target: 'ml_intro.docx',
    detail: 'Updated tags: machine-learning, AI',
  },
  {
    id: 'seed-4',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actor: 'Vedant',
    actorRole: 'VIEWER',
    action: 'SEARCH',
    target: 'neural networks',
    detail: 'Searched in Library',
  },
  {
    id: 'seed-5',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    actor: 'Lokesh',
    actorRole: 'ADMIN',
    action: 'QUOTA_UPDATE',
    target: 'Om',
    detail: 'Storage quota updated to 100 MB',
  },
  {
    id: 'seed-6',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actor: 'Omkar',
    actorRole: 'VIEWER',
    action: 'LOGIN',
    target: 'KnowledgeHub',
    detail: 'Student viewer logged in',
  },
];

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<AuditEntry[]>(SEED_LOGS);

  const addLog = (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
    };
    setLogs((prev) => [newEntry, ...prev]);
  };

  const clearLogs = () => setLogs([]);

  return (
    <AuditContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = (): AuditContextType => {
  const ctx = useContext(AuditContext);
  if (!ctx) throw new Error('useAudit must be used within AuditProvider');
  return ctx;
};
