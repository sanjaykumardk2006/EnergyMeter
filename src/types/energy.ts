export interface EnergyMeterStatus {
  device: string;
  uptime_sec: number;
  ip: string;
  wifi_rssi: number;
  relay1: boolean;
  relay2: boolean;
  auto_mode: boolean;
  auto_target: 1 | 2 | 3; // 1 = Load 1, 2 = Load 2, 3 = Both
  auto_off_delay_sec: number;
  idle_sec: number;
  auto_cutoff_countdown_sec: number;
  occupancy_detected: boolean;
  pir_motion: boolean;
  ir_detected: boolean;
  distance_cm: number;
  distance_valid: boolean;
  occupancy_dist_threshold_cm?: number;
  voltage: number;
  measured_voltage?: number;
  hardware_voltage_active?: boolean;
  current_amps: number;
  power_watts: number;
  total_wh: number;
  total_kwh: number;
  cost_estimate: number;
  tariff_rate: number;
  last_action_reason: string;
  hardware_sensors?: boolean;
  hardware_current_active?: boolean;
  acs_sensitivity?: number;
  calib_i?: number;
  calib_v?: number;
  load_active_sec?: number;
}

export interface EnergyMeterConfig {
  auto_mode?: boolean;
  auto_target?: 1 | 2 | 3;
  auto_off_delay_sec?: number;
  dist_threshold_cm?: number;
  occupancy_dist_threshold_cm?: number;
  grid_voltage?: number;
  tariff_rate?: number;
  acs_sens?: number;
  calib_i?: number;
  calib_v?: number;
  load_active_sec?: number;
}
