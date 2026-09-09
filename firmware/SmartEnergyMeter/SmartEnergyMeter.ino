/*
  =============================================================================
  Smart Energy Meter & Room Automation Controller
  ESP32 Firmware with Dual Relays, IR, PIR, and HC-SR04 Ultrasonic Sensor
  =============================================================================
  Hardware Pin Map:
  - IR Sensor DO        -> GPIO 26 (Digital IN: LOW when obstacle detected)
  - PIR Sensor OUT      -> GPIO 27 (Digital IN: HIGH when motion detected)
  - HC-SR04 TRIG        -> GPIO 5  (Digital OUT: 10µs pulse)
  - HC-SR04 ECHO        -> GPIO 18 (Digital IN via 1kΩ/2kΩ voltage divider)
  - Relay 1 (Load 1)    -> GPIO 25 (Digital OUT: Active-LOW trigger)
  - Relay 2 (Load 2)    -> GPIO 33 (Digital OUT: Active-LOW trigger)

  Features:
  - Real-time Power & Cumulative kWh tracking with Non-Volatile Flash storage
  - Smart Occupancy Auto-Off mode to eliminate vampire power
  - Full REST API with CORS enabled for React Native mobile app & Web integration
  - Built-in Fallback Web Dashboard for immediate browser testing
  - WiFi Station + SoftAP fallback (Access Point if router not found)
  =============================================================================
*/

#include <WiFi.h>
#include <WebServer.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <WiFiManager.h> // https://github.com/tzapu/WiFiManager


// -----------------------------------------------------------------------------
// PIN DEFINITIONS (User Hardware Configuration)
// -----------------------------------------------------------------------------
#define PIN_IR_DO     26  // IR Obstacle Sensor DO
#define PIN_PIR_OUT   27  // PIR Motion Sensor OUT
#define PIN_US_TRIG   5   // HC-SR04 Ultrasonic Trigger
#define PIN_US_ECHO   18  // HC-SR04 Ultrasonic Echo (through voltage divider)
#define PIN_RELAY_1   25  // Relay 1 (e.g. Light / Fan)
#define PIN_RELAY_2   33  // Relay 2 (e.g. AC / Socket)

// Most standard 5V/3.3V relay boards are ACTIVE-LOW (LOW = ON, HIGH = OFF)
const bool RELAY_ACTIVE_LOW = true;
#define RELAY_STATE_ON  (RELAY_ACTIVE_LOW ? LOW : HIGH)
#define RELAY_STATE_OFF (RELAY_ACTIVE_LOW ? HIGH : LOW)

// -----------------------------------------------------------------------------
// GLOBAL STATE & SETTINGS
// -----------------------------------------------------------------------------
WebServer server(80);
Preferences preferences;

// Appliance power ratings (in Watts) - user configurable via app/API
float load1_watts = 60.0;     // Default Load 1: 60W (e.g. bulb / fan)
float load2_watts = 1200.0;   // Default Load 2: 1200W (e.g. AC / heater / kettle)
float grid_voltage = 230.0;   // Mains voltage (230V or 120V)
float tariff_rate = 8.0;      // Cost per kWh in your currency (₹ / $ / €)

// Sensor Telemetry
bool ir_detected = false;
bool pir_motion = false;
float distance_cm = 0.0;
unsigned long last_motion_timestamp = 0;

// Relay states
bool relay1_on = false;
bool relay2_on = false;

// Energy Metrics
double cumulative_kwh = 0.0;
float current_power_watts = 0.0;
float current_amps = 0.0;

// Smart Auto-off automation
bool auto_mode = true;
int auto_off_delay_sec = 180; // Turn off relays after 3 minutes of no motion
float occupancy_dist_threshold_cm = 120.0; // Distance threshold for ultrasonic

// Timing loops
unsigned long last_energy_calc_ms = 0;
unsigned long last_flash_save_ms = 0;
unsigned long last_sensor_read_ms = 0;

// -----------------------------------------------------------------------------
// HELPER: Ultrasonic Distance Measurement
// -----------------------------------------------------------------------------
float measureDistanceCm() {
  digitalWrite(PIN_US_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_US_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_US_TRIG, LOW);

  // Measure echo pulse with 25ms timeout (~400cm max range)
  long duration = pulseIn(PIN_US_ECHO, HIGH, 25000);
  if (duration == 0) {
    return 400.0; // Max out-of-range or timeout
  }
  // Speed of sound: 343 m/s = 0.0343 cm/µs. Round-trip divided by 2.
  float dist = (duration * 0.0343) / 2.0;
  if (dist < 2.0) dist = 2.0;
  if (dist > 400.0) dist = 400.0;
  return dist;
}

