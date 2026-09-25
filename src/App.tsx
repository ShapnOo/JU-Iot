import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import type { ConnectionMode } from './components/Header';
import { SystemStatus } from './components/SystemStatus';
import { SensorGrid } from './components/SensorGrid';
import { ActuatorsPanel } from './components/ActuatorsPanel';
import { RealTimeChart } from './components/RealTimeChart';
import { AlertHistory } from './components/AlertHistory';
import { ThresholdModal } from './components/ThresholdModal';
import { TelegramModal } from './components/TelegramModal';
import { DeviceInfo } from './components/DeviceInfo';
import { ToastNotification } from './components/ToastNotification';

import type {
  SensorData,
  Thresholds,
  AlertEvent,
  ToastMessage,
  DeviceInfoData,
  SystemStatus as SystemStatusType,
} from './types/iot';

import {
  DEFAULT_THRESHOLDS,
  computeSystemState,
  fetchSensorsFromPythonAPI,
  sendThresholdsToPythonAPI,
} from './services/api';

import { WebSerialManager } from './services/webSerial';
import { VoiceAssistant } from './services/voiceAssistant';
import { exportTelemetryToCSV } from './services/csvExport';
import { sendTelegramNotification } from './services/telegramBot';

export function App() {
  // Core telemetry & system state
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);
  const [sensors, setSensors] = useState<SensorData>({
    temperature: 26.5,
    humidity: 58.0,
    distance: 42.5,
    light: 1450,
    gas: 380,
    timestamp: new Date().toTimeString().split(' ')[0],
  });

  const [history, setHistory] = useState<SensorData[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toTimeString().split(' ')[0],
      status: 'NORMAL',
      title: 'Hardware Listener Ready',
      message: 'Click "Connect ESP32" to stream real sensor telemetry.',
    },
  ]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('SERIAL');
  const [serialPortInfo, setSerialPortInfo] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState<boolean>(false);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(0);

  // Web Serial manager instance
  const serialManagerRef = useRef<WebSerialManager>(new WebSerialManager());
  const prevStatusRef = useRef<SystemStatusType>('NORMAL');
  const lastHistoryTimeRef = useRef<number>(0);

  // Compute current system actuators and alert list
  const { systemStatus, activeAlerts } = computeSystemState(sensors, thresholds);

  // System Uptime counter
  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Serial Connection Handlers (0ms INSTANT STREAMING)
  const handleConnectSerial = async () => {
    const success = await serialManagerRef.current.connect({
      onConnect: (info) => {
        setIsConnected(true);
        setConnectionMode('SERIAL');
        setSerialPortInfo(info);
        const nowStr = new Date().toTimeString().split(' ')[0];
        setToasts((prev) => [
          {
            id: `toast-${Date.now()}`,
            type: 'info',
            title: '🔌 USB SERIAL CONNECTED',
            message: `Instant streaming active @ 115200 baud`,
            timestamp: nowStr,
          },
          ...prev,
        ]);
        VoiceAssistant.speak('ESP32 board connected via USB serial.');
      },
      onData: (parsed, rawText) => {
        const nowStr = new Date().toTimeString().split(' ')[0];
        setSensors((prev) => ({
          temperature: parsed.temperature ?? prev.temperature,
          humidity: parsed.humidity ?? prev.humidity,
          distance: parsed.distance ?? prev.distance,
          light: parsed.light ?? prev.light,
          gas: parsed.gas ?? prev.gas,
          timestamp: nowStr,
        }));

        if (rawText.includes('WARNING:') || rawText.includes('ALERT')) {
          setEvents((prev) => [
            {
              id: `serial-alert-${Date.now()}`,
              timestamp: nowStr,
              status: 'ALERT',
              title: '⚠️ Hardware Warning',
              message: rawText.slice(0, 100),
            },
            ...prev.slice(0, 49),
          ]);
        }
      },
      onDisconnect: (err) => {
        setIsConnected(false);
        setSerialPortInfo(null);
        if (err) {
          const nowStr = new Date().toTimeString().split(' ')[0];
          setToasts((prev) => [
            {
              id: `toast-${Date.now()}`,
              type: 'warning',
              title: '🔌 USB SERIAL DISCONNECTED',
              message: err,
              timestamp: nowStr,
            },
            ...prev,
          ]);
        }
      },
    });

    if (!success && connectionMode === 'SERIAL') {
      setIsConnected(false);
    }
  };

  const handleDisconnectSerial = async () => {
    await serialManagerRef.current.disconnect();
    setIsConnected(false);
    setSerialPortInfo(null);
  };

  const handleSelectMode = (mode: ConnectionMode) => {
    if (mode !== 'SERIAL' && connectionMode === 'SERIAL') {
      serialManagerRef.current.disconnect();
    }
    setConnectionMode(mode);
    if (mode === 'SERIAL') {
      handleConnectSerial();
    }
  };

  // High-frequency 100ms Telemetry Loop for PYTHON API Mode
  useEffect(() => {
    if (connectionMode !== 'PYTHON') return;

    const interval = setInterval(async () => {
      const pyData = await fetchSensorsFromPythonAPI();
      if (pyData) {
        setSensors(pyData.sensors);
        setIsConnected(pyData.isRealESP32Connected ?? true);
      } else {
        setIsConnected(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [connectionMode]);

  // Smooth History Graph Buffer
  useEffect(() => {
    const now = Date.now();
    if (now - lastHistoryTimeRef.current > 100) {
      lastHistoryTimeRef.current = now;
      if (sensors.temperature > 0 || sensors.humidity > 0 || sensors.distance > 0 || sensors.light > 0 || sensors.gas > 0) {
        setHistory((prev) => [...prev.slice(-119), sensors]);
      }
    }
  }, [sensors]);

  // Handle status transition alerts & toasts
  useEffect(() => {
    if (!isConnected) return;
    const nowStr = sensors.timestamp;

    if (systemStatus === 'ALERT' && prevStatusRef.current === 'NORMAL') {
      const fullMsg = activeAlerts.join(' • ');

      const newEvent: AlertEvent = {
        id: `alert-${Date.now()}`,
        timestamp: nowStr,
        status: 'ALERT',
        title: '⚠️ System Alert',
        message: fullMsg,
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);

      const newToast: ToastMessage = {
        id: `toast-${Date.now()}`,
        type: 'alert',
        title: '⚠️ ALERT TRIGGERED',
        message: fullMsg,
        timestamp: nowStr,
      };
      setToasts((prev) => [newToast, ...prev]);

      // Voice announcement on alert
      VoiceAssistant.announceSensorSummary(sensors, thresholds);

      // Instant Telegram alert dispatch to phone
      const telegramAlertMessage = `⚠️ *ESP32 SMART HOME ALERT!*\n${activeAlerts.map((a) => `• ${a}`).join('\n')}\n\n🚨 Actuators & Alarm Engaged!`;
      sendTelegramNotification(telegramAlertMessage);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 5000);
    } else if (systemStatus === 'NORMAL' && prevStatusRef.current === 'ALERT') {
      const newEvent: AlertEvent = {
        id: `normal-${Date.now()}`,
        timestamp: nowStr,
        status: 'NORMAL',
        title: 'System Normal',
        message: 'All sensor parameters returned to safe threshold limits.',
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 49)]);

      const newToast: ToastMessage = {
        id: `toast-${Date.now()}`,
        type: 'info',
        title: '✅ STATUS NORMAL',
        message: 'All sensors are back within threshold limits.',
        timestamp: nowStr,
      };
      setToasts((prev) => [newToast, ...prev]);

      VoiceAssistant.speak('System status returned to normal.');

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    }

    prevStatusRef.current = systemStatus;
  }, [systemStatus, activeAlerts, sensors.timestamp, isConnected, sensors, thresholds]);

  // Voice Command Listener Handler
  const handleVoiceCommand = () => {
    const nowStr = new Date().toTimeString().split(' ')[0];
    setToasts((prev) => [
      {
        id: `toast-${Date.now()}`,
        type: 'info',
        title: '🎤 VOICE ASSISTANT',
        message: 'Listening for voice command... (e.g. "Status check")',
        timestamp: nowStr,
      },
      ...prev,
    ]);

    VoiceAssistant.listen(
      (command) => {
        setToasts((prev) => [
          {
            id: `toast-${Date.now()}`,
            type: 'info',
            title: '🎤 VOICE COMMAND RECEIVED',
            message: `Command: "${command}"`,
            timestamp: nowStr,
          },
          ...prev,
        ]);

        if (command.includes('status') || command.includes('check')) {
          VoiceAssistant.announceSensorSummary(sensors, thresholds);
        } else if (command.includes('temperature') || command.includes('temp')) {
          VoiceAssistant.speak(`Current temperature is ${sensors.temperature.toFixed(1)} degrees Celsius.`);
        } else if (command.includes('humidity')) {
          VoiceAssistant.speak(`Current humidity is ${sensors.humidity.toFixed(0)} percent.`);
        } else if (command.includes('distance')) {
          VoiceAssistant.speak(`Current obstacle distance is ${sensors.distance.toFixed(1)} centimeters.`);
        } else if (command.includes('gas')) {
          VoiceAssistant.speak(`Current gas level is ${sensors.gas} PPM.`);
        } else {
          VoiceAssistant.speak(`Received command: ${command}.`);
        }
      },
      (err) => {
        setToasts((prev) => [
          {
            id: `toast-${Date.now()}`,
            type: 'warning',
            title: '🎤 VOICE NOTICE',
            message: err,
            timestamp: nowStr,
          },
          ...prev,
        ]);
      }
    );
  };

  const handleAnnounceStatus = () => {
    VoiceAssistant.announceSensorSummary(sensors, thresholds);
  };

  const handleExportCSV = () => {
    exportTelemetryToCSV(history);
  };

  // Handlers
  const handleSaveThresholds = async (newThresholds: Thresholds) => {
    setThresholds(newThresholds);
    if (connectionMode === 'PYTHON') {
      await sendThresholdsToPythonAPI(newThresholds);
    }
  };

  const handleClearHistory = () => {
    setEvents([]);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const deviceInfo: DeviceInfoData = {
    deviceModel: 'ESP32-WROOM-32',
    connectionType:
      connectionMode === 'SERIAL'
        ? 'USB Serial (Web Serial API)'
        : 'Python FastAPI / REST',
    ipAddress:
      connectionMode === 'SERIAL'
        ? serialPortInfo || '/dev/cu.usbserial-0001'
        : '192.168.1.105',
    uptimeSeconds: uptimeSeconds,
    firmware: 'Smart Home v1.0',
    sensorsOnline: isConnected ? 5 : 0,
    totalSensors: 5,
    updateInterval: 0.05,
    isConnected: isConnected,
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 pb-12">
      {/* Toast Notifications */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />

      {/* Header */}
      <Header
        isConnected={isConnected}
        connectionMode={connectionMode}
        serialPortInfo={serialPortInfo}
        onConnectSerial={handleConnectSerial}
        onDisconnectSerial={handleDisconnectSerial}
        onSelectMode={handleSelectMode}
        onOpenThresholds={() => setIsThresholdModalOpen(true)}
        onOpenTelegram={() => setIsTelegramModalOpen(true)}
        onVoiceCommand={handleVoiceCommand}
        onAnnounceStatus={handleAnnounceStatus}
        onExportCSV={handleExportCSV}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 space-y-5">
        {/* Disconnected Hardware Banner */}
        {!isConnected && (
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-amber-500/30 text-amber-200 text-sm flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <strong className="text-white block font-bold">ESP32 Hardware Disconnected</strong>
                <span className="text-xs text-slate-400">
                  Click <strong>Connect ESP32</strong> in the header to establish instant 115200 baud USB serial streaming.
                </span>
              </div>
            </div>
            <button
              onClick={handleConnectSerial}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shrink-0"
            >
              Connect ESP32
            </button>
          </div>
        )}

        {/* Hero System Status */}
        <SystemStatus
          status={systemStatus}
          lastUpdated={sensors.timestamp}
          activeAlerts={activeAlerts}
          sensorsOnlineCount={isConnected ? 5 : 0}
          totalSensors={5}
        />

        {/* Sensor Monitoring Cards Grid */}
        <SensorGrid sensors={sensors} thresholds={thresholds} history={history} />

        {/* Actuators & Control Hardware */}
        <ActuatorsPanel actuators={computeSystemState(sensors, thresholds).actuators} />

        {/* Real-time Telemetry Chart */}
        <RealTimeChart history={history} thresholds={thresholds} />

        {/* Bottom Section: Alert History & Device Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AlertHistory events={events} onClearHistory={handleClearHistory} />
          <DeviceInfo deviceInfo={deviceInfo} />
        </div>
      </main>

      {/* Threshold Modal */}
      <ThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSave={handleSaveThresholds}
      />

      {/* Telegram Messenger Modal */}
      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        onSuccessToast={(msg) => {
          const nowStr = new Date().toTimeString().split(' ')[0];
          setToasts((prev) => [
            {
              id: `toast-${Date.now()}`,
              type: 'info',
              title: '📱 TELEGRAM SENT',
              message: msg,
              timestamp: nowStr,
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}

export default App;
