import React from 'react';
import { Cpu, Wifi, HardDrive, Shield, Activity, RefreshCw, Usb } from 'lucide-react';
import type { DeviceInfoData } from '../types/iot';

interface DeviceInfoProps {
  deviceInfo: DeviceInfoData;
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => v.toString().padStart(2, '0')).join(':');
}

export const DeviceInfo: React.FC<DeviceInfoProps> = ({ deviceInfo }) => {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#0f172a]/70 p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            DEVICE SPECIFICATIONS
          </h3>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          Hardware Operational
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-cyan-400" /> Model
          </span>
          <p className="font-mono font-bold text-white mt-0.5">
            {deviceInfo.deviceModel}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            {deviceInfo.connectionType.includes('USB') ? (
              <Usb className="w-3 h-3 text-cyan-400" />
            ) : (
              <Wifi className="w-3 h-3 text-indigo-400" />
            )}
            Interface / Port
          </span>
          <p className="font-mono font-bold text-slate-200 mt-0.5 truncate">
            {deviceInfo.ipAddress}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-emerald-400" /> Uptime
          </span>
          <p className="font-mono font-bold text-emerald-400 mt-0.5">
            {formatUptime(deviceInfo.uptimeSeconds)}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Shield className="w-3 h-3 text-amber-400" /> Firmware
          </span>
          <p className="font-mono font-bold text-slate-200 mt-0.5">
            {deviceInfo.firmware}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" /> Channels
          </span>
          <p className="font-mono font-bold text-white mt-0.5">
            {deviceInfo.sensorsOnline} / {deviceInfo.totalSensors} Online
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-indigo-400" /> Data Source
          </span>
          <p className="font-mono font-bold text-cyan-300 mt-0.5 truncate">
            {deviceInfo.connectionType}
          </p>
        </div>
      </div>
    </div>
  );
};