// -----------------------------------------------------------------------------
// HELPER: Relay Controller
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
// HELPER: Save Cumulative Energy to Non-Volatile Flash
// -----------------------------------------------------------------------------
void saveEnergyToFlash() {
  preferences.begin("energymeter", false);
  preferences.putDouble("kwh", cumulative_kwh);
  preferences.putFloat("load1", load1_watts);
  preferences.putFloat("load2", load2_watts);
  preferences.putFloat("voltage", grid_voltage);
  preferences.putFloat("tariff", tariff_rate);
  preferences.putBool("auto_mode", auto_mode);
  preferences.putInt("delay_sec", auto_off_delay_sec);
  preferences.end();
}

void loadEnergyFromFlash() {
  preferences.begin("energymeter", true);
  cumulative_kwh = preferences.getDouble("kwh", 0.0);
  load1_watts = preferences.getFloat("load1", 60.0);
  load2_watts = preferences.getFloat("load2", 1200.0);
  grid_voltage = preferences.getFloat("voltage", 230.0);
  tariff_rate = preferences.getFloat("tariff", 8.0);
  auto_mode = preferences.getBool("auto_mode", true);
  auto_off_delay_sec = preferences.getInt("delay_sec", 180);
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

// -----------------------------------------------------------------------------
// REST API HANDLERS
// -----------------------------------------------------------------------------
void handleOptions() {
  sendCORS();
  server.send(204);
}

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
  json += "\"ir_detected\":" + String(ir_detected ? "true" : "false") + ",";
  json += "\"pir_motion\":" + String(pir_motion ? "true" : "false") + ",";
  json += "\"distance_cm\":" + String(distance_cm, 1) + ",";
  json += "\"relay1\":" + String(relay1_on ? "true" : "false") + ",";
  json += "\"relay2\":" + String(relay2_on ? "true" : "false") + ",";
  json += "\"auto_mode\":" + String(auto_mode ? "true" : "false") + ",";
  json += "\"power_watts\":" + String(current_power_watts, 1) + ",";
  json += "\"voltage\":" + String(grid_voltage, 1) + ",";
  json += "\"current_amps\":" + String(current_amps, 2) + ",";
  json += "\"total_kwh\":" + String(cumulative_kwh, 5) + ",";
  json += "\"cost_estimate\":" + String(cumulative_kwh * tariff_rate, 2) + ",";
  json += "\"tariff_rate\":" + String(tariff_rate, 2) + ",";
  json += "\"load1_watts\":" + String(load1_watts, 1) + ",";
  json += "\"load2_watts\":" + String(load2_watts, 1) + ",";
  json += "\"auto_off_delay_sec\":" + String(auto_off_delay_sec) + ",";
  json += "\"idle_sec\":" + String(idle_time_sec) + ",";
  json += "\"auto_cutoff_countdown_sec\":" + String(countdown_sec);
  json += "}";

  server.send(200, "application/json", json);
}

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

  // Also support JSON body if plain body received
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
    server.send(200, "application/json", "{\"success\":true,\"relay\":" + String(relayId) + ",\"state\":" + String(state ? "true" : "false") + "}");
  } else {
    server.send(400, "application/json", "{\"error\":\"Invalid relay id. Use 1 or 2.\"}");
  }
}

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
    auto_mode = !auto_mode; // Toggle if no arg given
  }
  saveEnergyToFlash();
  server.send(200, "application/json", "{\"success\":true,\"auto_mode\":" + String(auto_mode ? "true" : "false") + "}");
}

void handlePostConfig() {
  sendCORS();
  if (server.hasArg("load1")) load1_watts = server.arg("load1").toFloat();
  if (server.hasArg("load2")) load2_watts = server.arg("load2").toFloat();
  if (server.hasArg("voltage")) grid_voltage = server.arg("voltage").toFloat();
  if (server.hasArg("tariff")) tariff_rate = server.arg("tariff").toFloat();
  if (server.hasArg("delay")) auto_off_delay_sec = server.arg("delay").toInt();

  // Also support JSON body
  if (server.hasArg("plain")) {
    String b = server.arg("plain");
    int i;
    if ((i = b.indexOf("\"load1\":")) != -1) load1_watts = b.substring(i + 8).toFloat();
    if ((i = b.indexOf("\"load2\":")) != -1) load2_watts = b.substring(i + 8).toFloat();
    if ((i = b.indexOf("\"voltage\":")) != -1) grid_voltage = b.substring(i + 10).toFloat();
    if ((i = b.indexOf("\"tariff\":")) != -1) tariff_rate = b.substring(i + 9).toFloat();
    if ((i = b.indexOf("\"delay\":")) != -1) auto_off_delay_sec = b.substring(i + 8).toInt();
  }

  saveEnergyToFlash();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Configuration saved\"}");
}

