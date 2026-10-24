import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, type ToastMessage } from '../components/ui/Toast';

interface ToastContextType {
  toast: ToastMessage | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info', title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) => {
      setToast({
        id: Date.now().toString(),
        type,
        message,
        title,
      });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string, title: string = 'Success') => {
      showToast(message, 'success', title);
    },
    [showToast]
  );

  const showError = useCallback(
    (message: string, title: string = 'Error') => {
      showToast(message, 'error', title);
    },
    [showToast]
  );

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, showSuccess, showError, hideToast }}>
      {children}
      <Toast toast={toast} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: null,
      showToast: () => {},
      showSuccess: () => {},
      showError: () => {},
      hideToast: () => {},
    };
  }
  return ctx;
};
