import React from 'react';
import { Thermometer, Droplets, Radar, Sun, Flame } from 'lucide-react';
import type { SensorData, Thresholds } from '../types/iot';

interface SensorGridProps {
  sensors: SensorData;
  thresholds: Thresholds;
  history: SensorData[];
}

const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg className="w-24 h-6 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const SensorGrid: React.FC<SensorGridProps> = ({ sensors, thresholds, history }) => {
  const tempHistory = history.map((h) => h.temperature);
  const humidityHistory = history.map((h) => h.humidity);
  const distanceHistory = history.map((h) => h.distance);

  const isTempAlert = sensors.temperature >= thresholds.temperature;
  const isHumidityAlert = sensors.humidity >= thresholds.humidity;
  const isDistanceAlert = sensors.distance > 0 && sensors.distance <= thresholds.distance;
  const isGasAlert = sensors.gas >= thresholds.gas;

  const getLightCategory = (val: number) => {
    if (val < 500) return 'Dark';
    if (val < 1500) return 'Low';
    if (val < 3200) return 'Normal';
    return 'Bright';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          Live Sensors
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">5 Channels Active</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* 1. TEMPERATURE */}
        <div
          className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            isTempAlert
              ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
              : 'bg-[#0f172a]/70 border-slate-800/80 hover:border-slate-700/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isTempAlert ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  <Thermometer className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-300">Temperature</span>
              </div>
              <Sparkline data={tempHistory} color={isTempAlert ? '#ef4444' : '#f59e0b'} />
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                {sensors.temperature.toFixed(1)} <span className="text-sm text-slate-400 font-normal">°C</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Limit: {thresholds.temperature} °C</span>
            <span className={`px-2 py-0.5 rounded font-semibold ${isTempAlert ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isTempAlert ? 'Too Hot' : 'Normal'}
            </span>
          </div>
        </div>

        {/* 2. HUMIDITY */}
        <div
          className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            isHumidityAlert
              ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
              : 'bg-[#0f172a]/70 border-slate-800/80 hover:border-slate-700/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isHumidityAlert ? 'bg-rose-500/20 text-rose-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                  <Droplets className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-300">Humidity</span>
              </div>
              <Sparkline data={humidityHistory} color={isHumidityAlert ? '#ef4444' : '#06b6d4'} />
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                {sensors.humidity.toFixed(1)} <span className="text-sm text-slate-400 font-normal">%</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Limit: {thresholds.humidity} %</span>
            <span className={`px-2 py-0.5 rounded font-semibold ${isHumidityAlert ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isHumidityAlert ? 'Too High' : 'Normal'}
            </span>
          </div>
        </div>

        {/* 3. DISTANCE */}
        <div
          className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            isDistanceAlert
              ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
              : 'bg-[#0f172a]/70 border-slate-800/80 hover:border-slate-700/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isDistanceAlert ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                  <Radar className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-300">Distance</span>
              </div>
              <Sparkline data={distanceHistory} color={isDistanceAlert ? '#ef4444' : '#818cf8'} />
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono tracking-tight flex items-baseline gap-1">
                {(typeof sensors.distance === 'number' && !isNaN(sensors.distance) ? sensors.distance : 0).toFixed(1)}
                <span className="text-sm text-slate-400 font-normal">cm</span>
              </div>
            </div>

            <div className="mt-2">
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 ${isDistanceAlert ? 'bg-rose-500' : 'bg-indigo-400'}`}
                  style={{ width: `${Math.min(100, Math.max(0, (sensors.distance / 200) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Limit ≤ {thresholds.distance}cm</span>
            <span className={`px-2 py-0.5 rounded font-semibold ${isDistanceAlert ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isDistanceAlert ? '🚨 Object Nearby' : sensors.distance === 0 ? 'Standby (0 cm)' : 'Clear'}
            </span>
          </div>
        </div>

        {/* 4. LIGHT LEVEL */}
        <div className="rounded-2xl border border-slate-800/80 bg-[#0f172a]/70 p-4 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400">
                  <Sun className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-300">Light Level</span>
              </div>
              <span className="text-[10px] font-mono text-yellow-400 font-medium">
                {getLightCategory(sensors.light)}
              </span>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                {sensors.light} <span className="text-xs text-slate-400 font-normal">ADC</span>
              </div>
            </div>

            <div className="mt-2">
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (sensors.light / 4095) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">ADC Range 0–4095</span>
            <span className="px-2 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400">
              Normal
            </span>
          </div>
        </div>

        {/* 5. GAS LEVEL */}
        <div
          className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
            isGasAlert
              ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
              : 'bg-[#0f172a]/70 border-slate-800/80 hover:border-slate-700/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${isGasAlert ? 'bg-rose-500/20 text-rose-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  <Flame className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-300">MQ-2 Gas</span>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-2xl font-bold text-white font-mono tracking-tight">
                {sensors.gas} <span className="text-xs text-slate-400 font-normal">PPM</span>
              </div>
            </div>

            <div className="mt-2">
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${isGasAlert ? 'bg-rose-500' : 'bg-orange-400'}`}
                  style={{ width: `${Math.min(100, (sensors.gas / 4095) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Limit: {thresholds.gas}</span>
            <span className={`px-2 py-0.5 rounded font-semibold ${isGasAlert ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {isGasAlert ? 'Gas Alert' : 'Safe'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
