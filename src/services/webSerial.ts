import type { SensorData } from '../types/iot';

declare global {
  interface Navigator {
    serial: {
      requestPort(options?: any): Promise<any>;
      getPorts(): Promise<any[]>;
    };
  }
}

export interface WebSerialCallbacks {
  onData: (data: Partial<SensorData>, rawLine: string) => void;
  onConnect: (portInfo: string) => void;
  onDisconnect: (error?: string) => void;
}

export class WebSerialManager {
  private port: any = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private keepReading = false;
  private closedPromise: Promise<void> | null = null;

  public static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async connect(callbacks: WebSerialCallbacks, baudRate = 115200): Promise<boolean> {
    if (!WebSerialManager.isSupported()) {
      callbacks.onDisconnect('Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
      return false;
    }

    try {
      this.port = await navigator.serial.requestPort();
      if (!this.port) return false;

      await this.port.open({ baudRate });

      const info = this.port.getInfo ? this.port.getInfo() : {};
      const vendorId = info.usbVendorId ? `0x${info.usbVendorId.toString(16)}` : 'USB';
      const productId = info.usbProductId ? `0x${info.usbProductId.toString(16)}` : 'Serial';
      callbacks.onConnect(`ESP32 Board (${vendorId}:${productId}) @ ${baudRate} baud`);

      this.keepReading = true;
      this.readStream(callbacks);
      return true;
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.error('Serial connection error:', err);
        let userMsg = err.message || 'Failed to open serial port';
        if (
          userMsg.toLowerCase().includes('failed to open') ||
          userMsg.toLowerCase().includes('in use') ||
          userMsg.toLowerCase().includes('locked')
        ) {
          userMsg = "Port locked! Please CLOSE Arduino IDE's Serial Monitor window so the browser can access the port.";
        }
        callbacks.onDisconnect(userMsg);
      } else {
        callbacks.onDisconnect();
      }
      return false;
    }
  }

  private async readStream(callbacks: WebSerialCallbacks) {
    if (!this.port || !this.port.readable) return;

    const textDecoder = new TextDecoderStream();
    this.closedPromise = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (this.keepReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          buffer += value;

          // INSTANT PARSE: Extract all matching sensor patterns from current buffer immediately!
          const immediateParsed = this.parseSerialText(buffer);
          if (Object.keys(immediateParsed).length > 0) {
            callbacks.onData(immediateParsed, buffer);
          }

          const lines = buffer.split(/\r?\n/);
          // Keep buffer size small
          if (lines.length > 1) {
            buffer = lines.pop() || '';
          } else if (buffer.length > 2048) {
            buffer = buffer.slice(-512);
          }
        }
      }
    } catch (error: any) {
      console.error('Serial read stream error:', error);
      callbacks.onDisconnect(error.message || 'Serial connection lost');
    } finally {
      if (this.reader) {
        try {
          this.reader.releaseLock();
        } catch {}
      }
    }
  }

  public parseSerialText(text: string): Partial<SensorData> {
    const result: Partial<SensorData> = {};

    // 1. JSON Parsing
    const jsonMatch = text.match(/\{[^{}]*\}/g);
    if (jsonMatch) {
      for (const jStr of jsonMatch) {
        try {
          const obj = JSON.parse(jStr);
          if (typeof obj.temperature === 'number') result.temperature = obj.temperature;
          if (typeof obj.humidity === 'number') result.humidity = obj.humidity;
          if (typeof obj.distance === 'number') result.distance = obj.distance;
          else if (typeof obj.dist === 'number') result.distance = obj.dist;
          if (typeof obj.light === 'number') result.light = obj.light;
          if (typeof obj.gas === 'number') result.gas = obj.gas;
        } catch {}
      }
    }

    // 2. Key-Value & Label Regex Parsing (Supports optional units like (cm), (°C), (PPM), (ADC))
    // Temperature: 28.80 or Temp (°C): 28.80
    const tempMatches = [...text.matchAll(/(?:Temperature|Temp)\s*(?:\([^)]*\))?\s*[:=]\s*([\d.]+)/gi)];
    if (tempMatches.length > 0) {
      const val = parseFloat(tempMatches[tempMatches.length - 1][1]);
      if (!isNaN(val)) result.temperature = val;
    }

    // Humidity: 57.00 or Humidity (%): 57.00
    const humMatches = [...text.matchAll(/(?:Humidity|Humid|Hum)\s*(?:\([^)]*\))?\s*[:=]\s*([\d.]+)/gi)];
    if (humMatches.length > 0) {
      const val = parseFloat(humMatches[humMatches.length - 1][1]);
      if (!isNaN(val)) result.humidity = val;
    }

    // Distance: 152.15 or Distance (cm): 152.15 or Dist: 152.15 or HC-SR04: 152.15
    const distMatches = [...text.matchAll(/(?:Distance|Dist|Ultrasonic|HC-SR04)\s*(?:\([^)]*\))?\s*[:=]\s*([\d.]+)/gi)];
    if (distMatches.length > 0) {
      const val = parseFloat(distMatches[distMatches.length - 1][1]);
      if (!isNaN(val)) result.distance = val;
    }

    // Light: 2963 or Light (ADC): 2963
    const lightMatches = [...text.matchAll(/(?:Light|LDR)\s*(?:\([^)]*\))?\s*[:=]\s*([\d.]+)/gi)];
    if (lightMatches.length > 0) {
      const val = parseFloat(lightMatches[lightMatches.length - 1][1]);
      if (!isNaN(val)) result.light = Math.round(val);
    }

    // MQ-2 Gas: 620 or Gas (PPM): 620
    const gasMatches = [...text.matchAll(/(?:MQ-2\s*Gas|MQ2|Gas)\s*(?:\([^)]*\))?\s*[:=]\s*([\d.]+)/gi)];
    if (gasMatches.length > 0) {
      const val = parseFloat(gasMatches[gasMatches.length - 1][1]);
      if (!isNaN(val)) result.gas = Math.round(val);
    }

    return result;
  }

  public async disconnect(): Promise<void> {
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {}
    }
    if (this.closedPromise) {
      try {
        await this.closedPromise;
      } catch {}
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch {}
      this.port = null;
    }
  }
}
