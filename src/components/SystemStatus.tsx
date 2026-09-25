import React from 'react';
import { ShieldCheck, ShieldAlert, Cpu, Activity, Clock } from 'lucide-react';
import type { SystemStatus as SystemStatusType } from '../types/iot';

interface SystemStatusProps {
  status: SystemStatusType;
  lastUpdated: string;
  activeAlerts: string[];
  sensorsOnlineCount?: number;
  totalSensors?: number;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({
  status,
  lastUpdated,
  activeAlerts,
  sensorsOnlineCount = 5,
  totalSensors = 5,
}) => {
  const isNormal = status === 'NORMAL';

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 ${
        isNormal
          ? 'bg-[#0f172a]/70 border-slate-800/80'
          : 'bg-rose-950/20 border-rose-500/40'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Main status & summary */}
        <div className="flex items-center gap-4">
          <div
            className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 ${
              isNormal
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            {isNormal ? (
              <ShieldCheck className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase border ${
                  isNormal
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isNormal ? 'bg-emerald-400' : 'bg-rose-400 animate-ping'
                  }`}
                />
                {status}
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-white mt-0.5 tracking-tight">
              {isNormal ? 'All Good — Everything is Safe' : 'Warning: Check Sensors!'}
            </h2>

            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              {isNormal
                ? 'All room conditions are inside normal limits.'
                : 'One or more sensors triggered an alert. Switches turned on automatically.'}
            </p>

            {!isNormal && activeAlerts.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {activeAlerts.map((alert, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-0.5 rounded-md bg-rose-950/60 border border-rose-500/30 text-rose-300 text-[11px] font-mono"
                  >
                    ⚠️ {alert}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick metadata */}
        <div className="flex items-center gap-3 text-xs shrink-0 self-start lg:self-auto">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-0.5">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Last Reading
            </span>
            <p className="font-mono text-slate-200 font-semibold text-xs">{lastUpdated}</p>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-0.5">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-indigo-400" /> Board
            </span>
            <p className="font-mono text-slate-200 font-semibold text-xs">ESP32-WROOM</p>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-0.5">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" /> Active Sensors
            </span>
            <p className="font-mono text-emerald-400 font-bold text-xs">
              {sensorsOnlineCount}/{totalSensors} Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
