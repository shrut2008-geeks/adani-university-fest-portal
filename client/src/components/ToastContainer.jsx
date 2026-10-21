import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        const borderClass = isSuccess 
          ? 'border-emerald-200 bg-white/95 text-emerald-900 shadow-emerald-500/10' 
          : isError 
            ? 'border-rose-200 bg-white/95 text-rose-900 shadow-rose-500/10' 
            : 'border-purple-200 bg-white/95 text-purple-900 shadow-purple-500/10';

        const iconColor = isSuccess 
          ? 'text-emerald-600' 
          : isError 
            ? 'text-rose-600' 
            : 'text-[#6B1B72]';

        const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all ${borderClass}`}
            role="status"
          >
            <div className={`mt-0.5 flex-shrink-0 ${iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <p className="text-xs font-bold leading-tight mb-0.5">
                  {toast.title}
                </p>
              )}
              <p className="text-xs leading-relaxed text-gray-700 break-words font-medium">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 -mr-1 -mt-1"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
