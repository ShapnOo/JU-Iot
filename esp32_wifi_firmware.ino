/*
 * ESP32 Smart Home IoT Firmware (Dual-Mode: USB Serial + Wi-Fi REST API + Hardware Control)
 *
 * Monitored Hardware:
 *  - DHT11 (Temperature & Humidity) -> Pin 4
 *  - HC-SR04 (Distance Ultrasonic)   -> Trig: Pin 5, Echo: Pin 18
 *  - LDR Light Sensor                -> Pin 34 (ADC)
 *  - MQ-2 Gas Sensor                 -> Pin 35 (ADC)
 *  - Green LED                       -> Pin 12
 *  - Red LED                         -> Pin 13
 *  - Buzzer                          -> Pin 14
 *  - Relay                           -> Pin 27
 */

#include <DHT.h>
#include <WebServer.h>
#include <WiFi.h>

// ==================== CONFIGURATION ====================
const char *ssid = "Tahmid's iPhone"; // Target Wi-Fi name
const char *password = "asdfghjkl";   // Target Wi-Fi password

#define DHTPIN 4
#define DHTTYPE DHT11

#define TRIG_PIN 5
#define ECHO_PIN 18

#define LDR_PIN 34
#define MQ2_PIN 35

#define GREEN_LED 12
#define RED_LED 13
#define BUZZER 14
#define RELAY 27

// Threshold Limits
const float TEMP_THRESH = 35.0;
const float HUMIDITY_THRESH = 80.0;
const float DISTANCE_THRESH = 20.0;
const int GAS_THRESH = 1800;

// Initialize Objects
DHT dht(DHTPIN, DHTTYPE);
WebServer server(80);

// Sensor Globals
float temperature = 0.0;
float humidity = 0.0;
float distance = 0.0;
int lightLevel = 0;
int gasLevel = 0;
bool isWifiConnected = false;

void setup() {
  Serial.begin(115200);

  // Pin Modes
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(RELAY, OUTPUT);

  dht.begin();

  Serial.println("\n------------------------------------------");
  Serial.println("🔍 Scanning Wi-Fi networks...");

  // Scan available networks to handle iPhone special apostrophes (' vs ’)
  int numNetworks = WiFi.scanNetworks();
  String matchedSsid = ssid;
  
  for (int i = 0; i < numNetworks; i++) {
    String found = WiFi.SSID(i);
    // If network name contains Tahmid or iPhone, auto-match exact broadcast name!
    if (found.indexOf("Tahmid") >= 0 || found.indexOf("iPhone") >= 0 || found.indexOf("iphone") >= 0) {
      matchedSsid = found;
      Serial.print("✅ Found matching Hotspot SSID: ");
      Serial.println(matchedSsid);
      break;
    }
  }

  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(matchedSsid);
  WiFi.begin(matchedSsid.c_str(), password);

  int wifiTimeout = 0;
  while (WiFi.status() != WL_CONNECTED && wifiTimeout < 20) {
    delay(500);
    Serial.print(".");
    wifiTimeout++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    isWifiConnected = true;
    Serial.println("\n✅ Wi-Fi Connected Successfully!");
    Serial.print("📡 ESP32 IP Address: ");
    Serial.println(WiFi.localIP());

    server.on("/api/sensors", HTTP_GET, handleGetSensors);
    server.onNotFound([]() { server.send(404, "text/plain", "Not Found"); });
    server.begin();
    Serial.println("🌐 HTTP Web Server Started!");
  } else {
    Serial.println("\n⚠️ Wi-Fi Hotspot not connected. Continuing in USB Serial Mode!");
  }

  Serial.println("------------------------------------------");
}

void loop() {
  if (isWifiConnected) {
    server.handleClient();
  }
  readSensors();
  updateActuators();
  delay(100); // 100ms fast real-time loop
}

void readSensors() {
  // 1. Temperature & Humidity
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t))
    temperature = t;
  if (!isnan(h))
    humidity = h;

  // 2. HC-SR04 Distance
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  distance = (duration * 0.0343) / 2.0;

  // 3. LDR & MQ-2 Analog Readings
  lightLevel = analogRead(LDR_PIN);
  gasLevel = analogRead(MQ2_PIN);

  // Stream output to USB Serial continuously
  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.println(" °C");
  Serial.print("Humidity    : ");
  Serial.print(humidity);
  Serial.println(" %");
  Serial.print("Distance    : ");
  Serial.print(distance);
  Serial.println(" cm");
  Serial.print("Light       : ");
  Serial.println(lightLevel);
  Serial.print("MQ-2 Gas    : ");
  Serial.println(gasLevel);
  Serial.println("------------------------------------------");
}

void updateActuators() {
  bool isAlert =
      (temperature >= TEMP_THRESH) || (humidity >= HUMIDITY_THRESH) ||
      (distance > 0 && distance <= DISTANCE_THRESH) || (gasLevel >= GAS_THRESH);

  if (isAlert) {
    digitalWrite(GREEN_LED, LOW);
    digitalWrite(RED_LED, HIGH);
    digitalWrite(BUZZER, HIGH);
    digitalWrite(RELAY, HIGH);
  } else {
    digitalWrite(GREEN_LED, HIGH);
    digitalWrite(RED_LED, LOW);
    digitalWrite(BUZZER, LOW);
    digitalWrite(RELAY, LOW);
  }
}

void handleGetSensors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");

  String json = "{";
  json += "\"temperature\":" + String(temperature, 1) + ",";
  json += "\"humidity\":" + String(humidity, 1) + ",";
  json += "\"distance\":" + String(distance, 1) + ",";
  json += "\"light\":" + String(lightLevel) + ",";
  json += "\"gas\":" + String(gasLevel);
  json += "}";

  server.send(200, "application/json", json);
}
