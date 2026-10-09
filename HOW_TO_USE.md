# 🚀 Quick Start Guide - JU-Iot

Welcome to the JU-Iot Smart Home project! This guide will walk you through how to get everything up and running in a few easy steps.

## 1️⃣ Setting up the Hardware (ESP32)
1. Connect your sensors (DHT11, HC-SR04, LDR, MQ-2, LEDs, Buzzer) to the ESP32.
2. Open `esp32_wifi_firmware.ino` in the **Arduino IDE**.
3. Plug the ESP32 into your computer using a USB cable.
4. Select your ESP32 board and port in Arduino IDE, then click **Upload**.
5. **IMPORTANT:** Close the Arduino IDE Serial Monitor after uploading. This frees up the USB port so the web dashboard can read the data.

## 2️⃣ Running the Web Dashboard (Frontend)
1. Open your terminal (or command prompt) and navigate to the project folder:
   ```bash
   cd "/Volumes/Office Files/University Project/IOT"
   ```
2. Install the necessary web packages:
   ```bash
   npm install
   ```
3. Start the dashboard:
   ```bash
   npm run dev
   ```
4. Open your web browser (Chrome or Edge recommended) and go to `http://localhost:5174/` (or the URL shown in your terminal).

## 3️⃣ Running the Python Server (Backend)
1. Open a new terminal window and navigate to the project folder:
   ```bash
   cd "/Volumes/Office Files/University Project/IOT"
   ```
2. Install the required Python packages:
   ```bash
   pip install -r backend/requirements.txt
   ```
3. Start the backend server:
   ```bash
   uvicorn backend.server:app --reload --port 8000
   ```

## 4️⃣ Running the Mobile App (Optional)
1. Open a new terminal window and navigate to the mobile app folder:
   ```bash
   cd "/Volumes/Office Files/University Project/IOT/mobile_app"
   ```
2. Run the Flutter app on your connected phone or emulator:
   ```bash
   flutter run
   ```

## 🎉 You're All Set!
- **Web Dashboard:** Click "Connect USB Serial" in the dashboard to stream real-time data directly from your ESP32.
- **Telegram Alerts:** Threshold alerts and custom messages can be managed and sent directly via the Telegram bot integration.
- **Voice Assistant:** Use the microphone button in the dashboard to interact with the system using your voice!
