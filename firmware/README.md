# ESP32 Smart Energy Management System (5V DC Prototype)

Comprehensive documentation for the ESP32-based Smart Energy Management System. Controls two 5V DC bulb loads via a dual-channel 5V relay module with multi-sensor occupancy automation (PIR, IR, HC-SR04 ultrasonic) and combined load power/energy monitoring using an ACS712 current sensor.

---

## ⚠️ CSafety & Electrical Constraints

1. **5V DC PROTOTYPE ONLY**: This prototype is engineered exclusively for **5V DC loads (5V DC bulbs)**. **DO NOT connect 230V AC mains** to this setup.
2. **ESP32 3.3V GPIO LIMITATION**: ESP32 input pins are **not 5V tolerant**. The HC-SR04 ECHO pin produces a 5V signal and **MUST** pass through a voltage divider (1kΩ / 2kΩ) to safely step down to ~3.3V before entering GPIO 18.
3. **ACTIVE-LOW RELAY LOGIC**: The dual 5V relay module triggers ON when the input pin is driven **LOW** (0V) and OFF when driven **HIGH** (3.3V/5V). The firmware enforces a safe boot sequence initializing all relays to OFF (`HIGH`).
4. **SERIES CURRENT MONITORING**: The single ACS712 module measures the **combined total current** flowing into both 5V DC bulb loads through its series sensing path. It does **not** measure Load 1 and Load 2 independently.

---

## 📌 Hardware Pin Mapping

| Component | Pin | ESP32 Pin | Logic / Function |
| :--- | :--- | :--- | :--- |
| **IR Sensor** | VCC | `3V3` or `5V` | Power supply |
| | GND | `GND` | Common Ground |
| | DO | `GPIO 26` | Digital IN (Active-LOW: `LOW` = obstacle/reflection detected) |
| **PIR Motion Sensor** | VCC | `5V / VIN` | Power supply |
| | GND | `GND` | Common Ground |
| | OUT | `GPIO 27` | Digital IN (Active-HIGH: `HIGH` = motion detected) |
| **HC-SR04 Ultrasonic** | VCC | `5V / VIN` | Power supply |
| | GND | `GND` | Common Ground |
| | TRIG | `GPIO 5` | Digital OUT (10µs trigger pulse) |
| | ECHO | `GPIO 18` | Digital IN (Through 1kΩ / 2kΩ voltage divider) |
| **Dual 5V Relay Module** | VCC | `5V / VIN` | Power supply for relay coils |
| | GND | `GND` | Common Ground |
| | IN1 | `GPIO 25` | Digital OUT (Active-LOW: Controls Load 1 - 5V DC Bulb) |
| | IN2 | `GPIO 33` | Digital OUT (Active-LOW: Controls Load 2 - 5V DC Bulb) |
| **ACS712 Current Sensor**| VCC | `5V / VIN` | 5V Power (ACS712 requires 5V for accurate 2.5V zero point) |
| | GND | `GND` | Common Ground |
| | OUT | `GPIO 34` | Analog IN (ADC1 CH6 - WiFi Safe on ESP32) |
| | IP+ / IP- | In Series | Connected in series with 5V (+) DC power line to bulb relays |
| **Common DC Rail** | +5V / GND | Multi-meter / GPIO 35 | Nominal 5.0V DC bus feeding both bulbs |

---

## 🔌 5V DC Circuit Schematic & Wiring

```
                       5V DC POWER SUPPLY (2A - 3A)
                       ┌──────────────────────────┐
                       │  +5V DC           GND    │
                       └───┬────────────────┬─────┘
                           │                │
                           ▼                │ (Common Ground)
                 ┌───────────────────┐      │
                 │   ACS712 (GPIO 34)│      │
                 │   [ Terminal 1 ]  │      │
                 │   [ Terminal 2 ]  │      │
                 └─────────┬─────────┘      │
                           │                │
            Combined 5V    ▼                │
            Power Bus  ────┬───────────────┐│
                           │               ││
                           ▼               ▼│
                  ┌────────────────┐ ┌────────────────┐
                  │ Relay 1 (CH 1) │ │ Relay 2 (CH 2) │
                  │ COM (Pin 25)   │ │ COM (Pin 33)   │
                  │ NO             │ │ NO             │
                  └────────┬───────┘ └────────┬───────┘
                           │                  │
                           ▼                  ▼
                    ┌─────────────┐    ┌─────────────┐
                    │ Load 1      │    │ Load 2      │
                    │ (5V Bulb)   │    │ (5V Bulb)   │
                    └──────┬──────┘    └──────┬──────┘
                           │                  │
                           └────────┬─────────┘
                                    │
                                    ▼
                         Return to Supply GND ◄─── Common Ground Bus
```

