import { EnergyMeterConfig, EnergyMeterStatus } from '@/types/energy';

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

  static async getStatus(ip: string): Promise<{ data: EnergyMeterStatus; isMock: boolean }> {
    const url = this.formatUrl(ip, '/api/status');
    const res = await fetchWithTimeout(url, { method: 'GET' }, 3500);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data: EnergyMeterStatus = await res.json();
    return { data, isMock: false };
  }

  static async setRelay(ip: string, relayId: 1 | 2, state: boolean): Promise<boolean> {
    try {
      const url = this.formatUrl(ip, `/api/relay?id=${relayId}&state=${state ? 1 : 0}`);
      const res = await fetchWithTimeout(url, { method: 'POST' }, 3000);
      return res.ok;
    } catch (err) {
      console.warn('Failed to set relay:', err);
      return false;
    }
  }

  static async setAutoMode(ip: string, state: boolean): Promise<boolean> {
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
    config: Partial<EnergyMeterConfig>
  ): Promise<boolean> {
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

  static async resetEnergy(ip: string): Promise<boolean> {
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