void handleResetEnergy() {
  sendCORS();
  cumulative_kwh = 0.0;
  saveEnergyToFlash();
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Energy meter reset to 0 kWh\"}");
}

// -----------------------------------------------------------------------------
// BUILT-IN WEB DASHBOARD (Instant browser test fallback at http://<ESP32-IP>/)
// -----------------------------------------------------------------------------
void handleRootWeb() {
  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<title>ESP32 Smart Energy Meter</title>";
  html += "<style>";
  html += "body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0d1117;color:#c9d1d9;margin:0;padding:20px;display:flex;justify-content:center;}";
  html += ".box{max-width:480px;width:100%;background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;box-shadow:0 8px 24px rgba(0,0,0,0.5);}";
  html += "h1{font-size:20px;color:#58a6ff;margin-top:0;display:flex;align-items:center;gap:8px;}";
  html += ".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}";
  html += ".card{background:#21262d;border:1px solid #30363d;border-radius:8px;padding:12px;}";
  html += ".card h3{margin:0 0 4px 0;font-size:12px;text-transform:uppercase;color:#8b949e;}";
  html += ".card .val{font-size:20px;font-weight:bold;color:#f0f6fc;}";
  html += ".btn{background:#238636;color:#fff;border:none;padding:10px 14px;border-radius:6px;cursor:pointer;font-weight:bold;width:100%;margin-top:8px;}";
  html += ".btn.off{background:#da3633;}";
  html += ".badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:bold;}";
  html += ".badge.on{background:#238636;color:#fff;} .badge.off{background:#30363d;color:#8b949e;}";
  html += "</style></head><body><div class='box'>";
  html += "<h1>⚡ Smart Energy Meter</h1>";
  html += "<p style='font-size:12px;color:#8b949e'>ESP32 Hardware & React Native Bridge</p>";

  html += "<div class='grid'>";
  html += "<div class='card'><h3>Power (W)</h3><div class='val' id='pwr'>" + String(current_power_watts, 1) + " W</div></div>";
  html += "<div class='card'><h3>Total Energy</h3><div class='val' id='kwh'>" + String(cumulative_kwh, 4) + " kWh</div></div>";
  html += "<div class='card'><h3>PIR Motion</h3><div class='val'><span class='badge " + String(pir_motion ? "on" : "off") + "'>" + String(pir_motion ? "DETECTED" : "CLEAR") + "</span></div></div>";
  html += "<div class='card'><h3>IR Obstacle</h3><div class='val'><span class='badge " + String(ir_detected ? "on" : "off") + "'>" + String(ir_detected ? "DETECTED" : "CLEAR") + "</span></div></div>";
  html += "<div class='card'><h3>Distance</h3><div class='val'>" + String(distance_cm, 1) + " cm</div></div>";
  html += "<div class='card'><h3>Auto Mode</h3><div class='val'><span class='badge " + String(auto_mode ? "on" : "off") + "'>" + String(auto_mode ? "ENABLED" : "DISABLED") + "</span></div></div>";
  html += "</div>";

  html += "<h3>Relay Controls</h3>";
  html += "<div class='card' style='margin-bottom:10px;'>";
  html += "<strong>Relay 1 (" + String(load1_watts, 0) + "W Load)</strong>";
  html += "<button class='btn " + String(relay1_on ? "off" : "") + "' onclick=\"fetch('/api/relay?id=1&state=" + String(relay1_on ? "0" : "1") + "',{method:'POST'}).then(()=>location.reload())\">" + String(relay1_on ? "Turn OFF" : "Turn ON") + "</button>";
  html += "</div>";

  html += "<div class='card'>";
  html += "<strong>Relay 2 (" + String(load2_watts, 0) + "W Load)</strong>";
  html += "<button class='btn " + String(relay2_on ? "off" : "") + "' onclick=\"fetch('/api/relay?id=2&state=" + String(relay2_on ? "0" : "1") + "',{method:'POST'}).then(()=>location.reload())\">" + String(relay2_on ? "Turn OFF" : "Turn ON") + "</button>";
  html += "</div>";

  html += "<p style='font-size:11px;color:#8b949e;margin-top:16px;'>Use the React Native mobile app for full telemetry and remote control.</p>";
  html += "</div><script>setTimeout(()=>location.reload(),4000);</script></body></html>";

  server.send(200, "text/html", html);
}

