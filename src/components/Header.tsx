import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, WifiOff, Clock, Sliders, Usb, Mic, Download, Volume2, Send } from 'lucide-react';
import { WebSerialManager } from '../services/webSerial';

export type ConnectionMode = 'SERIAL' | 'PYTHON';

interface HeaderProps {
  isConnected: boolean;
  connectionMode: ConnectionMode;
  serialPortInfo: string | null;
  onConnectSerial: () => void;
  onDisconnectSerial: () => void;
  onSelectMode: (mode: ConnectionMode) => void;
  onOpenThresholds: () => void;
  onOpenTelegram: () => void;
  onVoiceCommand: () => void;
  onAnnounceStatus: () => void;
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  connectionMode,
  serialPortInfo,
  onConnectSerial,
  onDisconnectSerial,
  onSelectMode,
  onOpenThresholds,
  onOpenTelegram,
  onVoiceCommand,
  onAnnounceStatus,
  onExportCSV,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const isWebSerialSupported = WebSerialManager.isSupported();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#0b111d]/90 backdrop-blur-xl border-b border-slate-800/60 sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white">
              ESP32 Smart Home
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Live Sensor Dashboard
            </p>
          </div>
        </div>

        {/* Right: Actions & Connection Pills */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5 text-xs">
          {/* Status Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-semibold transition-all ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <div className="flex items-center gap-1.5">
              {connectionMode === 'SERIAL' ? (
                <Usb className="w-3.5 h-3.5 text-cyan-400" />
              ) : isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>{isConnected ? 'ESP32 Connected' : 'ESP32 Disconnected'}</span>
            </div>
            {isConnected && serialPortInfo && (
              <span className="text-[10px] text-slate-400 font-mono hidden lg:inline truncate max-w-[120px]">
                ({serialPortInfo})
              </span>
            )}
          </div>

          {/* Connect / Disconnect Action Button */}
          {isWebSerialSupported && (
            <div>
              {connectionMode === 'SERIAL' && isConnected ? (
                <button
                  onClick={onDisconnectSerial}
                  className="px-3 py-1.5 rounded-xl font-semibold bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 transition-all"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={onConnectSerial}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm shadow-cyan-500/20 transition-all"
                >
                  <Usb className="w-3.5 h-3.5" />
                  Connect ESP32
                </button>
              )}
            </div>
          )}

          {/* Connection Mode Selection Pills */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <button
              onClick={() => onSelectMode('SERIAL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                connectionMode === 'SERIAL'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              USB Cable
            </button>
            <button
              onClick={() => onSelectMode('PYTHON')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                connectionMode === 'PYTHON'
                  ? 'bg-slate-800 text-indigo-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Python Server
            </button>
          </div>

          {/* Telegram Messenger Button */}
          <button
            onClick={onOpenTelegram}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 font-bold transition-all shadow-sm shadow-cyan-950/50"
            title="Send Custom Message to Telegram Bot"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telegram</span>
          </button>

          {/* Voice Command Button */}
          <button
            onClick={onVoiceCommand}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/30 text-indigo-300 font-semibold transition-all"
            title="Speak Voice Command (e.g. 'Status check')"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Voice</span>
          </button>

          {/* Audio Announce Status Button */}
          <button
            onClick={onAnnounceStatus}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
            title="Audio Status Announcement"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Export Report CSV Button */}
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-400 transition-colors"
            title="Download CSV Lab Report"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Report</span>
          </button>

          {/* Time Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-300 font-mono">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr || '--:--:--'}</span>
          </div>

          {/* Settings icon */}
          <button
            onClick={onOpenThresholds}
            className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Set Threshold Limits"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
