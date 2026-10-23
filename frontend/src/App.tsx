import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuditProvider } from './context/AuditContext';
import { AppRoutes } from './routes/AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuditProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </AuditProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
