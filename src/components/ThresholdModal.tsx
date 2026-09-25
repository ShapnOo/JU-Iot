import React, { useState } from 'react';
import { Sliders, X, AlertCircle, Save } from 'lucide-react';
import type { Thresholds } from '../types/iot';

interface ThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: Thresholds;
  onSave: (newThresholds: Thresholds) => void;
}

export const ThresholdModal: React.FC<ThresholdModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSave,
}) => {
  const [formValues, setFormValues] = useState<Thresholds>({ ...thresholds });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleChange = (key: keyof Thresholds, val: string) => {
    const num = parseFloat(val);
    setFormValues((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation rules
    if (formValues.temperature < -20 || formValues.temperature > 100) {
      setErrorMsg('Temperature threshold must be between -20 °C and 100 °C');
      return;
    }
    if (formValues.humidity < 0 || formValues.humidity > 100) {
      setErrorMsg('Humidity threshold must be between 0% and 100%');
      return;
    }
    if (formValues.distance < 1 || formValues.distance > 400) {
      setErrorMsg('Distance threshold must be between 1 cm and 400 cm');
      return;
    }
    if (formValues.gas < 0 || formValues.gas > 4095) {
      setErrorMsg('Gas ADC threshold must be between 0 and 4095');
      return;
    }
    if (formValues.light < 0 || formValues.light > 4095) {
      setErrorMsg('Light ADC threshold must be between 0 and 4095');
      return;
    }

    onSave(formValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Sensor Threshold Configuration</h3>
              <p className="text-xs text-slate-400">
                Adjust trigger points for automated alerts & actuators
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Temperature */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Temperature Threshold (°C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formValues.temperature}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Alert if Temp ≥ Limit</span>
            </div>

            {/* Humidity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Humidity Threshold (%)
              </label>
              <input
                type="number"
                step="1"
                value={formValues.humidity}
                onChange={(e) => handleChange('humidity', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Alert if Humidity ≥ Limit</span>
            </div>

            {/* Distance */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Distance Proximity Limit (cm)
              </label>
              <input
                type="number"
                step="0.5"
                value={formValues.distance}
                onChange={(e) => handleChange('distance', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Alert if Distance ≤ Limit</span>
            </div>

            {/* Gas */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                MQ-2 Gas ADC Threshold
              </label>
              <input
                type="number"
                step="10"
                value={formValues.gas}
                onChange={(e) => handleChange('gas', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Alert if Gas ADC ≥ Limit</span>
            </div>

            {/* Light */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">
                Light Level Target (ADC 0–4095)
              </label>
              <input
                type="number"
                step="10"
                value={formValues.light}
                onChange={(e) => handleChange('light', e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-500">Reference brightness limit</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Save className="w-4 h-4" /> Save Thresholds
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
