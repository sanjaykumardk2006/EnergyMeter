import { EnergyMeterConfig, EnergyMeterStatus } from '@/types/energy';

// Helper with timeout
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(id);
  }
}

export class EnergyMeterService {
  private static formatUrl(ip: string, path: string): string {
    let cleanIp = ip.trim();
    if (!cleanIp.startsWith('http://') && !cleanIp.startsWith('https://')) {
      cleanIp = `http://${cleanIp}`;
    }
    // remove trailing slashes safely
    cleanIp = cleanIp.replace(/\/+$/, '');
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanIp}${cleanPath}`;
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

  static async setAutoMode(ip: string, state: boolean, target?: 1 | 2 | 3): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('state', state ? '1' : '0');
      if (target !== undefined) {
        params.append('target', String(target));
      }
      const url = this.formatUrl(ip, `/api/auto-mode?${params.toString()}`);
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
      if (config.auto_mode !== undefined) params.append('auto_mode', config.auto_mode ? '1' : '0');
      if (config.auto_target !== undefined) params.append('target', String(config.auto_target));
      if (config.grid_voltage !== undefined) params.append('voltage', String(config.grid_voltage));
      if (config.tariff_rate !== undefined) params.append('tariff', String(config.tariff_rate));
      if (config.auto_off_delay_sec !== undefined) params.append('delay', String(config.auto_off_delay_sec));
      const distThreshold = config.occupancy_dist_threshold_cm ?? config.dist_threshold_cm;
      if (distThreshold !== undefined) params.append('dist_threshold', String(distThreshold));
      if (config.acs_sens !== undefined) params.append('acs_sens', String(config.acs_sens));
      if (config.calib_i !== undefined) params.append('calib_i', String(config.calib_i));
      if (config.calib_v !== undefined) params.append('calib_v', String(config.calib_v));

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
