import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { SensorData, Thresholds } from '../types/iot';
import { Thermometer, Droplets, Radar, Sun, Flame } from 'lucide-react';

interface RealTimeChartProps {
  history: SensorData[];
  thresholds: Thresholds;
}

type SensorKey = 'temperature' | 'humidity' | 'distance' | 'light' | 'gas';
type TimeframeKey = '1m' | '5m' | '15m' | '30m';

const SENSOR_CONFIGS: Record<
  SensorKey,
  {
    title: string;
    unit: string;
    color: string;
    icon: React.ReactNode;
    thresholdKey: keyof Thresholds;
    domain: [number, number];
  }
> = {
  temperature: {
    title: 'Temperature',
    unit: '°C',
    color: '#f59e0b',
    icon: <Thermometer className="w-3.5 h-3.5 text-amber-400" />,
    thresholdKey: 'temperature',
    domain: [15, 50],
  },
  humidity: {
    title: 'Humidity',
    unit: '%',
    color: '#06b6d4',
    icon: <Droplets className="w-3.5 h-3.5 text-cyan-400" />,
    thresholdKey: 'humidity',
    domain: [20, 100],
  },
  distance: {
    title: 'Distance',
    unit: 'cm',
    color: '#818cf8',
    icon: <Radar className="w-3.5 h-3.5 text-indigo-400" />,
    thresholdKey: 'distance',
    domain: [0, 200],
  },
  light: {
    title: 'Light Level',
    unit: 'ADC',
    color: '#facc15',
    icon: <Sun className="w-3.5 h-3.5 text-yellow-400" />,
    thresholdKey: 'light',
    domain: [0, 4095],
  },
  gas: {
    title: 'MQ-2 Gas Level',
    unit: 'ADC',
    color: '#fb923c',
    icon: <Flame className="w-3.5 h-3.5 text-orange-400" />,
    thresholdKey: 'gas',
    domain: [0, 4095],
  },
};

export const RealTimeChart: React.FC<RealTimeChartProps> = ({ history, thresholds }) => {
  const [selectedSensor, setSelectedSensor] = useState<SensorKey>('temperature');
  const [timeframe, setTimeframe] = useState<TimeframeKey>('1m');

  const config = SENSOR_CONFIGS[selectedSensor];
  const thresholdVal = thresholds[config.thresholdKey];

  const maxPoints = timeframe === '1m' ? 30 : timeframe === '5m' ? 60 : timeframe === '15m' ? 90 : 120;
  const chartData = history.slice(-maxPoints);

  const currentValue =
    chartData.length > 0 ? chartData[chartData.length - 1][selectedSensor] : 0;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#0f172a]/70 p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            REAL-TIME TELEMETRY STREAM
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sensor Tabs */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            {(Object.keys(SENSOR_CONFIGS) as SensorKey[]).map((key) => {
              const item = SENSOR_CONFIGS[key];
              const isActive = selectedSensor === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedSensor(key)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            {(['1m', '5m', '15m', '30m'] as TimeframeKey[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded-md font-mono ${
                  timeframe === tf
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats summary banner */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-400 font-mono">
        <div>
          Current: <strong className="text-white font-bold">{currentValue} {config.unit}</strong>
        </div>
        {thresholdVal !== undefined && (
          <div>
            Threshold Limit: <strong className="text-rose-400">{thresholdVal} {config.unit}</strong>
          </div>
        )}
      </div>

      {/* Recharts Container */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
            <XAxis
              dataKey="timestamp"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={config.domain}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#090d16',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
              }}
              formatter={(val: any) => [`${val} ${config.unit}`, config.title]}
            />
            {thresholdVal !== undefined && (
              <ReferenceLine
                y={thresholdVal}
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
            )}
            <Line
              type="monotone"
              dataKey={selectedSensor}
              stroke={config.color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