// -----------------------------------------------------------------------------
// SETUP
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("  ⚡ ESP32 SMART ENERGY METER & ROOM AUTOMATION ⚡");
  Serial.println("=======================================================");

  // Pin Modes
  pinMode(PIN_IR_DO, INPUT);
  pinMode(PIN_PIR_OUT, INPUT);
  pinMode(PIN_US_TRIG, OUTPUT);
  pinMode(PIN_US_ECHO, INPUT);
  pinMode(PIN_RELAY_1, OUTPUT);
  pinMode(PIN_RELAY_2, OUTPUT);

  // Initialize Relays to OFF
  digitalWrite(PIN_RELAY_1, RELAY_STATE_OFF);
  digitalWrite(PIN_RELAY_2, RELAY_STATE_OFF);

  // Load persistent energy and settings from flash memory
  loadEnergyFromFlash();
  Serial.printf("Loaded saved energy: %.4f kWh\n", cumulative_kwh);

  // Connect to WiFi using WiFiManager
  Serial.println("Initializing WiFiManager...");
  WiFiManager wm;
  
  // wm.resetSettings(); // Un-comment to reset saved WiFi credentials for testing
  
  // Start the captive portal AP with a custom name and password
  bool res = wm.autoConnect("EnergyMeter-Setup", "12345678"); 

  if(!res) {
    Serial.println("\n❌ Failed to connect or hit timeout");
    // ESP.restart();
  } else {
    Serial.println("\n✅ WiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  }

  // Setup mDNS (http://energymeter.local)
  if (MDNS.begin("energymeter")) {
    Serial.println("mDNS responder started at http://energymeter.local");
  }

  // Register WebServer Routes
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
  Serial.println("HTTP Server started. Ready for React Native app requests!");

  last_motion_timestamp = millis();
  last_energy_calc_ms = millis();
}

// -----------------------------------------------------------------------------
// MAIN LOOP
// -----------------------------------------------------------------------------
void loop() {
  server.handleClient();
  unsigned long now = millis();

  // 1. Read Sensors every 250ms
  if (now - last_sensor_read_ms >= 250) {
    last_sensor_read_ms = now;

    // IR DO: typically active LOW when obstacle/hand is near
    ir_detected = (digitalRead(PIN_IR_DO) == LOW);

    // PIR OUT: active HIGH when motion is detected
    pir_motion = (digitalRead(PIN_PIR_OUT) == HIGH);

    // Ultrasonic HC-SR04 distance measurement
    distance_cm = measureDistanceCm();

    // Check motion / occupancy presence
    bool presence_detected = pir_motion || ir_detected || (distance_cm > 2.0 && distance_cm < occupancy_dist_threshold_cm);
    if (presence_detected) {
      last_motion_timestamp = now;
    }

    // Smart Energy Saving Auto-cut-off:
    // If auto_mode is enabled, and no motion detected for auto_off_delay_sec, shut off relays!
    if (auto_mode && (relay1_on || relay2_on)) {
      unsigned long idle_sec = (now - last_motion_timestamp) / 1000;
      if (idle_sec >= (unsigned long)auto_off_delay_sec) {
        Serial.printf("[AUTO ECO MODE] No occupancy for %lu seconds. Shutting off relays to save energy!\n", idle_sec);
        setRelay(1, false);
        setRelay(2, false);
      }
    }
  }

  // 2. Real-time Power & Cumulative Energy calculation every 1000ms
  if (now - last_energy_calc_ms >= 1000) {
    unsigned long delta_ms = now - last_energy_calc_ms;
    last_energy_calc_ms = now;

    // Current active power in Watts
    current_power_watts = 0.0;
    if (relay1_on) current_power_watts += load1_watts;
    if (relay2_on) current_power_watts += load2_watts;

    // Current in Amperes = Power / Voltage
    current_amps = (grid_voltage > 0) ? (current_power_watts / grid_voltage) : 0.0;

    // Energy (kWh) = (Power in Watts * time in hours) / 1000
    double delta_hours = (double)delta_ms / 3600000.0;
    double delta_kwh = (current_power_watts * delta_hours) / 1000.0;
    cumulative_kwh += delta_kwh;
  }

  // 3. Save accumulated energy to flash periodically (every 5 minutes)
  if (now - last_flash_save_ms >= 300000) {
    last_flash_save_ms = now;
    saveEnergyToFlash();
    Serial.printf("[Flash] Auto-saved cumulative energy: %.5f kWh\n", cumulative_kwh);
  }
}
