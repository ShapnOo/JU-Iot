import type { SensorData, ActuatorState, Thresholds, SystemStatus } from '../types/iot';

const BACKEND_URL = 'http://localhost:8000';

export const DEFAULT_THRESHOLDS: Thresholds = {
  temperature: 35.0,
  humidity: 80.0,
  distance: 20.0,
  gas: 5000.0,
  light: 1500.0,
};

// Evaluate actuators & status based on sensor values and thresholds
export function computeSystemState(sensors: SensorData, thresholds: Thresholds): {
  systemStatus: SystemStatus;
  actuators: ActuatorState;
  activeAlerts: string[];
} {
  const alerts: string[] = [];

  if (sensors.temperature >= thresholds.temperature) {
    alerts.push(`High Temperature detected (${sensors.temperature} °C ≥ ${thresholds.temperature} °C)`);
  }
  if (sensors.humidity >= thresholds.humidity) {
    alerts.push(`High Humidity detected (${sensors.humidity} % ≥ ${thresholds.humidity} %)`);
  }
  if (sensors.distance <= thresholds.distance) {
    alerts.push(`🚨 Low Distance Warning: Object detected at ${sensors.distance.toFixed(1)} cm (Limit: ${thresholds.distance} cm)`);
  }
  if (sensors.gas >= thresholds.gas) {
    alerts.push(`High Gas level detected (${sensors.gas} ADC ≥ ${thresholds.gas} ADC)`);
  }

  const isAlert = alerts.length > 0;

  return {
    systemStatus: isAlert ? 'ALERT' : 'NORMAL',
    actuators: {
      greenLed: !isAlert,
      redLed: isAlert,
      buzzer: isAlert,
      relay: isAlert,
    },
    activeAlerts: alerts,
  };
}

// Fetch real sensors from Python API if connected, else return null
export async function fetchSensorsFromPythonAPI(): Promise<{
  sensors: SensorData;
  actuators: ActuatorState;
  thresholds: Thresholds;
  isRealESP32Connected?: boolean;
} | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/sensors`, { signal: AbortSignal.timeout(1500) });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// Update thresholds on Python API if available
export async function sendThresholdsToPythonAPI(thresholds: Thresholds): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/thresholds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thresholds),
    });
    return res.ok;
  } catch {
    return false;
  }
}
