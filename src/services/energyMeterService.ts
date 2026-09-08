import { EnergyMeterConfig, EnergyMeterStatus } from '@/types/energy';

// Default mock state for testing when offline
let mockState: EnergyMeterStatus = {
  device: 'ESP32-SmartEnergyMeter (Simulated)',
  uptime_sec: 2450,
  ip: '192.168.1.100',
  wifi_rssi: -58,
  ir_detected: false,
  pir_motion: true,
  distance_cm: 64.5,
  relay1: true,
  relay2: false,
  auto_mode: true,
  power_watts: 60.0,
  voltage: 230.0,
  current_amps: 0.26,
  total_kwh: 0.2458,
  cost_estimate: 1.97,
  tariff_rate: 8.0,
  load1_watts: 60.0,
  load2_watts: 1200.0,
  auto_off_delay_sec: 180,
  idle_sec: 15,
  auto_cutoff_countdown_sec: 165,
};

let mockInterval: any = null;
function startMockSimulation() {
  if (mockInterval) return;
  mockInterval = setInterval(() => {
    mockState.uptime_sec += 2;
    // Calculate simulated power
    let pwr = 0;
    if (mockState.relay1) pwr += mockState.load1_watts;
    if (mockState.relay2) pwr += mockState.load2_watts;
    mockState.power_watts = pwr;
    mockState.current_amps = +(pwr / mockState.voltage).toFixed(2);
    mockState.total_kwh += +((pwr * (2 / 3600)) / 1000).toFixed(6);
    mockState.cost_estimate = +(mockState.total_kwh * mockState.tariff_rate).toFixed(2);

    // Random slight distance fluctuation
    const delta = (Math.random() - 0.5) * 4;
    mockState.distance_cm = Math.max(10, Math.min(250, +(mockState.distance_cm + delta).toFixed(1)));

    // Occasional motion / ir toggle
    if (Math.random() > 0.8) {
      mockState.pir_motion = !mockState.pir_motion;
      if (mockState.pir_motion) mockState.idle_sec = 0;
    } else {
      mockState.idle_sec += 2;
    }

    if (Math.random() > 0.85) {
      mockState.ir_detected = !mockState.ir_detected;
    }

    mockState.auto_cutoff_countdown_sec = Math.max(0, mockState.auto_off_delay_sec - mockState.idle_sec);

    if (mockState.auto_mode && mockState.auto_cutoff_countdown_sec === 0) {
      mockState.relay1 = false;
      mockState.relay2 = false;
    }
  }, 2000);
}
startMockSimulation();

// Helper with timeout
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export class EnergyMeterService {
  private static formatUrl(ip: string, path: string): string {
    let cleanIp = ip.trim();
    if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
      cleanIp = `http://${cleanIp}`;
    }
    // remove trailing slash
    if (cleanIp.endsWith('/')) {
      cleanIp = cleanIp.slice(0, -1);
    }
    return `${cleanIp}${path}`;
  }

  static async getStatus(ip: string, useMockFallback = false): Promise<{ data: EnergyMeterStatus; isMock: boolean }> {
    try {
      const url = this.formatUrl(ip, '/api/status');
      const res = await fetchWithTimeout(url, { method: 'GET' }, 3500);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: EnergyMeterStatus = await res.json();
      return { data, isMock: false };
    } catch (err) {
      if (useMockFallback) {
        return { data: { ...mockState }, isMock: true };
      }
      throw err;
    }
  }

  static async setRelay(ip: string, relayId: 1 | 2, state: boolean, isMock = false): Promise<boolean> {
    if (isMock) {
      if (relayId === 1) mockState.relay1 = state;
      if (relayId === 2) mockState.relay2 = state;
      return true;
    }

    try {
      const url = this.formatUrl(ip, `/api/relay?id=${relayId}&state=${state ? 1 : 0}`);
      const res = await fetchWithTimeout(url, { method: 'POST' }, 3000);
      return res.ok;
    } catch (err) {
      console.warn('Failed to set relay:', err);
      return false;
    }
  }

  static async setAutoMode(ip: string, state: boolean, isMock = false): Promise<boolean> {
    if (isMock) {
      mockState.auto_mode = state;
      return true;
    }

    try {
      const url = this.formatUrl(ip, `/api/auto-mode?state=${state ? 1 : 0}`);
      const res = await fetchWithTimeout(url, { method: 'POST' }, 3000);
      return res.ok;
    } catch (err) {
      console.warn('Failed to set auto mode:', err);
      return false;
    }
  }

  static async updateConfig(
    ip: string,
    config: Partial<EnergyMeterConfig>,
    isMock = false
  ): Promise<boolean> {
    if (isMock) {
      if (config.load1_watts !== undefined) mockState.load1_watts = config.load1_watts;
      if (config.load2_watts !== undefined) mockState.load2_watts = config.load2_watts;
      if (config.grid_voltage !== undefined) mockState.voltage = config.grid_voltage;
      if (config.tariff_rate !== undefined) mockState.tariff_rate = config.tariff_rate;
      if (config.auto_off_delay_sec !== undefined) mockState.auto_off_delay_sec = config.auto_off_delay_sec;
      return true;
    }

    try {
      const params = new URLSearchParams();
      if (config.load1_watts !== undefined) params.append('load1', String(config.load1_watts));
      if (config.load2_watts !== undefined) params.append('load2', String(config.load2_watts));
      if (config.grid_voltage !== undefined) params.append('voltage', String(config.grid_voltage));
      if (config.tariff_rate !== undefined) params.append('tariff', String(config.tariff_rate));
      if (config.auto_off_delay_sec !== undefined) params.append('delay', String(config.auto_off_delay_sec));

      const url = this.formatUrl(ip, `/api/config?${params.toString()}`);
      const res = await fetchWithTimeout(url, { method: 'POST' }, 3000);
      return res.ok;
    } catch (err) {
      console.warn('Failed to update config:', err);
      return false;
    }
  }

  static async resetEnergy(ip: string, isMock = false): Promise<boolean> {
    if (isMock) {
      mockState.total_kwh = 0.0;
      mockState.cost_estimate = 0.0;
      return true;
    }

    try {
      const url = this.formatUrl(ip, '/api/reset-energy');
      const res = await fetchWithTimeout(url, { method: 'POST' }, 3000);
      return res.ok;
    } catch (err) {
      console.warn('Failed to reset energy:', err);
      return false;
    }
  }
}
