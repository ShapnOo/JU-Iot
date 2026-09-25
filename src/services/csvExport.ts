import type { SensorData } from '../types/iot';

export function exportTelemetryToCSV(history: SensorData[]) {
  if (!history || history.length === 0) return;

  const headers = ['Timestamp', 'Temperature (C)', 'Humidity (%)', 'Distance (cm)', 'Light (ADC)', 'Gas (PPM)'];
  const rows = history.map((s) => [
    s.timestamp,
    s.temperature.toFixed(1),
    s.humidity.toFixed(1),
    s.distance.toFixed(1),
    s.light,
    s.gas,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ESP32_SmartHome_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
