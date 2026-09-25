import React from 'react';
import { Volume2, Zap, Lightbulb, AlertOctagon } from 'lucide-react';
import type { ActuatorState } from '../types/iot';

interface ActuatorsPanelProps {
  actuators: ActuatorState;
}

export const ActuatorsPanel: React.FC<ActuatorsPanelProps> = ({ actuators }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          Switches & Alarm
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">Automatic Hardware Response</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* GREEN LED */}
        <div className={`rounded-2xl border p-3.5 flex items-center justify-between transition-all ${
          actuators.greenLed
            ? 'bg-[#0f172a]/80 border-emerald-500/30'
            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${actuators.greenLed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Indicator</span>
              <span className="text-xs font-semibold text-white">Green Light</span>
            </div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
            actuators.greenLed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
          }`}>
            {actuators.greenLed ? '🟢 ON' : 'OFF'}
          </span>
        </div>

        {/* RED LED */}
        <div className={`rounded-2xl border p-3.5 flex items-center justify-between transition-all ${
          actuators.redLed
            ? 'bg-rose-950/30 border-rose-500/40'
            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${actuators.redLed ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Warning</span>
              <span className="text-xs font-semibold text-white">Red Light</span>
            </div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
            actuators.redLed ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-500'
          }`}>
            {actuators.redLed ? '🔴 ON' : 'OFF'}
          </span>
        </div>

        {/* BUZZER */}
        <div className={`rounded-2xl border p-3.5 flex items-center justify-between transition-all ${
          actuators.buzzer
            ? 'bg-rose-950/30 border-rose-500/40'
            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${actuators.buzzer ? 'bg-rose-500/20 text-rose-400 animate-bounce' : 'bg-slate-800 text-slate-500'}`}>
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Siren</span>
              <span className="text-xs font-semibold text-white">Alarm Buzzer</span>
            </div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
            actuators.buzzer ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-500'
          }`}>
            {actuators.buzzer ? '🔊 ON' : 'OFF'}
          </span>
        </div>

        {/* RELAY */}
        <div className={`rounded-2xl border p-3.5 flex items-center justify-between transition-all ${
          actuators.relay
            ? 'bg-amber-950/30 border-amber-500/40'
            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${actuators.relay ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Power</span>
              <span className="text-xs font-semibold text-white">Relay Switch</span>
            </div>
          </div>
          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
            actuators.relay ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
          }`}>
            {actuators.relay ? '⚡ ON' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
};
