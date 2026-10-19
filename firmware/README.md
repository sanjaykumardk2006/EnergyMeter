# ESP32 Smart Energy Meter Firmware Guide

This firmware turns your ESP32 into a Smart Energy Meter & Room Automation Controller. It measures sensor telemetry (IR, PIR, Ultrasonic HC-SR04), controls 2 relay channels (for lights, appliances, AC), computes real-time power (W) and cumulative energy consumption (kWh), and exposes a REST API with CORS enabled for your React Native mobile app.

---

## 📌 Hardware Pin Mapping

| Component | Pin | ESP32 Pin | Purpose |
| :--- | :--- | :--- | :--- |
| **ZMPT101B Voltage Sensor** | VCC | `VIN / 5V` | 5V Power supply |
| | GND | `GND` | Common Ground |
| | OUT | `GPIO 35` | Analog Input (ADC1 CH7 - WiFi safe) |
| **ACS712 Current Sensor** | VCC | `VIN / 5V` | 5V Power supply |
| | GND | `GND` | Common Ground |
| | OUT | `GPIO 34` | Analog Input (ADC1 CH6 - WiFi safe) |
| **IR Sensor** | VCC | `3V3` | 3.3V Power |
| | GND | `GND` | Common Ground |
| | DO | `GPIO 26` | Digital In (LOW when obstacle detected) |
| | AO | *NC* | Not connected |
| **PIR Sensor** | VCC | `VIN / 5V` | 5V Power (from USB supply) |
| | GND | `GND` | Common Ground |
| | OUT | `GPIO 27` | Digital In (HIGH when human motion detected) |
| **HC-SR04 Ultrasonic** | VCC | `VIN / 5V` | 5V Power |
| | GND | `GND` | Common Ground |
| | TRIG | `GPIO 5` | Digital Out (10µs trigger pulse) |
| | ECHO | `GPIO 18` | Through 1kΩ + 2kΩ Resistor Voltage Divider |
| **Relay 1 (Load 1)** | IN1 | `GPIO 25` | Active-LOW Trigger (Bulb, Fan, etc.) |
| **Relay 2 (Load 2)** | IN2 | `GPIO 33` | Active-LOW Trigger (AC, Heater, Socket, etc.) |

---

## ⚡ AC Mains Wiring Schematic (ZMPT101B & ACS712)

> ⚠️ **HIGH VOLTAGE WARNING (230V AC)**: Mains voltage can be lethal. Turn off the main circuit breaker before touching any AC wiring. Ensure all AC connections are properly insulated with heat shrink or terminal blocks.

```
                  ┌───────────────────────────────────────────────┐
                  │                 AC MAINS (230V)               │
                  │   Phase (L)                       Neutral (N) │
                  └──────┬─────────────────────────────────┬──────┘
                         │                                 │
                         │                                 │
    ┌────────────────────┼────────────────┐                │
    │   ZMPT101B Module  │                │                │
    │   [ AC Terminal 1 ]│                │                │
    │   [ AC Terminal 2 ]├────────────────┼────────────────┘
    │                    │                │
    │   VCC ──> 5V       │                │
    │   GND ──> GND      │                │
    │   OUT ──> GPIO 35  │                │
    └────────────────────┘                │
                                          │
                         │                │
                         ▼ (Phase In)     │
    ┌─────────────────────────────────┐   │
    │   ACS712 Current Sensor         │   │
    │   [ Terminal 1 ] (Phase IN)     │   │
    │   [ Terminal 2 ] (Phase OUT) ───┼───┼──────────┐
    │                                 │   │          │
    │   VCC ──> 5V                    │   │          │
    │   GND ──> GND                   │   │          │
    │   OUT ──> GPIO 34               │   │          │
    └─────────────────────────────────┘   │          │
                                          │          │
                                          │          ▼
                                          │     ┌──────────┐
                                          │     │ Relay /  │
                                          │     │ Appliance│
                                          └─────┤ Load     │
                                                └──────────┘
```

### 1. ZMPT101B Voltage Connection:
- Connect the two AC screw terminals of the ZMPT101B module in **parallel** across AC Phase (Live) and Neutral.
- Connect VCC to 5V, GND to ESP32 GND, and OUT to ESP32 **GPIO 35**.

### 2. ACS712 Current Connection:
- Connect the ACS712 screw terminal in **series** with the Phase (Live) line running to your relay and appliance load.
- Connect VCC to 5V, GND to ESP32 GND, and OUT to ESP32 **GPIO 34**.

### 3. ZMPT101B Potentiometer Calibration:
- Power up the ESP32 and plug in the 230V AC mains.
- Open the built-in web page (`http://<ESP32-IP>/`) or the mobile app.
- Turn the small blue multi-turn trimmer screw on the ZMPT101B board with a screwdriver until the voltage readout matches your multimeter (e.g. ~230V).

---

## ⚡ Ultrasonic Echo Voltage Divider Setup

HC-SR04 Echo pin outputs 5V logic. ESP32 GPIOs tolerate max 3.3V. Use 1 kΩ and 2 kΩ resistors as follows:

```
                  1 kΩ
HC-SR04 ECHO ────/\/\/\/────┬────→ ESP32 GPIO 18
                            │
                           2 kΩ
                            │
                           GND
```

---

## 🚀 How to Flash into ESP32 using Arduino IDE

1. **Install Arduino IDE** (if not already installed from [arduino.cc](https://www.arduino.cc/)).
2. **Install ESP32 Board Package**:
   - Open **File > Preferences**.
   - In "Additional Boards Manager URLs", add:
     `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Open **Tools > Board > Boards Manager**, search for `esp32` by Espressif, and click **Install**.
3. **Open the Sketch**:
   - Open `firmware/SmartEnergyMeter/SmartEnergyMeter.ino` in Arduino IDE.
4. **Configure WiFi**:
   - Update `WIFI_SSID` and `WIFI_PASSWORD` on lines 32-33 to your home/mobile hotspot WiFi.
   - *Note*: If the ESP32 cannot connect to your WiFi, it will automatically broadcast its own hotspot:
     - SSID: `EnergyMeter-AP`
     - Password: `12345678`
     - IP: `192.168.4.1`
5. **Select Board & Port**:
   - **Tools > Board**: Select `DOIT ESP32 DEVKIT V1` (or your ESP32 model).
   - **Tools > Port**: Select the COM port of your connected ESP32.
   - **Tools > Upload Speed**: `921600` or `115200`.
6. **Upload**:
   - Click the **Upload (➡️)** button. (If the upload halts at `Connecting......._____`, press and hold the **BOOT** button on the ESP32 until the upload starts).
7. **Verify in Serial Monitor**:
   - Open **Tools > Serial Monitor** and set baud rate to `115200`.
   - The ESP32 will print its assigned IP address (e.g. `192.168.1.145`).
   - Enter that IP address into the mobile app to connect!

---

## 🌐 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Returns complete live JSON status (sensors, power, relays, kwh) |
| `POST` | `/api/relay?id=1&state=1` | Turn Relay 1 ON (`state=0` for OFF) |
| `POST` | `/api/relay?id=2&state=1` | Turn Relay 2 ON (`state=0` for OFF) |
| `POST` | `/api/auto-mode?state=1` | Enable/disable auto energy-saving occupancy cut-off |
| `POST` | `/api/config` | Update parameters (`load1`, `load2`, `voltage`, `tariff`, `delay`) |
| `POST` | `/api/reset-energy` | Resets cumulative kWh counter to 0 |
