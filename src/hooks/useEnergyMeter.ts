import { useCallback, useEffect, useRef, useState } from 'react';
import { EnergyMeterConfig, EnergyMeterStatus } from '@/types/energy';
import { EnergyMeterService } from '@/services/energyMeterService';

const defaultStatus: EnergyMeterStatus = {
  device: 'ESP32 Smart Energy Meter',
  uptime_sec: 0,
  ip: '192.168.1.100',
  wifi_rssi: -50,
  voltage: 5.0,
  current_amps: 0.0,
  power_watts: 0.0,
  total_wh: 0.0,
  total_kwh: 0.0,
  tariff_rate: 8.0,
  cost_estimate: 0.0,
  relay1: false,
  relay2: false,
  pir_motion: false,
  ir_detected: false,
  distance_cm: 0,
  distance_valid: true,
  auto_mode: false, // Default to Manual Control mode
  auto_target: 3,
  auto_off_delay_sec: 120,
  idle_sec: 0,
  auto_cutoff_countdown_sec: 120,
  occupancy_detected: false,
  last_action_reason: 'System ready (Manual Control)',
};

export function useEnergyMeter(defaultIp = '192.168.1.100') {
  const [ipAddress, setIpAddress] = useState<string>(defaultIp);
  const [status, setStatus] = useState<EnergyMeterStatus>(defaultStatus);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSwitchingRelay, setIsSwitchingRelay] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [isSwitchingAutoMode, setIsSwitchingAutoMode] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Store user's mode choice (default: Manual Control = false)
  const userModeChoiceRef = useRef<boolean>(false);
  const isPollingRef = useRef<boolean>(true);

  // fetchStatus: Core data fetcher
  const fetchStatus = useCallback(async (targetIp?: string) => {
    const ip = (targetIp || ipAddress).trim();
    if (!ip) return;
    try {
      const { data } = await EnergyMeterService.getStatus(ip);
      // Preserve user's mode choice so refresh does not force automatic mode
      const activeMode = userModeChoiceRef.current !== null ? userModeChoiceRef.current : (data.auto_mode ?? false);
      setStatus({
        ...data,
        auto_mode: activeMode,
      });
      setIsConnected(true);
      setLastUpdated(new Date());
      setErrorMsg(null);
    } catch (err: any) {
      setIsConnected(false);
      setErrorMsg(`Cannot connect to ESP32 at ${ip}. Please check IP address & Wi-Fi.`);
    }
  }, [ipAddress]);

  const connectToIp = useCallback(async (newIp: string) => {
    const cleanIp = newIp.trim();
    if (!cleanIp) return;
    setIpAddress(cleanIp);
    setIsConnecting(true);
    try {
      await fetchStatus(cleanIp);
    } finally {
      setIsConnecting(false);
    }
  }, [fetchStatus]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchStatus();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStatus]);

  // Silent background polling (every 3s) without flickering UI spinners
  useEffect(() => {
    isPollingRef.current = true;
    fetchStatus();

    const interval = setInterval(() => {
      if (isPollingRef.current) {
        fetchStatus();
      }
    }, 3000);

    return () => {
      isPollingRef.current = false;
      clearInterval(interval);
    };
  }, [fetchStatus]);

  const setRelay = async (relayId: 1 | 2, newState: boolean) => {
    setActionError(null);
    setIsSwitchingRelay((prev) => ({ ...prev, [relayId]: true }));

    // Optimistic UI update
    setStatus((prev) => ({
      ...prev,
      [relayId === 1 ? 'relay1' : 'relay2']: newState,
    }));

    try {
      if (isConnected) {
        const ok = await EnergyMeterService.setRelay(ipAddress, relayId, newState);
        if (ok) {
          setTimeout(() => fetchStatus(), 300);
        }
      }
    } catch (err) {
      console.warn('Network error setting relay:', err);
    } finally {
      setIsSwitchingRelay((prev) => ({ ...prev, [relayId]: false }));
    }
  };

  const toggleRelay = async (relayId: 1 | 2) => {
    const currentState = relayId === 1 ? status.relay1 : status.relay2;
    await setRelay(relayId, !currentState);
  };

  const setBothRelays = async (state: boolean) => {
    setActionError(null);
    setIsSwitchingRelay({ 1: true, 2: true });

    // Optimistic update
    setStatus((prev) => ({ ...prev, relay1: state, relay2: state }));

    try {
      if (isConnected) {
        await Promise.all([
          EnergyMeterService.setRelay(ipAddress, 1, state),
          EnergyMeterService.setRelay(ipAddress, 2, state),
        ]);
        setTimeout(() => fetchStatus(), 300);
      }
    } catch (err) {
      console.warn('Network error while toggling both loads:', err);
    } finally {
      setIsSwitchingRelay({ 1: false, 2: false });
    }
  };

  const setAutoMode = async (newState: boolean, target?: 1 | 2 | 3) => {
    setActionError(null);
    setIsSwitchingAutoMode(true);
    userModeChoiceRef.current = newState;

    // Optimistically update auto_mode and keep user choice active
    setStatus((prev) => ({
      ...prev,
      auto_mode: newState,
      ...(target !== undefined ? { auto_target: target } : {}),
    }));

    try {
      if (isConnected) {
        const ok = await EnergyMeterService.setAutoMode(ipAddress, newState, target);
        if (ok) {
          setTimeout(() => fetchStatus(), 300);
        }
      }
    } catch (err) {
      console.warn('Network error changing mode:', err);
    } finally {
      setIsSwitchingAutoMode(false);
    }
  };

  const toggleAutoMode = async () => {
    await setAutoMode(!status.auto_mode);
  };

  const updateConfig = async (config: Partial<EnergyMeterConfig>) => {
    setActionError(null);
    const ok = await EnergyMeterService.updateConfig(ipAddress, config);
    if (ok) {
      setTimeout(() => fetchStatus(), 400);
    } else {
      setActionError('Failed to save configuration to ESP32 Flash.');
    }
    return ok;
  };

  const resetEnergy = async () => {
    setActionError(null);
    const ok = await EnergyMeterService.resetEnergy(ipAddress);
    if (ok) {
      setTimeout(() => fetchStatus(), 300);
    } else {
      setActionError('Failed to reset energy counter on ESP32.');
    }
    return ok;
  };

  return {
    status,
    ipAddress,
    setIpAddress,
    isConnected,
    isConnecting,
    isRefreshing,
    isLoading: isConnecting || isRefreshing,
    isSwitchingRelay,
    isSwitchingAutoMode,
    actionError,
    dismissActionError: () => setActionError(null),
    lastUpdated,
    errorMsg,
    refresh,
    connectToIp,
    toggleRelay,
    setRelay,
    setBothRelays,
    toggleAutoMode,
    setAutoMode,
    updateConfig,
    resetEnergy,
  };
}
