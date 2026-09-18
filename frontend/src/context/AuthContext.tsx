import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  login: (role: UserRole, email?: string, name?: string) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>(() => {
    return (localStorage.getItem('kh_user_role') as UserRole) || 'VIEWER';
  });

  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('kh_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name && !parsed.name.includes('Alex')) {
          if (role === 'ADMIN') {
            parsed.name = 'Lokesh';
            parsed.email = 'lokesh.admin@knowledgehub.edu';
          }
          return parsed;
        }
      } catch {
        // fallback
      }
    }
    return {
      id: role === 'ADMIN' ? 'admin-lokesh' : 'viewer-om',
      name: role === 'ADMIN' ? 'Lokesh' : 'Om',
      email: role === 'ADMIN' ? 'lokesh.admin@knowledgehub.edu' : 'om.student@knowledgehub.edu',
      role,
      department: 'Computer Science & Service Learning',
    };
  });

  useEffect(() => {
    localStorage.setItem('kh_user_role', role);
  }, [role]);

  const login = (newRole: UserRole, email?: string, name?: string) => {
    const resolvedName = newRole === 'ADMIN' ? 'Lokesh' : (name && !name.includes('Alex') ? name : 'Om');
    const resolvedEmail = newRole === 'ADMIN' ? 'lokesh.admin@knowledgehub.edu' : (email || `${resolvedName.toLowerCase()}.student@knowledgehub.edu`);

    const newUser: UserProfile = {
      id: newRole === 'ADMIN' ? 'admin-lokesh' : `viewer-${resolvedName.toLowerCase()}`,
      name: resolvedName,
      email: resolvedEmail,
      role: newRole,
      department: 'Computer Science',
    };

    setRole(newRole);
    setUser(newUser);
    localStorage.setItem('kh_user_role', newRole);
    localStorage.setItem('kh_user_profile', JSON.stringify(newUser));
  };

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'ADMIN') {
      login('ADMIN', 'lokesh.admin@knowledgehub.edu', 'Lokesh');
    } else {
      login('VIEWER', 'om.student@knowledgehub.edu', 'Om');
    }
  };

  const logout = () => {
    localStorage.removeItem('kh_user_role');
    localStorage.removeItem('kh_user_profile');
    setUser(null);
    setRole('VIEWER');
  };

  return (
    <AuthContext.Provider value={{ user, role, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
