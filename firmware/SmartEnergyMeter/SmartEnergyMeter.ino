/*
  =============================================================================
  Smart Energy Meter & Room Automation Controller
  ESP32 Firmware with Dual 5V Relays, PIR, IR, HC-SR04 & ACS712 Current Sensor
  =============================================================================
  Hardware Pin Map:
  - IR Sensor DO        -> GPIO 26 (Digital IN: Active-LOW, LOW = obstacle detected)
  - PIR Sensor OUT      -> GPIO 27 (Digital IN: Active-HIGH, HIGH = motion detected)
  - HC-SR04 TRIG        -> GPIO 5  (Digital OUT: 10µs trigger pulse)
  - HC-SR04 ECHO        -> GPIO 18 (Digital IN via 1kΩ/2kΩ voltage divider from 5V to 3.3V)
  - Relay 1 (Load 1)    -> GPIO 25 (Digital OUT: Active-LOW, 5V DC bulb)
  - Relay 2 (Load 2)    -> GPIO 33 (Digital OUT: Active-LOW, 5V DC bulb)
  - ACS712 Current OUT  -> GPIO 34 (Analog IN: ADC1 CH6 - WiFi Safe on ESP32)
  - Common DC Voltage   -> Nominal 5.0V DC bus feeding both 5V DC loads

  IMPORTANT SAFETY CONSTRAINTS:
  - Pure 5V DC prototype. DO NOT connect 230V AC mains to this prototype.
  - ESP32 GPIOs are not 5V tolerant. ECHO pin MUST use a voltage divider (1kΩ/2kΩ).
  - Relay module is Active-LOW (LOW = ON, HIGH = OFF). Boot default is safe OFF.
  - One ACS712 current sensor measures the COMBINED current of both DC loads in series.
  - Power (W) = Voltage (V) * Current (A). Energy accumulated in Wh and kWh.
  - Manual Mode strictly locks relays against sensor override.
  - Automatic Mode uses multi-sensor fusion (PIR + IR + Ultrasonic) with debounce
    intervals and an adjustable no-occupancy timeout (default: 300s = 5 minutes).
  =============================================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager

// -----------------------------------------------------------------------------
// PIN DEFINITIONS
// -----------------------------------------------------------------------------
#define PIN_IR_DO     26  // IR Obstacle Sensor DO (Active-LOW)
#define PIN_PIR_OUT   27  // PIR Motion Sensor OUT (Active-HIGH)
#define PIN_US_TRIG   5   // HC-SR04 Ultrasonic Trigger
#define PIN_US_ECHO   18  // HC-SR04 Ultrasonic Echo (through 1k/2k voltage divider)
#define PIN_RELAY_1   25  // Relay 1 (5V DC Bulb 1)
#define PIN_RELAY_2   33  // Relay 2 (5V DC Bulb 2)

// Hardware Current Sensor (ADC1 CH6 - WiFi safe on ESP32)
#define PIN_ACS712    34  // ACS712 Current Sensor Analog OUT

// Most 5V relay modules are ACTIVE-LOW (LOW = ON, HIGH = OFF)
const bool RELAY_ACTIVE_LOW = true;
#define RELAY_STATE_ON  (RELAY_ACTIVE_LOW ? LOW : HIGH)
#define RELAY_STATE_OFF (RELAY_ACTIVE_LOW ? HIGH : LOW)

// -----------------------------------------------------------------------------
// GLOBAL STATE & SYSTEM CONFIGURATION
// -----------------------------------------------------------------------------
WebServer server(80);
Preferences preferences;

// ACS712 Current Sensor Configuration
// 5A module  = 0.185 V/A (185 mV/A)
// 20A module = 0.100 V/A (100 mV/A)
// 30A module = 0.066 V/A (66 mV/A)
float acs_sensitivity = 0.100;        // Default: 20A module (0.100 V/A)
float acs_calib_factor = 1.0;         // Current multiplier calibration factor
float acs_zero_voltage = 2.50;        // Quiescent midpoint voltage at 0 Amps

// Live Hardware Telemetry
float measured_current = 0.0;         // Live DC Current (A) from ACS712
bool hardware_current_active = false; // True when load > 0.05A detected through ACS712

// 5V DC Prototype Electrical Ratings
float grid_voltage = 5.0;             // Common DC Supply Voltage (5.0V DC)
float tariff_rate = 8.0;              // Cost per kWh (₹ / $ / €)

// Sensor Telemetry
bool ir_detected = false;             // True when obstacle/presence detected (IR pin LOW)
bool pir_motion = false;              // True when motion detected (PIR pin HIGH)
float distance_cm = 0.0;              // HC-SR04 distance in cm
bool distance_valid = false;          // True when echo pulse was successfully captured
bool occupancy_detected = false;      // Fused multi-sensor occupancy state
unsigned long last_motion_timestamp = 0; // Timestamp of last confirmed activity

// Relay States
bool relay1_on = false;               // Actual state of Relay 1
bool relay2_on = false;               // Actual state of Relay 2
unsigned long last_relay_switch_ms = 0; // Debounce timestamp for anti-chatter protection
const unsigned long MIN_SWITCH_INTERVAL_MS = 3000; // 3-second debounce between auto switches

// Energy Metrics (DC: Power = V * I, Energy integrated over time)
double cumulative_wh = 0.0;           // Accumulated energy in Watt-hours
double cumulative_kwh = 0.0;          // Accumulated energy in Kilowatt-hours
float current_power_watts = 0.0;      // Real-time Power (W)
float current_amps = 0.0;             // Real-time Current (A)

// Smart Automation Configuration
bool auto_mode = false;               // False = Manual Control (Default), True = Smart Control
int auto_target = 3;                  // 1 = Load 1 only, 2 = Load 2 only, 3 = Both loads
int auto_off_delay_sec = 300;         // Default: 300s (5 minutes) vacancy timeout
float occupancy_dist_threshold_cm = 120.0; // Distance threshold for ultrasonic presence
String last_action_reason = "System Initialized"; // Audit trail for relay actions

// Timing loops (non-blocking)
unsigned long last_sensor_read_ms = 0;
unsigned long last_energy_calc_ms = 0;
unsigned long last_flash_save_ms = 0;

// -----------------------------------------------------------------------------
// HELPER: Measure DC Current from ACS712 Hardware Sensor
// -----------------------------------------------------------------------------
void readHardwareCurrentSensor() {
  const int NUM_SAMPLES = 80;
  long sum_raw = 0;

  // Average over multiple samples to suppress ADC noise
  for (int j = 0; j < NUM_SAMPLES; j++) {
    sum_raw += analogRead(PIN_ACS712);
    delayMicroseconds(150);
  }

  float avg_raw = (float)sum_raw / (float)NUM_SAMPLES;
  // Convert ESP32 ADC (0-4095) to Voltage (3.3V reference with 11dB attenuation)
  float v_out = (avg_raw / 4095.0f) * 3.3f;

  // For DC measurement: I = (Vout - Vzero) / Sensitivity * Calibration
  float diff_v = v_out - acs_zero_voltage;
  float i_dc = (diff_v / acs_sensitivity) * acs_calib_factor;

  // Measurement noise gate: ACS712 has ~30-50mA noise band on ESP32 ADC
  if (fabs(i_dc) < 0.05f) {
    i_dc = 0.0f;
    hardware_current_active = false;
  } else {
    hardware_current_active = true;
  }

  measured_current = fabs(i_dc);
}

// -----------------------------------------------------------------------------
// HELPER: Auto-Zero ACS712 at Boot (Calibrates no-load baseline)
// -----------------------------------------------------------------------------
void calibrateACS712Zero() {
  const int CAL_SAMPLES = 200;
  long sum_raw = 0;
  for (int i = 0; i < CAL_SAMPLES; i++) {
    sum_raw += analogRead(PIN_ACS712);
    delayMicroseconds(200);
  }
  float avg_raw = (float)sum_raw / (float)CAL_SAMPLES;
  float measured_zero = (avg_raw / 4095.0f) * 3.3f;

  // Reasonable check: quiescent output should be between 2.0V and 3.0V
  if (measured_zero >= 1.8f && measured_zero <= 3.1f) {
    acs_zero_voltage = measured_zero;
    Serial.printf("[ACS712] Calibrated zero baseline: %.3f V\n", acs_zero_voltage);
  } else {
    Serial.printf("[ACS712] Baseline %.3f V outside expected range. Using default 2.50V\n", measured_zero);
  }
}

// -----------------------------------------------------------------------------
// HELPER: HC-SR04 Ultrasonic Distance Measurement with Validation
// -----------------------------------------------------------------------------
float measureDistanceCm(bool &valid) {
  digitalWrite(PIN_US_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_US_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_US_TRIG, LOW);

  // Measure echo pulse with 25ms timeout (~400cm max range)
  long duration = pulseIn(PIN_US_ECHO, HIGH, 25000);
  if (duration <= 0 || duration > 25000) {
    valid = false;
    return -1.0f;
  }

  // Speed of sound: 343 m/s = 0.0343 cm/µs. Round-trip divided by 2.
  float dist = (duration * 0.0343f) / 2.0f;
  if (dist < 2.0f || dist > 400.0f) {
    valid = false;
    return dist;
  }

  valid = true;
  return dist;
}

// -----------------------------------------------------------------------------
// HELPER: Relay Controller (Active-LOW Hardware Logic)
// -----------------------------------------------------------------------------
void setRelay(int relayNum, bool state) {
  if (relayNum == 1) {
    relay1_on = state;
    digitalWrite(PIN_RELAY_1, state ? RELAY_STATE_ON : RELAY_STATE_OFF);
  } else if (relayNum == 2) {
    relay2_on = state;
    digitalWrite(PIN_RELAY_2, state ? RELAY_STATE_ON : RELAY_STATE_OFF);
  }
}

// -----------------------------------------------------------------------------
// HELPER: Save Cumulative Energy & Config to Non-Volatile Flash
// -----------------------------------------------------------------------------
void saveEnergyToFlash() {
  preferences.begin("energymeter", false);
  preferences.putDouble("wh", cumulative_wh);
  preferences.putFloat("voltage", grid_voltage);
  preferences.putFloat("tariff", tariff_rate);
  preferences.putBool("auto_mode", auto_mode);
  preferences.putInt("target", auto_target);
  preferences.putInt("delay_sec", auto_off_delay_sec);
  preferences.putFloat("dist_thresh", occupancy_dist_threshold_cm);
  preferences.putFloat("calib_i", acs_calib_factor);
  preferences.putFloat("acs_sens", acs_sensitivity);
  preferences.end();
}

void loadEnergyFromFlash() {
  preferences.begin("energymeter", true);
  cumulative_wh = preferences.getDouble("wh", 0.0);
  cumulative_kwh = cumulative_wh / 1000.0;
  grid_voltage = preferences.getFloat("voltage", 5.0);
  tariff_rate = preferences.getFloat("tariff", 8.0);
  auto_mode = preferences.getBool("auto_mode", false);
  auto_target = preferences.getInt("target", 3);
  auto_off_delay_sec = preferences.getInt("delay_sec", 300);
  occupancy_dist_threshold_cm = preferences.getFloat("dist_thresh", 120.0);
  acs_calib_factor = preferences.getFloat("calib_i", 1.0);
  acs_sensitivity = preferences.getFloat("acs_sens", 0.100);
  preferences.end();
}

// -----------------------------------------------------------------------------
// CORS HTTP HEADERS
// -----------------------------------------------------------------------------
void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

void handleOptions() {
  sendCORS();
  server.send(204);
}

// -----------------------------------------------------------------------------
// REST API HANDLER: GET /api/status
// -----------------------------------------------------------------------------
void handleGetStatus() {
  sendCORS();

  int idle_time_sec = (millis() - last_motion_timestamp) / 1000;
  int countdown_sec = auto_off_delay_sec - idle_time_sec;
  if (countdown_sec < 0) countdown_sec = 0;

  String json = "{";
  json += "\"device\":\"ESP32-SmartEnergyMeter\",";
  json += "\"uptime_sec\":" + String(millis() / 1000) + ",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"wifi_rssi\":" + String(WiFi.RSSI()) + ",";
  json += "\"relay1\":" + String(relay1_on ? "true" : "false") + ",";
  json += "\"relay2\":" + String(relay2_on ? "true" : "false") + ",";
  json += "\"auto_mode\":" + String(auto_mode ? "true" : "false") + ",";
  json += "\"auto_target\":" + String(auto_target) + ",";
  json += "\"auto_off_delay_sec\":" + String(auto_off_delay_sec) + ",";
  json += "\"idle_sec\":" + String(idle_time_sec) + ",";
  json += "\"auto_cutoff_countdown_sec\":" + String(countdown_sec) + ",";
  json += "\"occupancy_detected\":" + String(occupancy_detected ? "true" : "false") + ",";
  json += "\"pir_motion\":" + String(pir_motion ? "true" : "false") + ",";
  json += "\"ir_detected\":" + String(ir_detected ? "true" : "false") + ",";
  json += "\"distance_cm\":" + String(distance_cm >= 0 ? distance_cm : 0.0, 1) + ",";
  json += "\"distance_valid\":" + String(distance_valid ? "true" : "false") + ",";
  json += "\"occupancy_dist_threshold_cm\":" + String(occupancy_dist_threshold_cm, 1) + ",";
  json += "\"voltage\":" + String(grid_voltage, 2) + ",";
  json += "\"current_amps\":" + String(current_amps, 3) + ",";
  json += "\"power_watts\":" + String(current_power_watts, 2) + ",";
  json += "\"total_wh\":" + String(cumulative_wh, 2) + ",";
  json += "\"total_kwh\":" + String(cumulative_kwh, 5) + ",";
  json += "\"cost_estimate\":" + String(cumulative_kwh * tariff_rate, 3) + ",";
  json += "\"tariff_rate\":" + String(tariff_rate, 2) + ",";
  json += "\"last_action_reason\":\"" + last_action_reason + "\",";
  json += "\"hardware_sensors\":true,";
  json += "\"hardware_current_active\":" + String(hardware_current_active ? "true" : "false") + ",";
  json += "\"acs_sensitivity\":" + String(acs_sensitivity, 3) + ",";
  json += "\"calib_i\":" + String(acs_calib_factor, 2);
  json += "}";

  server.send(200, "application/json", json);
}

// -----------------------------------------------------------------------------
// REST API HANDLER: POST /api/relay
// -----------------------------------------------------------------------------
void handlePostRelay() {
  sendCORS();
  int relayId = 0;
  bool state = false;

  if (server.hasArg("id")) {
    relayId = server.arg("id").toInt();
  }
  if (server.hasArg("state")) {
    String stateStr = server.arg("state");
    state = (stateStr == "1" || stateStr == "true" || stateStr == "on");
  }

  // Also parse JSON payload if sent in request body
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    int idIdx = body.indexOf("\"id\":");
    if (idIdx != -1) {
      relayId = body.substring(idIdx + 5).toInt();
    }
    int stateIdx = body.indexOf("\"state\":");
    if (stateIdx != -1) {
      state = body.substring(stateIdx + 8).startsWith("true") || body.substring(stateIdx + 8).startsWith("1");
    }
  }

  if (relayId == 1 || relayId == 2) {
    setRelay(relayId, state);
    last_relay_switch_ms = millis();
    last_action_reason = "Manual: Load " + String(relayId) + (state ? " turned ON" : " turned OFF");
    Serial.println(last_action_reason);
    server.send(200, "application/json", "{\"success\":true,\"relay\":" + String(relayId) + ",\"state\":" + String(state ? "true" : "false") + "}");
  } else {
    server.send(400, "application/json", "{\"error\":\"Invalid relay id. Specify 1 or 2.\"}");
  }
}

// -----------------------------------------------------------------------------
// REST API HANDLER: POST /api/auto-mode
// -----------------------------------------------------------------------------
void handlePostAutoMode() {
  sendCORS();
  if (server.hasArg("state")) {
    String stateStr = server.arg("state");
    auto_mode = (stateStr == "1" || stateStr == "true" || stateStr == "on");
  } else if (server.hasArg("plain")) {
    String body = server.arg("plain");
    if (body.indexOf("true") != -1 || body.indexOf("\"state\":1") != -1) {
      auto_mode = true;
    } else if (body.indexOf("false") != -1 || body.indexOf("\"state\":0") != -1) {
      auto_mode = false;
    }
  } else {
    auto_mode = !auto_mode; // Toggle if no argument provided
  }

  if (server.hasArg("target")) {
    int t = server.arg("target").toInt();
    if (t >= 1 && t <= 3) auto_target = t;
  } else if (server.hasArg("plain")) {
    String b = server.arg("plain");
    int idx = b.indexOf("\"target\":");
    if (idx != -1) {
      int t = b.substring(idx + 9).toInt();
      if (t >= 1 && t <= 3) auto_target = t;
    }
  }

  if (auto_mode) {
    if (!occupancy_detected) {
      setRelay(1, false);
      setRelay(2, false);
      last_action_reason = "Auto Mode: All sensors clear -> All Loads OFF";
    } else {
      last_action_reason = "Auto Mode Activated (Target: Load " + String(auto_target) + ")";
    }
  } else {
    last_action_reason = "Manual Mode Activated (Automation Locked)";
  }
  saveEnergyToFlash();
  server.send(200, "application/json", "{\"success\":true,\"auto_mode\":" + String(auto_mode ? "true" : "false") + ",\"auto_target\":" + String(auto_target) + "}");
}

// -----------------------------------------------------------------------------
// REST API HANDLER: POST /api/config
// -----------------------------------------------------------------------------
void handlePostConfig() {
  sendCORS();
  if (server.hasArg("voltage")) grid_voltage = server.arg("voltage").toFloat();
  if (server.hasArg("tariff")) tariff_rate = server.arg("tariff").toFloat();
  if (server.hasArg("delay")) auto_off_delay_sec = server.arg("delay").toInt();
  if (server.hasArg("target")) auto_target = server.arg("target").toInt();
  if (server.hasArg("dist_threshold")) occupancy_dist_threshold_cm = server.arg("dist_threshold").toFloat();
  if (server.hasArg("calib_i")) acs_calib_factor = server.arg("calib_i").toFloat();
  if (server.hasArg("acs_sens")) acs_sensitivity = server.arg("acs_sens").toFloat();

  // Support JSON payload
  if (server.hasArg("plain")) {
    String b = server.arg("plain");
    int i;
    if ((i = b.indexOf("\"voltage\":")) != -1) grid_voltage = b.substring(i + 10).toFloat();
    if ((i = b.indexOf("\"tariff\":")) != -1) tariff_rate = b.substring(i + 9).toFloat();
    if ((i = b.indexOf("\"delay\":")) != -1) auto_off_delay_sec = b.substring(i + 8).toInt();
    if ((i = b.indexOf("\"target\":")) != -1) auto_target = b.substring(i + 9).toInt();
    if ((i = b.indexOf("\"dist_threshold\":")) != -1) occupancy_dist_threshold_cm = b.substring(i + 17).toFloat();
    if ((i = b.indexOf("\"occupancy_dist_threshold_cm\":")) != -1) occupancy_dist_threshold_cm = b.substring(i + 30).toFloat();
    if ((i = b.indexOf("\"calib_i\":")) != -1) acs_calib_factor = b.substring(i + 10).toFloat();
    if ((i = b.indexOf("\"acs_sens\":")) != -1) acs_sensitivity = b.substring(i + 11).toFloat();
  }

  saveEnergyToFlash();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Configuration saved to flash\"}");
}

// -----------------------------------------------------------------------------
// REST API HANDLER: POST /api/reset-energy
// -----------------------------------------------------------------------------
void handleResetEnergy() {
  sendCORS();
  cumulative_wh = 0.0;
  cumulative_kwh = 0.0;
  saveEnergyToFlash();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Energy meter reset to 0 Wh\"}");
}

// -----------------------------------------------------------------------------
// BUILT-IN WEB DASHBOARD (Instant browser test at http://<ESP32-IP>/)
// -----------------------------------------------------------------------------
void handleRootWeb() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<title>ESP32 Smart Energy Meter (5V DC)</title>";
  html += "<style>";
  html += "body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0d1117;color:#c9d1d9;margin:0;padding:20px;display:flex;justify-content:center;}";
  html += ".box{max-width:540px;width:100%;background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;box-shadow:0 8px 24px rgba(0,0,0,0.5);}";
  html += "h1{font-size:20px;color:#58a6ff;margin-top:0;display:flex;align-items:center;gap:8px;}";
  html += ".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}";
  html += ".card{background:#21262d;border:1px solid #30363d;border-radius:8px;padding:12px;}";
  html += ".card h3{margin:0 0 4px 0;font-size:12px;text-transform:uppercase;color:#8b949e;}";
  html += ".card .val{font-size:20px;font-weight:bold;color:#f0f6fc;}";
  html += ".btn{background:#238636;color:#fff;border:none;padding:10px 14px;border-radius:6px;cursor:pointer;font-weight:bold;width:100%;margin-top:8px;}";
  html += ".btn.off{background:#da3633;}";
  html += ".badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;}";
  html += ".badge.on{background:#238636;color:#fff;} .badge.off{background:#30363d;color:#8b949e;}";
  html += ".telemetry{font-size:11px;color:#58a6ff;margin-bottom:12px;padding:6px 10px;background:rgba(88,166,255,0.1);border-radius:6px;}";
  html += "</style></head><body><div class='box'>";
  html += "<h1>⚡ Smart Energy Meter (5V DC)</h1>";
  html += "<div class='telemetry'>Current Sensor: ACS712 (GPIO 34) " + String(hardware_current_active ? "🟢 COMBINED LOAD (" + String(current_amps, 2) + "A)" : "🟡 STANDBY") + " | Rail: " + String(grid_voltage, 1) + "V DC</div>";

  html += "<div class='grid'>";
  html += "<div class='card'><h3>DC Power</h3><div class='val'>" + String(current_power_watts, 2) + " W</div></div>";
  html += "<div class='card'><h3>Energy (Wh)</h3><div class='val'>" + String(cumulative_wh, 2) + " Wh</div></div>";
  html += "<div class='card'><h3>DC Rail</h3><div class='val'>" + String(grid_voltage, 1) + " V</div></div>";
  html += "<div class='card'><h3>Combined Current</h3><div class='val'>" + String(current_amps, 3) + " A</div></div>";
  html += "<div class='card'><h3>PIR Motion</h3><div class='val'><span class='badge " + String(pir_motion ? "on" : "off") + "'>" + String(pir_motion ? "MOTION" : "CLEAR") + "</span></div></div>";
  html += "<div class='card'><h3>IR Obstacle</h3><div class='val'><span class='badge " + String(ir_detected ? "on" : "off") + "'>" + String(ir_detected ? "OBSTACLE" : "CLEAR") + "</span></div></div>";
  html += "<div class='card'><h3>Distance</h3><div class='val'>" + (distance_valid ? String(distance_cm, 1) + " cm" : "Timeout") + "</div></div>";
  html += "<div class='card'><h3>Mode</h3><div class='val'><span class='badge " + String(auto_mode ? "on" : "off") + "'>" + String(auto_mode ? "AUTO" : "MANUAL") + "</span></div></div>";
  html += "</div>";

  html += "<h3>5V DC Bulb Relay Controls</h3>";
  html += "<div class='card' style='margin-bottom:10px;'>";
  html += "<strong>Load 1 (5V DC Bulb - GPIO 25)</strong>";
  html += "<button class='btn " + String(relay1_on ? "off" : "") + "' onclick=\"fetch('/api/relay?id=1&state=" + String(relay1_on ? "0" : "1") + "',{method:'POST'}).then(()=>location.reload())\">" + String(relay1_on ? "Turn OFF" : "Turn ON") + "</button>";
  html += "</div>";

  html += "<div class='card'>";
  html += "<strong>Load 2 (5V DC Bulb - GPIO 33)</strong>";
  html += "<button class='btn " + String(relay2_on ? "off" : "") + "' onclick=\"fetch('/api/relay?id=2&state=" + String(relay2_on ? "0" : "1") + "',{method:'POST'}).then(()=>location.reload())\">" + String(relay2_on ? "Turn OFF" : "Turn ON") + "</button>";
  html += "</div>";

  html += "<p style='font-size:11px;color:#8b949e;margin-top:16px;'>Last Action: " + last_action_reason + "</p>";
  html += "</div><script>setTimeout(()=>location.reload(),3000);</script></body></html>";

  server.send(200, "text/html", html);
}

// -----------------------------------------------------------------------------
// SETUP
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("  ⚡ ESP32 SMART ENERGY MANAGEMENT SYSTEM (5V DC) ⚡");
  Serial.println("=======================================================");

  // 1. Configure Hardware GPIO Pin Modes
  pinMode(PIN_IR_DO, INPUT);
  pinMode(PIN_PIR_OUT, INPUT);
  pinMode(PIN_US_TRIG, OUTPUT);
  pinMode(PIN_US_ECHO, INPUT);
  pinMode(PIN_RELAY_1, OUTPUT);
  pinMode(PIN_RELAY_2, OUTPUT);

  // 2. CRITICAL SAFE BOOT STATE: Initialize Relays to OFF (Active-LOW: HIGH)
  digitalWrite(PIN_RELAY_1, RELAY_STATE_OFF);
  digitalWrite(PIN_RELAY_2, RELAY_STATE_OFF);
  relay1_on = false;
  relay2_on = false;

  // 3. Configure ADC for ACS712 Current Sensor (GPIO 34 / ADC1 CH6)
  pinMode(PIN_ACS712, INPUT);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // Full range ~3.3V

  // Auto-zero the ACS712 quiescent offset while relays are OFF
  delay(100);
  calibrateACS712Zero();

  // 4. Load persistent energy and settings from flash memory
  loadEnergyFromFlash();
  Serial.printf("Loaded saved energy: %.2f Wh (%.5f kWh)\n", cumulative_wh, cumulative_kwh);
  Serial.printf("DC Rail: %.2f V | Auto Mode: %s | Auto Target: %d | Timeout: %ds\n",
                grid_voltage, auto_mode ? "ON" : "OFF", auto_target, auto_off_delay_sec);

  // 5. Connect to Wi-Fi using WiFiManager
  Serial.println("Initializing WiFiManager...");
  WiFiManager wm;
  bool res = wm.autoConnect("EnergyMeter-Setup", "12345678");

  if (!res) {
    Serial.println("\n❌ Failed to connect to Wi-Fi or hit timeout");
  } else {
    Serial.println("\n✅ Wi-Fi Connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  }

  // 6. Setup mDNS responder (http://energymeter.local)
  if (MDNS.begin("energymeter")) {
    Serial.println("mDNS responder started at http://energymeter.local");
  }

  // 7. Register REST API Routes
  server.on("/", HTTP_GET, handleRootWeb);
  server.on("/api/status", HTTP_GET, handleGetStatus);
  server.on("/api/relay", HTTP_POST, handlePostRelay);
  server.on("/api/auto-mode", HTTP_POST, handlePostAutoMode);
  server.on("/api/config", HTTP_POST, handlePostConfig);
  server.on("/api/reset-energy", HTTP_POST, handleResetEnergy);

  // Handle CORS OPTIONS preflight requests
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/relay", HTTP_OPTIONS, handleOptions);
  server.on("/api/auto-mode", HTTP_OPTIONS, handleOptions);
  server.on("/api/config", HTTP_OPTIONS, handleOptions);
  server.on("/api/reset-energy", HTTP_OPTIONS, handleOptions);

  server.begin();
  Serial.println("HTTP Server started. Ready for mobile app requests!");

  last_motion_timestamp = millis();
  last_energy_calc_ms = millis();
  last_sensor_read_ms = millis();
}

// -----------------------------------------------------------------------------
// MAIN LOOP
// -----------------------------------------------------------------------------
void loop() {
  server.handleClient();
  unsigned long now = millis();

  // ---------------------------------------------------------------------------
  // 1. SENSOR SAMPLING & OCCUPANCY EVALUATION (Non-blocking every 250ms)
  // ---------------------------------------------------------------------------
  if (now - last_sensor_read_ms >= 250) {
    last_sensor_read_ms = now;

    // IR Obstacle Sensor: Active-LOW (LOW when beam reflected/obstacle detected)
    ir_detected = (digitalRead(PIN_IR_DO) == LOW);

    // PIR Motion Sensor: Active-HIGH (HIGH when motion detected)
    pir_motion = (digitalRead(PIN_PIR_OUT) == HIGH);

    // Ultrasonic HC-SR04 distance measurement
    distance_cm = measureDistanceCm(distance_valid);

    // Multi-sensor evidence fusion:
    // PIR motion OR IR obstacle OR Ultrasonic valid proximity (<= occupancy_dist_threshold_cm)
    bool ultrasonic_near = distance_valid && (distance_cm >= 3.0f && distance_cm <= occupancy_dist_threshold_cm);
    occupancy_detected = pir_motion || ir_detected || ultrasonic_near;

    // -------------------------------------------------------------------------
    // AUTOMATIC MODE LOAD CONTROL
    // Sensor automation runs ONLY if auto_mode is true.
    // In Manual Mode (auto_mode == false), sensor automation NEVER overrides relays.
    // -------------------------------------------------------------------------
    if (auto_mode) {
      if (occupancy_detected) {
        last_motion_timestamp = now;

        // Anti-chatter protection: Ensure minimum time elapsed since last relay switch
        if (now - last_relay_switch_ms >= MIN_SWITCH_INTERVAL_MS) {
          bool need_action = false;
          String reason = "Auto: Presence detected (";
          if (pir_motion) reason += "PIR ";
          if (ir_detected) reason += "IR ";
          if (ultrasonic_near) reason += "US=" + String(distance_cm, 0) + "cm";
          reason += ") -> ";

          if (auto_target == 1 && !relay1_on) {
            setRelay(1, true);
            last_action_reason = reason + "Load 1 ON";
            need_action = true;
          } else if (auto_target == 2 && !relay2_on) {
            setRelay(2, true);
            last_action_reason = reason + "Load 2 ON";
            need_action = true;
          } else if (auto_target == 3 && (!relay1_on || !relay2_on)) {
            setRelay(1, true);
            setRelay(2, true);
            last_action_reason = reason + "Both Loads ON";
            need_action = true;
          }

          if (need_action) {
            last_relay_switch_ms = now;
            Serial.println(last_action_reason);
          }
        }
      } else {
        // Room vacant: IR, Ultrasonic, and PIR sensors detect nothing!
        // In Smart Control mode, when no sensors detect presence, all loads MUST turn OFF.
        unsigned long idle_sec = (now - last_motion_timestamp) / 1000;

        // Cut off if vacancy timeout elapsed (or immediate if auto_off_delay_sec <= 5)
        if (auto_off_delay_sec <= 5 || idle_sec >= (unsigned long)auto_off_delay_sec) {
          if (relay1_on || relay2_on) {
            if (now - last_relay_switch_ms >= 1000) {
              setRelay(1, false);
              setRelay(2, false);
              last_relay_switch_ms = now;
              last_action_reason = "Auto: All sensors clear (PIR, IR & Ultrasonic) -> All Loads OFF";
              Serial.println(last_action_reason);
            }
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. 5V DC CURRENT, POWER & ENERGY MONITORING (Every 1000ms)
  // ---------------------------------------------------------------------------
  if (now - last_energy_calc_ms >= 1000) {
    unsigned long delta_ms = now - last_energy_calc_ms;
    last_energy_calc_ms = now;

    // Read combined DC current from ACS712 hardware sensor
    readHardwareCurrentSensor();

    if (hardware_current_active) {
      current_amps = measured_current;
      // DC Power (W) = Voltage (V) * Current (A)
      current_power_watts = current_amps * grid_voltage;
    } else {
      current_amps = 0.0f;
      current_power_watts = 0.0f;
    }

    // Energy integration: Wh = Power (W) * (delta_ms / 3,600,000)
    double delta_hours = (double)delta_ms / 3600000.0;
    double delta_wh = (double)current_power_watts * delta_hours;
    cumulative_wh += delta_wh;
    cumulative_kwh = cumulative_wh / 1000.0;
  }

  // ---------------------------------------------------------------------------
  // 3. PERIODIC FLASH BACKUP (Every 5 minutes = 300,000ms)
  // ---------------------------------------------------------------------------
  if (now - last_flash_save_ms >= 300000) {
    last_flash_save_ms = now;
    saveEnergyToFlash();
    Serial.printf("[Flash] Auto-saved cumulative energy: %.2f Wh (%.5f kWh)\n", cumulative_wh, cumulative_kwh);
  }
}
