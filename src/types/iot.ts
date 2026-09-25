export type SystemStatus = 'NORMAL' | 'ALERT';

export interface SensorData {
  temperature: number; // °C
  humidity: number;    // %
  distance: number;    // cm
  light: number;       // ADC 0-4095
  gas: number;         // ADC 0-4095
  timestamp: string;   // HH:mm:ss
}

export interface ActuatorState {
  greenLed: boolean;
  redLed: boolean;
  buzzer: boolean;
  relay: boolean;
}

export interface Thresholds {
  temperature: number; // default 35
  humidity: number;    // default 80
  distance: number;    // default 20
  gas: number;         // default 5800
  light: number;       // default 1500
}

export interface AlertEvent {
  id: string;
  timestamp: string;
  status: 'NORMAL' | 'WARNING' | 'ALERT';
  title: string;
  message: string;
}

export interface DeviceInfoData {
  deviceModel: string;
  connectionType: string;
  ipAddress: string;
  uptimeSeconds: number;
  firmware: string;
  sensorsOnline: number;
  totalSensors: number;
  updateInterval: number; // in seconds
  isConnected: boolean;
}

export interface ToastMessage {
  id: string;
  type: 'warning' | 'alert' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
}
