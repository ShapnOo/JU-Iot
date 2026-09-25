import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() {
  runApp(const Esp32SmartHomeApp());
}

class Esp32SmartHomeApp extends StatelessWidget {
  const Esp32SmartHomeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ESP32 Smart Home',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF080C14),
        cardColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF06B6D4),
          surface: Color(0xFF0F172A),
        ),
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final TextEditingController _ipController =
      TextEditingController(text: '192.168.1.105');

  bool _isConnected = false;
  Timer? _timer;

  // Sensor data
  double _temperature = 0.0;
  double _humidity = 0.0;
  double _distance = 0.0;
  int _light = 0;
  int _gas = 0;

  // Thresholds
  final double _tempThresh = 35.0;
  final double _humidityThresh = 80.0;
  final double _distanceThresh = 20.0;
  final int _gasThresh = 1800;

  // Actuators
  bool _greenLed = true;
  bool _redLed = false;
  bool _buzzer = false;
  bool _relay = false;
  String _systemStatus = 'NORMAL';
  List<String> _alerts = [];

  static const Color emeraldColor = Color(0xFF10B981);

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _ipController.dispose();
    super.dispose();
  }

  void _startPolling() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _fetchSensorData());
  }

  Future<void> _fetchSensorData() async {
    final ip = _ipController.text.trim();
    if (ip.isEmpty) return;

    final url = Uri.parse(ip.startsWith('http') ? '$ip/api/sensors' : 'http://$ip/api/sensors');

    try {
      final response = await http.get(url).timeout(const Duration(milliseconds: 1500));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final sensors = data['sensors'] ?? data;

        final t = (sensors['temperature'] ?? 0.0).toDouble();
        final h = (sensors['humidity'] ?? 0.0).toDouble();
        final d = (sensors['distance'] ?? 0.0).toDouble();
        final l = (sensors['light'] ?? 0).toInt();
        final g = (sensors['gas'] ?? 0).toInt();

        _evaluateState(t, h, d, l, g);

        setState(() {
          _temperature = t;
          _humidity = h;
          _distance = d;
          _light = l;
          _gas = g;
          _isConnected = true;
        });
      } else {
        setState(() => _isConnected = false);
      }
    } catch (_) {
      if (_isConnected) {
        setState(() => _isConnected = false);
      }
    }
  }

  void _evaluateState(double t, double h, double d, int l, int g) {
    List<String> activeAlerts = [];

    if (t >= _tempThresh) activeAlerts.add('High Temp: $t°C');
    if (h >= _humidityThresh) activeAlerts.add('High Humidity: $h%');
    if (d > 0 && d <= _distanceThresh) activeAlerts.add('Object Nearby: ${d}cm');
    if (g >= _gasThresh) activeAlerts.add('Gas Alert: $g PPM');

    final isAlert = activeAlerts.isNotEmpty;

    _systemStatus = isAlert ? 'ALERT' : 'NORMAL';
    _greenLed = !isAlert;
    _redLed = isAlert;
    _buzzer = isAlert;
    _relay = isAlert;
    _alerts = activeAlerts;
  }

  @override
  Widget build(BuildContext context) {
    final isNormal = _systemStatus == 'NORMAL';

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0B111D),
        elevation: 0,
        title: const Row(
          children: [
            Icon(Icons.developer_board, color: Color(0xFF06B6D4), size: 22),
            SizedBox(width: 8),
            Text(
              'ESP32 Smart Home',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: _isConnected
                  ? emeraldColor.withValues(alpha: 0.15)
                  : Colors.red.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _isConnected
                    ? emeraldColor.withValues(alpha: 0.4)
                    : Colors.red.withValues(alpha: 0.4),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  _isConnected ? Icons.wifi : Icons.wifi_off,
                  color: _isConnected ? emeraldColor : Colors.red,
                  size: 14,
                ),
                const SizedBox(width: 4),
                Text(
                  _isConnected ? 'Online' : 'Offline',
                  style: TextStyle(
                    color: _isConnected ? emeraldColor : Colors.red,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Wi-Fi Connection Bar
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.wifi, color: Color(0xFF06B6D4), size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: TextField(
                      controller: _ipController,
                      style: const TextStyle(fontSize: 13, fontFamily: 'monospace'),
                      decoration: const InputDecoration(
                        hintText: 'Enter ESP32 IP (e.g. 192.168.1.105)',
                        border: InputBorder.none,
                        isDense: true,
                      ),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      _fetchSensorData();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF06B6D4),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text('Connect', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Hero System Status Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isNormal
                    ? const Color(0xFF0F172A)
                    : Colors.red.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isNormal ? Colors.white12 : Colors.red.withValues(alpha: 0.4),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            isNormal ? Icons.verified_user : Icons.warning_amber_rounded,
                            color: isNormal ? emeraldColor : Colors.red,
                            size: 28,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            isNormal ? 'Everything Running Safely' : 'Attention Needed',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: isNormal
                              ? emeraldColor.withValues(alpha: 0.2)
                              : Colors.red.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          _systemStatus,
                          style: TextStyle(
                            color: isNormal ? emeraldColor : Colors.red,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    isNormal
                        ? 'All monitored sensor parameters are within safe limits.'
                        : 'One or more sensors breached thresholds. Hardware alert engaged.',
                    style: const TextStyle(fontSize: 12, color: Colors.white60),
                  ),
                  if (_alerts.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: _alerts.map((a) => Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(color: Colors.red.withValues(alpha: 0.4)),
                        ),
                        child: Text(a, style: const TextStyle(fontSize: 11, color: Colors.redAccent)),
                      )).toList(),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 16),

            const Text(
              'LIVE SENSORS',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white54, letterSpacing: 1.2),
            ),
            const SizedBox(height: 10),

            // 5 Sensor Grid
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.3,
              children: [
                _buildSensorCard(
                  title: 'Temperature',
                  value: '${_temperature.toStringAsFixed(1)} °C',
                  icon: Icons.thermostat,
                  color: Colors.amber,
                  isAlert: _temperature >= _tempThresh,
                  limit: 'Limit: $_tempThresh°C',
                ),
                _buildSensorCard(
                  title: 'Humidity',
                  value: '${_humidity.toStringAsFixed(1)} %',
                  icon: Icons.water_drop,
                  color: Colors.cyan,
                  isAlert: _humidity >= _humidityThresh,
                  limit: 'Limit: $_humidityThresh%',
                ),
                _buildSensorCard(
                  title: 'Distance',
                  value: '${_distance.toStringAsFixed(1)} cm',
                  icon: Icons.radar,
                  color: Colors.indigoAccent,
                  isAlert: _distance > 0 && _distance <= _distanceThresh,
                  limit: 'Limit ≤ $_distanceThresh cm',
                ),
                _buildSensorCard(
                  title: 'Light Level',
                  value: '$_light ADC',
                  icon: Icons.wb_sunny,
                  color: Colors.yellow,
                  isAlert: false,
                  limit: 'Range: 0-4095',
                ),
                _buildSensorCard(
                  title: 'MQ-2 Gas',
                  value: '$_gas PPM',
                  icon: Icons.local_fire_department,
                  color: Colors.orange,
                  isAlert: _gas >= _gasThresh,
                  limit: 'Limit: $_gasThresh',
                ),
              ],
            ),

            const SizedBox(height: 16),

            const Text(
              'ACTUATOR SWITCHES',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white54, letterSpacing: 1.2),
            ),
            const SizedBox(height: 10),

            // Actuators
            Row(
              children: [
                Expanded(child: _buildActuatorTile('Green LED', _greenLed, Icons.lightbulb, emeraldColor)),
                const SizedBox(width: 8),
                Expanded(child: _buildActuatorTile('Red LED', _redLed, Icons.warning, Colors.red)),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _buildActuatorTile('Buzzer', _buzzer, Icons.volume_up, Colors.red)),
                const SizedBox(width: 8),
                Expanded(child: _buildActuatorTile('Relay', _relay, Icons.flash_on, Colors.amber)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSensorCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required bool isAlert,
    required String limit,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isAlert ? Colors.red.withValues(alpha: 0.15) : const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isAlert ? Colors.red.withValues(alpha: 0.4) : Colors.white10,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, color: Colors.white70)),
              Icon(icon, color: isAlert ? Colors.red : color, size: 18),
            ],
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'monospace'),
          ),
          Text(limit, style: const TextStyle(fontSize: 10, color: Colors.white38)),
        ],
      ),
    );
  }

  Widget _buildActuatorTile(String title, bool isOn, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isOn ? color.withValues(alpha: 0.15) : const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOn ? color.withValues(alpha: 0.4) : Colors.white10,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: isOn ? color : Colors.white38),
              const SizedBox(width: 6),
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
          Text(
            isOn ? 'ON' : 'OFF',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isOn ? color : Colors.white38,
            ),
          ),
        ],
      ),
    );
  }
}
