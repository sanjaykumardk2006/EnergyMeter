export interface EnergyMeterStatus {
  device: string;
  uptime_sec: number;
  ip: string;
  wifi_rssi: number;
  ir_detected: boolean;
  pir_motion: boolean;
  distance_cm: number;
  relay1: boolean;
  relay2: boolean;
  auto_mode: boolean;
  power_watts: number;
  voltage: number;
  current_amps: number;
  total_kwh: number;
  cost_estimate: number;
  tariff_rate: number;
  load1_watts: number;
  load2_watts: number;
  auto_off_delay_sec: number;
  idle_sec: number;
  auto_cutoff_countdown_sec: number;
}

export interface EnergyMeterConfig {
  load1_watts: number;
  load2_watts: number;
  grid_voltage: number;
  tariff_rate: number;
  auto_off_delay_sec: number;
}