### HC-SR04 Echo 5V-to-3.3V Divider:
```
HC-SR04 ECHO (5V) ────[ 1 kΩ ]────┬────→ ESP32 GPIO 18
                                  │
                               [ 2 kΩ ]
                                  │
                                 GND
```

---

## 🚀 Step-by-Step Flashing & Setup Guide

### 1. Arduino IDE Setup
1. Download and install [Arduino IDE](https://www.arduino.cc/).
2. In **Preferences**, add the ESP32 board manager URL:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Go to **Tools > Board > Boards Manager**, search for `esp32` by Espressif, and install it.
4. Go to **Sketch > Include Library > Manage Libraries...** and install:
   - `WiFiManager` by tzapu (v2.0.16-rc.2 or newer)

### 2. Flash Firmware
1. Open `firmware/SmartEnergyMeter/SmartEnergyMeter.ino` in Arduino IDE.
2. Select your board under **Tools > Board** (e.g. `DOIT ESP32 DEVKIT V1` or `ESP32 Dev Module`).
3. Select your port under **Tools > Port**.
4. Set **Upload Speed** to `921600` (or `115200`).
5. Click **Upload (➡️)**.
6. Open **Tools > Serial Monitor** at `115200 baud`.

### 3. Connect to Wi-Fi
- If no previous Wi-Fi network is saved, ESP32 broadcasts a captive portal:
  - **SSID**: `EnergyMeter-Setup`
  - **Password**: `12345678`
- Connect your phone or laptop to `EnergyMeter-Setup`, select your Wi-Fi network, and enter its password.
- The Serial Monitor will print your ESP32's local IP address (e.g. `192.168.1.105`).

### 4. Run the Mobile App (Expo SDK 57)
1. Open your terminal in the project root:
   ```bash
   cd d:\12345\EnergyMeter
   npm install
   npx expo start
   ```
2. Scan the QR code using Expo Go on your mobile device (or press `w` to open in browser).
3. Enter the ESP32 IP address in the top connection bar.

---

## 📋 Hardware Verification Checklist

Perform these hardware checks before running the full system:

- [ ] **Power Supply Isolation**: Verify that the power source is strictly 5V DC (DO NOT connect AC mains!).
- [ ] **Common Ground**: Ensure ESP32 GND, Relay module GND, Sensor GNDs, and 5V Power Supply GND are all tied together.
- [ ] **HC-SR04 Echo Divider**: Use a multimeter to verify voltage on GPIO 18 never exceeds 3.3V when the ultrasonic sensor is triggered.
- [ ] **PIR Sensor Potentiometers**: Adjust the PIR time delay trimmer to minimum (fully counter-clockwise) so the PIR output goes LOW promptly when motion stops. Adjust sensitivity as needed.
- [ ] **IR Sensor Potentiometer**: Turn the small blue trimmer on the IR sensor until the onboard indicator LED turns ON only when an obstacle is within 3–15 cm.
- [ ] **Relay Indicator LEDs**: Confirm that when GPIO 25 is driven LOW, Relay 1 clicks and its channel LED illuminates. Confirm the same for GPIO 33 and Relay 2.
- [ ] **5V DC Bulbs**: Verify each bulb lights up brightly when its respective relay engages.
- [ ] **ACS712 Output**: With no loads turned on, check that the ACS712 OUT pin reads ~2.5V (quiescent midpoint). When bulbs turn ON, the voltage will deviate proportionately to the DC current drawn.

---

## 🧪 System Testing Procedures

### A. Manual Mode Testing
1. In the mobile app, toggle mode to **Manual Mode** (or confirm mode pill shows "MANUAL MODE").
2. **Test Load 1**: Tap the switch for Relay 1.
   - Expected: Loading indicator appears briefly, Relay 1 clicks ON, 5V Bulb 1 illuminates, and the card updates to "POWER ON".
3. **Test Load 2**: Tap the switch for Relay 2.
   - Expected: Relay 2 clicks ON, 5V Bulb 2 illuminates, card shows "POWER ON".
4. **Test Quick Actions**:
   - Tap "Turn Both OFF" -> Both bulbs turn off simultaneously.
   - Tap "Turn Both ON" -> Both bulbs turn on simultaneously.
5. **Verify Sensor Override Lock**: Wave your hand in front of the PIR/IR sensors or stand near the HC-SR04 sensor.
   - Expected: Telemetry updates in the app (PIR Motion = MOTION, IR = OBSTACLE), but **the relays DO NOT change state**. Manual control remains locked.

### B. Automatic Mode Testing
1. Toggle mode to **Automatic Mode** in the app.
2. Select target loads: Choose **Both Loads (1 & 2)**.
3. **Occupancy Detection**:
   - Move in front of the PIR sensor or trigger the IR obstacle beam.
   - Expected: Within 250ms, the ESP32 triggers both relays ON, bulbs light up, and the app displays:
     `Last Action: Auto: Presence detected (PIR IR) -> Both Loads ON`.
4. **Anti-Chatter / Debounce Test**:
   - Rapidly wave your hand in and out of the sensor field.
   - Expected: The minimum 3000ms debounce interval prevents relays from chattering or clicking repeatedly.
5. **No-Occupancy Timeout Test**:
   - In Settings (Explore tab), set the timeout to a short testing value (e.g. 10–30 seconds for quick testing, or leave at default 300s = 5 minutes).
   - Step away from the sensors so no motion or proximity is detected.
   - Expected: The app counts down: "Auto-Off Countdown: X s". Once the timeout expires, the ESP32 automatically turns the bulbs OFF, displaying:
     `Last Action: Auto: Vacancy timeout reached -> Both Loads OFF`.

### C. Current, Voltage & Energy Monitoring Testing
1. Turn ON both 5V bulbs.
2. Check the Power Overview card:
   - **Common DC Rail**: Displays ~5.00 V.
   - **Combined Current**: Displays the measured DC current drawn by both bulbs (e.g. ~0.40 A to ~1.00 A depending on bulb wattage).
   - **Power (DC)**: Automatically calculated as $P = V \times I$ (Watts).
   - **Accumulated Energy**: Energy counter integrates power over time, displaying in **Wh** and **kWh**.
3. Turn OFF Load 2:
   - Notice the combined current decreases by Load 2's share, and active power drops accordingly.

### D. Network Disconnection & Recovery Testing
1. Turn off your Wi-Fi router or disconnect the mobile device from Wi-Fi.
   - Expected: The mobile app displays a clean reconnecting/offline warning without crashing.
   - Crucially: **The ESP32 continues running its Automatic Mode occupancy evaluation autonomously** without needing active app connectivity.
2. Re-enable Wi-Fi.
   - Expected: The app reconnects automatically within 2 seconds and syncs the actual relay states and energy totals.

---

## 🌐 REST API Endpoints

All endpoints support CORS for browser and React Native clients.

| Method | Endpoint | Parameters / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | None | Returns complete live telemetry JSON (relays, sensors, Wh, kWh, current, voltage, last action reason) |
| `POST` | `/api/relay` | `?id=1&state=1` or `{"id":1,"state":true}` | Manually control Relay 1 or 2 |
| `POST` | `/api/auto-mode` | `?state=1&target=3` or `{"state":true,"target":3}` | Toggle Automatic Mode & target load (1, 2, or 3) |
| `POST` | `/api/config` | `?voltage=5.0&tariff=8.0&delay=300&target=3` | Configure DC voltage, tariff rate, timeout, and calibration |
| `POST` | `/api/reset-energy`| None | Resets accumulated Wh and kWh counters to 0.0 |
