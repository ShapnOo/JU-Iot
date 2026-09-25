import React from 'react';
import { History, Trash2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { AlertEvent } from '../types/iot';

interface AlertHistoryProps {
  events: AlertEvent[];
  onClearHistory: () => void;
}

export const AlertHistory: React.FC<AlertHistoryProps> = ({ events, onClearHistory }) => {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#0f172a]/70 p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            EVENT LOGS & ALERTS
          </h3>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            {events.length}
          </span>
        </div>

        {events.length > 0 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="py-6 text-center text-slate-500 text-xs">
          <CheckCircle2 className="w-6 h-6 text-emerald-500/40 mx-auto mb-1.5" />
          No recent events recorded.
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
          {events.map((event) => {
            const isAlert = event.status === 'ALERT';
            const isWarning = event.status === 'WARNING';

            return (
              <div
                key={event.id}
                className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 text-xs transition-all ${
                  isAlert
                    ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-slate-950/30 border-slate-800/60 text-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0">
                    {isAlert ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">{event.title}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{event.message}</p>
                  </div>
                </div>

                <span className="font-mono text-slate-500 text-[10px] shrink-0">
                  {event.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
