import React from 'react';
import type { ToastMessage } from '../types/iot';
import { AlertTriangle, X, ShieldAlert, Info } from 'lucide-react';

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const isAlert = t.type === 'alert';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-xl backdrop-blur-md flex items-start justify-between gap-3 animate-slide-in transition-all ${
              isAlert
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-100 shadow-rose-950/40'
                : isWarning
                ? 'bg-amber-950/90 border-amber-500/60 text-amber-100 shadow-amber-950/40'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {isAlert ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <Info className="w-5 h-5 text-cyan-400" />
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                  {t.title}
                </h4>
                <p className="text-xs font-medium mt-0.5 opacity-90">{t.message}</p>
                <span className="text-[10px] opacity-60 font-mono mt-1 block">
                  {t.timestamp}
                </span>
              </div>
            </div>

            <button
              onClick={() => onDismiss(t.id)}
              className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
