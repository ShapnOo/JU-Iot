"""
ESP32 Python Serial Bridge
Reads live sensor data from /dev/cu.usbserial-0001 at 115200 baud and forwards it to the Python API / React Dashboard.
"""

import serial
import serial.tools.list_ports
import time
import requests
import re
import sys

API_URL = "http://localhost:8000/api/esp32/update"
BAUD_RATE = 115200

def find_esp32_port():
    ports = serial.tools.list_ports.comports()
    for port in ports:
        if "usbserial" in port.device.lower() or "usbmodem" in port.device.lower() or "cu.usb" in port.device.lower():
            return port.device
    # Default Mac port
    return "/dev/cu.usbserial-0001"

port_name = find_esp32_port()
print(f"🔍 Searching for ESP32 Serial Port...")
print(f"👉 Target Serial Port: {port_name} @ {BAUD_RATE} baud")

try:
    ser = serial.Serial(port_name, BAUD_RATE, timeout=2)
    print(f"✅ Successfully opened {port_name}!")
    print(f"📡 Forwarding ESP32 telemetry to dashboard API at {API_URL}...\n")
except Exception as e:
    print(f"❌ Error opening {port_name}: {e}")
    print("\n💡 TROUBLESHOOTING TIP:")
    print("Close Arduino IDE's Serial Monitor window so the port is freed up!")
    sys.exit(1)

current_sensors = {
    "temperature": 28.4,
    "humidity": 64.0,
    "distance": 42.5,
    "light": 2380.0,
    "gas": 620.0
}

buffer_lines = []

while True:
    try:
        if ser.in_waiting:
            line_bytes = ser.readline()
            line = line_bytes.decode('utf-8', errors='ignore').strip()
            if not line:
                continue

            print(f"[ESP32 Serial] {line}")

            # Parse lines
            t_match = re.search(r'Temperature\s*:\s*([\d.]+)', line, re.I)
            if t_match:
                current_sensors["temperature"] = float(t_match.group(1))

            h_match = re.search(r'Humidity\s*:\s*([\d.]+)', line, re.I)
            if h_match:
                current_sensors["humidity"] = float(h_match.group(1))

            d_match = re.search(r'Distance\s*:\s*([\d.]+)', line, re.I)
            if d_match:
                current_sensors["distance"] = float(d_match.group(1))

            l_match = re.search(r'Light\s*:\s*([\d.]+)', line, re.I)
            if l_match:
                current_sensors["light"] = float(l_match.group(1))

            g_match = re.search(r'(?:MQ-2\s*Gas|Gas)\s*:\s*([\d.]+)', line, re.I)
            if g_match:
                current_sensors["gas"] = float(g_match.group(1))

            # Trigger push to API
            try:
                requests.post(API_URL, json=current_sensors, timeout=1)
            except Exception:
                pass

        time.sleep(0.05)
    except KeyboardInterrupt:
        print("Closing serial port...")
        ser.close()
        break
    except Exception as e:
        print(f"Serial read error: {e}")
        time.sleep(1)
