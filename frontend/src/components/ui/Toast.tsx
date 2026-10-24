import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  title?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

// Global alert toast notification component
export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className="fixed bottom-6 right-6 z-[100000] flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slide-up max-w-md bg-slate-900/95 border-slate-700/80 text-white shadow-black/40"
      role="alert"
    >
      <div
        className={`p-2 rounded-xl shrink-0 ${
          isSuccess
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : isError
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5 text-rose-400" />
        ) : (
          <Info className="w-5 h-5 text-blue-400" />
        )}
      </div>

      <div className="flex-1 min-w-0 pr-1">
        {toast.title && (
          <h4 className="text-xs font-bold text-white leading-tight mb-0.5">
            {toast.title}
          </h4>
        )}
        <p className="text-xs font-medium text-slate-200 leading-snug break-words">
          {toast.message}
        </p>
      </div>

      <button
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
