"""
ESP32 Smart Home IoT Monitoring Backend (Python FastAPI)
Provides REST API, WebSockets & Telegram Alert Bot Integration.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import time
import requests
from typing import List, Dict, Any

app = FastAPI(
    title="ESP32 Smart Home IoT API",
    description="Backend API and WebSocket server with Telegram Alerts",
    version="1.0.0"
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State
start_time = time.time()
last_esp32_update = 0
last_telegram_alert_time = 0

# Telegram Bot Config
TELEGRAM_BOT_TOKEN = "8758639842:AAGweDOKzPxa8EoOR8noIJdyPLOqyG0JyVo"
TELEGRAM_CHAT_ID = "8386717210"

thresholds = {
    "temperature": 35.0,
    "humidity": 80.0,
    "distance": 20.0,
    "gas": 1800.0,
    "light": 1500.0
}

current_sensors = {
    "temperature": 26.5,
    "humidity": 58.0,
    "distance": 42.5,
    "light": 1450.0,
    "gas": 380.0,
    "timestamp": time.strftime("%H:%M:%S")
}

class ThresholdUpdate(BaseModel):
    temperature: float
    humidity: float
    distance: float
    gas: float
    light: float

class ESP32DataUpdate(BaseModel):
    temperature: float
    humidity: float
    distance: float
    light: float
    gas: float

# Active WebSocket connections
active_connections: List[WebSocket] = []

async def broadcast_data(data: Dict[str, Any]):
    for connection in active_connections:
        try:
            await connection.send_json(data)
        except Exception:
            pass

def send_telegram_alert(message: str):
    global last_telegram_alert_time
    # Cooldown 30s between Telegram messages to prevent spam
    if time.time() - last_telegram_alert_time < 30:
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "Markdown"}
    try:
        res = requests.post(url, json=payload, timeout=3)
        print(f"[Telegram Alert Sent] Status: {res.status_code}")
        last_telegram_alert_time = time.time()
    except Exception as e:
        print(f"Telegram alert error: {e}")

def calculate_actuators(sensors: dict, thresh: dict):
    alerts = []
    if sensors["temperature"] >= thresh["temperature"]:
        alerts.append(f"High Temp: {sensors['temperature']}°C")
    if sensors["humidity"] >= thresh["humidity"]:
        alerts.append(f"High Humidity: {sensors['humidity']}%")
    if sensors["distance"] <= thresh["distance"]:
        alerts.append(f"🚨 Low Distance Warning: Object detected at {sensors['distance']}cm (Limit: {thresh['distance']}cm)")
    if sensors["gas"] >= thresh["gas"]:
        alerts.append(f"Gas Leak Alert: {sensors['gas']} PPM")

    is_alert = len(alerts) > 0

    if is_alert:
        msg = f"⚠️ *ESP32 SMART HOME ALERT!*\n" + "\n".join([f"• {a}" for a in alerts]) + "\n\n🚨 Actuators & Alarm Engaged!"
        send_telegram_alert(msg)

    return {
        "greenLed": not is_alert,
        "redLed": is_alert,
        "buzzer": is_alert,
        "relay": is_alert,
        "systemStatus": "ALERT" if is_alert else "NORMAL"
    }

@app.get("/")
def read_root():
    return {"status": "ok", "message": "ESP32 Smart Home Backend Running"}

@app.get("/api/sensors")
def get_sensors():
    actuators = calculate_actuators(current_sensors, thresholds)
    is_connected = (time.time() - last_esp32_update) < 10
    return {
        "sensors": current_sensors,
        "actuators": actuators,
        "thresholds": thresholds,
        "isRealESP32Connected": is_connected
    }

@app.post("/api/esp32/update")
def post_esp32_update(data: ESP32DataUpdate):
    global current_sensors, last_esp32_update
    last_esp32_update = time.time()
    current_sensors = {
        "temperature": data.temperature,
        "humidity": data.humidity,
        "distance": data.distance,
        "light": data.light,
        "gas": data.gas,
        "timestamp": time.strftime("%H:%M:%S")
    }
    
    actuators = calculate_actuators(current_sensors, thresholds)
    asyncio.create_task(broadcast_data({
        "type": "TELEMETRY",
        "sensors": current_sensors,
        "actuators": actuators,
        "thresholds": thresholds
    }))
    
    return {"status": "success", "message": "ESP32 sensor data recorded"}

@app.get("/api/thresholds")
def get_thresholds():
    return thresholds

@app.post("/api/thresholds")
def set_thresholds(new_thresh: ThresholdUpdate):
    global thresholds
    thresholds["temperature"] = new_thresh.temperature
    thresholds["humidity"] = new_thresh.humidity
    thresholds["distance"] = new_thresh.distance
    thresholds["gas"] = new_thresh.gas
    thresholds["light"] = new_thresh.light
    return {"status": "success", "thresholds": thresholds}

@app.get("/api/device")
def get_device_info():
    uptime = int(time.time() - start_time)
    is_hardware = (time.time() - last_esp32_update) < 10
    return {
        "deviceModel": "ESP32-WROOM-32",
        "connectionType": "Wi-Fi (REST/WebSocket)" if is_hardware else "USB Serial Bridge",
        "ipAddress": "192.168.1.105" if is_hardware else "127.0.0.1",
        "uptimeSeconds": uptime,
        "firmware": "Smart Home v1.0",
        "sensorsOnline": 5 if is_hardware else 0,
        "totalSensors": 5,
        "updateInterval": 2,
        "isConnected": is_hardware
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        actuators = calculate_actuators(current_sensors, thresholds)
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "sensors": current_sensors,
            "actuators": actuators,
            "thresholds": thresholds
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)
