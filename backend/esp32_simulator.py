"""
ESP32 Hardware Simulator Script
Simulates a real ESP32 microcontroller sending HTTP POST requests to the Python Backend.
"""

import time
import random
import requests

API_URL = "http://localhost:8000/api/esp32/update"

print("Starting ESP32 Hardware Simulator...")
print(f"Target URL: {API_URL}")

while True:
    payload = {
        "temperature": round(random.uniform(25.0, 32.0), 1),
        "humidity": round(random.uniform(55.0, 70.0), 1),
        "distance": round(random.uniform(30.0, 80.0), 1),
        "light": round(random.uniform(1500, 3000), 0),
        "gas": round(random.uniform(400, 900), 0)
    }
    
    try:
        res = requests.post(API_URL, json=payload, timeout=3)
        print(f"[{time.strftime('%H:%M:%S')}] Sent ESP32 telemetry -> Status: {res.status_code}")
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Failed to connect to Python backend: {e}")
    
    time.sleep(2)
