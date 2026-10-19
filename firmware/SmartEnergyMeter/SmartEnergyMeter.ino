/*
  =============================================================================
  Smart Energy Meter & Room Automation Controller
  ESP32 Firmware with Dual Relays, IR, PIR, Ultrasonic & ACS712 Current Sensor
  =============================================================================
  Hardware Pin Map:
  - IR Sensor DO        -> GPIO 26 (Digital IN: LOW when obstacle detected)
  - PIR Sensor OUT      -> GPIO 27 (Digital IN: HIGH when motion detected)
  - HC-SR04 TRIG        -> GPIO 5  (Digital OUT: 10µs pulse)
  - HC-SR04 ECHO        -> GPIO 18 (Digital IN via 1kΩ/2kΩ voltage divider)
  - Relay 1 (Load 1)    -> GPIO 25 (Digital OUT: Active-LOW trigger)
  - Relay 2 (Load 2)    -> GPIO 33 (Digital OUT: Active-LOW trigger)
  - ACS712 Current OUT  -> GPIO 34 (Analog IN: ADC1 CH6 - WiFi Safe)
  *(Voltage Sensor ZMPT101B is temporarily disabled - Nominal 230V is used)*

  Features:
  - Live Current (A) from ACS712 Hardware Sensor with noise filtering
  - Real-time Active Power (Watts) & Cumulative kWh tracking with Flash storage
  - Smart Presence Auto-ON & Auto-OFF (30s Vacancy Delay)
  - Full REST API with CORS enabled for React Native mobile app & Web integration
  - Built-in Web Dashboard for immediate browser testing
  - WiFi Station + SoftAP fallback via WiFiManager
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

// Hardware Current Sensor (ADC1 only - WiFi safe on ESP32)
#define PIN_ACS712    34  // ACS712 Current Sensor Analog OUT (ADC1_CH6)

// Most standard 5V/3.3V relay boards are ACTIVE-LOW (LOW = ON, HIGH = OFF)
const bool RELAY_ACTIVE_LOW = true;
#define RELAY_STATE_ON  (RELAY_ACTIVE_LOW ? LOW : HIGH)
#define RELAY_STATE_OFF (RELAY_ACTIVE_LOW ? HIGH : LOW)

// -----------------------------------------------------------------------------
// GLOBAL STATE & SETTINGS
// -----------------------------------------------------------------------------
WebServer server(80);
Preferences preferences;

// ACS712 Current Sensor Configuration
// 5A module  = 0.185 V/A (185 mV/A)
// 20A module = 0.100 V/A (100 mV/A)
// 30A module = 0.066 V/A (66 mV/A)
float acs_sensitivity = 0.100;     // Default: 20A module (0.100 V/A)
float acs_calib_factor = 1.0;      // Current multiplier calibration factor

// Live Hardware Telemetry
float measured_current = 0.0;      // Live AC Current (A) from ACS712
bool hardware_current_active = false; // True when load is detected through ACS712

// Appliance power ratings (in Watts) - user configurable via app/API
float load1_watts = 60.0;     // Default Load 1: 60W (e.g. bulb / fan)
float load2_watts = 1200.0;   // Default Load 2: 1200W (e.g. AC / heater / kettle)
float grid_voltage = 230.0;   // Nominal Mains voltage (230V AC - used for Power calculation)
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
int auto_off_delay_sec = 30; // Turn off relays after 30 seconds of no motion
float occupancy_dist_threshold_cm = 120.0; // Distance threshold for ultrasonic

// Timing loops
unsigned long last_energy_calc_ms = 0;
unsigned long last_flash_save_ms = 0;
unsigned long last_sensor_read_ms = 0;

// Sample buffer for 100ms AC current waveform measurement
static int16_t sample_i[600];

// -----------------------------------------------------------------------------
// HELPER: Measure AC Current from ACS712 Hardware Sensor
// -----------------------------------------------------------------------------
void readHardwareCurrentSensor() {
  const int NUM_SAMPLES = 600;
  long sum_i = 0;

  // 1. Synchronized high-speed sampling of ACS712 over ~100ms (5 full AC cycles @ 50Hz)
  for (int j = 0; j < NUM_SAMPLES; j++) {
    unsigned long sample_start = micros();
    int i = analogRead(PIN_ACS712);
    sample_i[j] = i;
    sum_i += i;

    // Pace sampling to ~166µs per sample (600 samples * 166µs ≈ 100ms)
    while (micros() - sample_start < 166) {
      // Wait for next sample window
    }
  }

  // 2. Compute dynamic DC midpoint (cancels quiescent ~2.5V bias and thermal drift)
  float mid_i = (float)sum_i / (float)NUM_SAMPLES;

  // 3. Compute RMS Current
  double sum_sq_i = 0.0;
  for (int j = 0; j < NUM_SAMPLES; j++) {
    // Convert raw ADC difference to volts (ESP32 ADC: 3.3V / 4095.0 = 0.00080586 V/count)
    float diff_i = ((float)sample_i[j] - mid_i) * (3.3f / 4095.0f);
    sum_sq_i += (diff_i * diff_i);
  }

  // 4. Calculate RMS Current
  float raw_i_rms = sqrt(sum_sq_i / (float)NUM_SAMPLES);
  float i_rms = (raw_i_rms / acs_sensitivity) * acs_calib_factor;

  // Noise gate for current: ACS712 has ~50-80mA ADC noise floor on ESP32
  if (i_rms < 0.08f) {
    i_rms = 0.0f;
    hardware_current_active = false;
  } else {
    hardware_current_active = true;
  }

  measured_current = i_rms;
}

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
  preferences.putFloat("calib_i", acs_calib_factor);
  preferences.putFloat("acs_sens", acs_sensitivity);
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
  auto_off_delay_sec = preferences.getInt("delay_sec", 30);
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
  json += "\"auto_cutoff_countdown_sec\":" + String(countdown_sec) + ",";
  json += "\"hardware_sensors\":true,";
  json += "\"hardware_current_active\":" + String(hardware_current_active ? "true" : "false") + ",";
  json += "\"voltage_sensor_connected\":false,";
  json += "\"calib_i\":" + String(acs_calib_factor, 2) + ",";
  json += "\"acs_sens\":" + String(acs_sensitivity, 3);
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
  if (server.hasArg("calib_i")) acs_calib_factor = server.arg("calib_i").toFloat();
  if (server.hasArg("acs_sens")) acs_sensitivity = server.arg("acs_sens").toFloat();

  // Also support JSON body
  if (server.hasArg("plain")) {
    String b = server.arg("plain");
    int i;
    if ((i = b.indexOf("\"load1\":")) != -1) load1_watts = b.substring(i + 8).toFloat();
    if ((i = b.indexOf("\"load2\":")) != -1) load2_watts = b.substring(i + 8).toFloat();
    if ((i = b.indexOf("\"voltage\":")) != -1) grid_voltage = b.substring(i + 10).toFloat();
    if ((i = b.indexOf("\"tariff\":")) != -1) tariff_rate = b.substring(i + 9).toFloat();
    if ((i = b.indexOf("\"delay\":")) != -1) auto_off_delay_sec = b.substring(i + 8).toInt();
    if ((i = b.indexOf("\"calib_i\":")) != -1) acs_calib_factor = b.substring(i + 10).toFloat();
    if ((i = b.indexOf("\"acs_sens\":")) != -1) acs_sensitivity = b.substring(i + 11).toFloat();
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
  html += "<h1>⚡ Smart Energy Meter</h1>";
  html += "<div class='telemetry'>Hardware Sensor: ACS712 (GPIO 34) " + String(hardware_current_active ? "🟢 ACTIVE LOAD (" + String(current_amps, 2) + "A)" : "🟡 STANDBY") + " | Voltage: Nominal Grid (" + String(grid_voltage, 0) + "V)</div>";

  html += "<div class='grid'>";
  html += "<div class='card'><h3>Active Power</h3><div class='val' id='pwr'>" + String(current_power_watts, 1) + " W</div></div>";
  html += "<div class='card'><h3>Total Energy</h3><div class='val' id='kwh'>" + String(cumulative_kwh, 4) + " kWh</div></div>";
  html += "<div class='card'><h3>Grid Voltage</h3><div class='val' id='volt'>" + String(grid_voltage, 1) + " V</div></div>";
  html += "<div class='card'><h3>Live Current</h3><div class='val' id='curr'>" + String(current_amps, 2) + " A</div></div>";
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

  html += "<p style='font-size:11px;color:#8b949e;margin-top:16px;'>Connected to React Native mobile app for full telemetry and remote control.</p>";
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

  // ADC Configuration for Hardware ACS712 Current Sensor (ADC1 CH6 - Pin 34)
  pinMode(PIN_ACS712, INPUT);
  // Note: ZMPT101B Voltage sensor pin 35 is temporarily disabled until connected
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  // Load persistent energy and settings from flash memory
  loadEnergyFromFlash();
  Serial.printf("Loaded saved energy: %.4f kWh\n", cumulative_kwh);
  Serial.printf("ACS712 Sensor: Calib=%.2f, Sens=%.3f V/A | Grid Voltage=%.1f V\n", acs_calib_factor, acs_sensitivity, grid_voltage);

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
    Serial.print("PIR = ");
    Serial.print(pir_motion);

    Serial.print(" | IR = ");
    Serial.print(ir_detected);

    Serial.print(" | Distance = ");
    Serial.println(distance_cm);

    // Check presence using ALL THREE sensors
    bool presence_detected =
        pir_motion ||
        ir_detected ||
        (distance_cm > 2.0 &&
         distance_cm < occupancy_dist_threshold_cm);
         
    Serial.print("AUTO = ");
    Serial.print(auto_mode);
    Serial.print(" | PRESENCE = ");
    Serial.println(presence_detected);

    if (auto_mode) {
      // PERSON PRESENT: Any one sensor detects presence
      if (presence_detected) {
        last_motion_timestamp = now;

        // Turn BOTH relays ON
        setRelay(1, true);
        setRelay(2, true);

        Serial.println("[AUTO] Presence detected -> BOTH RELAYS ON");
      }
      // NO PERSON
      else {
        unsigned long idle_sec = (now - last_motion_timestamp) / 1000;

        // 30 seconds without presence
        if (idle_sec >= (unsigned long)auto_off_delay_sec) {
          // Turn BOTH relays OFF
          setRelay(1, false);
          setRelay(2, false);

          Serial.printf("[AUTO] No presence for %d seconds -> BOTH RELAYS OFF\n", auto_off_delay_sec);
        }
      }
    }
  }

  // 2. Real-time Hardware Energy Calculation every 1000ms
  if (now - last_energy_calc_ms >= 1000) {
    unsigned long delta_ms = now - last_energy_calc_ms;
    last_energy_calc_ms = now;

    // Read real AC current from ACS712 hardware sensor
    readHardwareCurrentSensor();

    if (hardware_current_active) {
      // Physical load is running through ACS712 current sensor
      current_amps = measured_current;
      // Active Power (Watts) = Current (A) * Nominal Grid Voltage (230V)
      current_power_watts = current_amps * grid_voltage;
    } else {
      // ACS712 reads no active current (< 0.08A)
      // If relays are turned on in bench test mode without high-voltage load on ACS712:
      float simulated_power = 0.0;
      if (relay1_on) simulated_power += load1_watts;
      if (relay2_on) simulated_power += load2_watts;

      if (simulated_power > 0.0 && grid_voltage > 0.0) {
        current_power_watts = simulated_power;
        current_amps = current_power_watts / grid_voltage;
      } else {
        current_power_watts = 0.0;
        current_amps = 0.0;
      }
    }

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
