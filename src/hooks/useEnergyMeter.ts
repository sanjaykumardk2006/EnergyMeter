import { useCallback, useEffect, useRef, useState } from 'react';
import { EnergyMeterConfig, EnergyMeterStatus } from '@/types/energy';
import { EnergyMeterService } from '@/services/energyMeterService';

const defaultStatus: EnergyMeterStatus = {
  device: 'ESP32 Smart Energy Meter',
  uptime_sec: 0,
  ip: '192.168.1.100',
  wifi_rssi: 0,
  voltage: 0.0,
  measured_voltage: 0.0,
  hardware_voltage_active: false,
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
  distance_valid: false,
  occupancy_dist_threshold_cm: 50,
  auto_mode: false, // Default to Manual Control mode
  auto_target: 3,
  auto_off_delay_sec: 120,
  idle_sec: 0,
  auto_cutoff_countdown_sec: 120,
  occupancy_detected: false,
  last_action_reason: 'Awaiting connection to ESP32...',
  load_active_sec: 0,
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

  // Accurate active time tracking in seconds (synchronized with hardware)
  const [loadActiveSec, setLoadActiveSec] = useState<number>(0);

  // Store user's explicit mode choice if changed by user (null = use device state)
  const userModeChoiceRef = useRef<boolean | null>(null);
  const isPollingRef = useRef<boolean>(true);

  // fetchStatus: Core data fetcher from ESP32 hardware
  const fetchStatus = useCallback(async (targetIp?: string | unknown) => {
    const isString = typeof targetIp === 'string' && targetIp.trim().length > 0;
    const ip = isString ? (targetIp as string).trim() : ipAddress.trim();
    if (!ip) return;
    try {
      const { data } = await EnergyMeterService.getStatus(ip);
      // Preserve user's explicit mode choice if chosen, otherwise use device reported state
      const activeMode = userModeChoiceRef.current !== null ? userModeChoiceRef.current : (data.auto_mode ?? false);
      setStatus({
        ...data,
        auto_mode: activeMode,
      });
      if (data.load_active_sec !== undefined) {
        setLoadActiveSec(data.load_active_sec);
      }
      setIsConnected(true);
      setLastUpdated(new Date());
      setErrorMsg(null);
    } catch {
      setIsConnected(false);
      setErrorMsg(`Cannot connect to ESP32 at ${ip}. Please check IP address & Wi-Fi.`);
      // Strictly reset live telemetry so disconnected state does NOT show fake or stale readings
      setStatus((prev) => ({
        ...prev,
        current_amps: 0.0,
        power_watts: 0.0,
        voltage: 0.0,
        measured_voltage: 0.0,
        hardware_voltage_active: false,
        occupancy_detected: false,
        pir_motion: false,
        ir_detected: false,
        distance_cm: 0,
        distance_valid: false,
        last_action_reason: 'ESP32 Disconnected (No Telemetry)',
      }));
    }
  }, [ipAddress]);

  const connectToIp = useCallback(async (newIp: string) => {
    const cleanIp = (typeof newIp === 'string' ? newIp : '').trim();
    if (!cleanIp) return;
    setIpAddress(cleanIp);
    setIsConnecting(true);
    try {
      await fetchStatus(cleanIp);
    } finally {
      setIsConnecting(false);
    }
  }, [fetchStatus]);

  const refresh = useCallback(async (targetIp?: string | unknown) => {
    setIsRefreshing(true);
    try {
      const isString = typeof targetIp === 'string' && targetIp.trim().length > 0;
      const cleanTarget = isString ? (targetIp as string).trim() : ipAddress.trim();
      if (isString && cleanTarget !== ipAddress) {
        setIpAddress(cleanTarget);
      }
      await fetchStatus(cleanTarget);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStatus, ipAddress]);

  // Silent background polling (every 3s)
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

  // Real-time active hours accumulator: Only ticks when hardware IS connected and loads are actively ON
  useEffect(() => {
    if (!isConnected) return;
    const isLoadActive = status.relay1 || status.relay2 || status.power_watts > 0.05;
    if (!isLoadActive) return;

    const interval = setInterval(() => {
      setLoadActiveSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, status.relay1, status.relay2, status.power_watts]);

  const setRelay = async (relayId: 1 | 2, newState: boolean) => {
    setActionError(null);
    setIsSwitchingRelay((prev) => ({ ...prev, [relayId]: true }));

    // Immediate UI state update so switches flip and bulbs glow
    // Telemetry (current and power) remains strictly 0.00 when offline!
    setStatus((prev) => ({
      ...prev,
      [relayId === 1 ? 'relay1' : 'relay2']: newState,
    }));

    try {
      if (isConnected) {
        const ok = await EnergyMeterService.setRelay(ipAddress, relayId, newState);
        if (ok) {
          setTimeout(() => fetchStatus(), 300);
        } else {
          setActionError(`Failed to switch Load ${relayId} on ESP32.`);
          fetchStatus();
        }
      }
    } catch (err) {
      console.warn('Network error setting relay:', err);
      setActionError('Network error communicating with ESP32.');
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

    // Immediate UI update
    setStatus((prev) => ({
      ...prev,
      relay1: state,
      relay2: state,
    }));

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
      setActionError('Network error communicating with ESP32.');
    } finally {
      setIsSwitchingRelay({ 1: false, 2: false });
    }
  };

  const setAutoMode = async (newState: boolean, target?: 1 | 2 | 3) => {
    setActionError(null);
    setIsSwitchingAutoMode(true);
    userModeChoiceRef.current = newState;

    // Immediate mode switch in UI
    setStatus((prev) => {
      // In Smart Control mode, if all sensors clear -> turn OFF loads
      const threshold = prev.occupancy_dist_threshold_cm || 50;
      const isOccupied =
        prev.pir_motion ||
        prev.ir_detected ||
        (prev.distance_valid && prev.distance_cm > 0 && prev.distance_cm <= threshold);

      const targetVal = target ?? prev.auto_target ?? 3;
      const r1 = newState ? isOccupied && (targetVal === 1 || targetVal === 3) : prev.relay1;
      const r2 = newState ? isOccupied && (targetVal === 2 || targetVal === 3) : prev.relay2;

      return {
        ...prev,
        auto_mode: newState,
        relay1: r1,
        relay2: r2,
        occupancy_detected: isOccupied,
        last_action_reason: newState
          ? isOccupied
            ? 'Smart Control: Presence detected -> Target Lights ON'
            : 'Smart Control: All sensors clear -> All Loads OFF'
          : 'Manual Control mode active',
        ...(target !== undefined ? { auto_target: target } : {}),
      };
    });

    try {
      if (isConnected) {
        const ok = await EnergyMeterService.setAutoMode(ipAddress, newState, target);
        if (ok) {
          setTimeout(() => fetchStatus(), 300);
        } else {
          setActionError('Failed to change mode on ESP32.');
        }
      }
    } catch (err) {
      console.warn('Network error changing mode:', err);
      setActionError('Network error communicating with ESP32.');
    } finally {
      setIsSwitchingAutoMode(false);
    }
  };

  const toggleAutoMode = async () => {
    await setAutoMode(!status.auto_mode);
  };

  const updateConfig = async (config: Partial<EnergyMeterConfig>) => {
    setActionError(null);
    const distThresh = config.dist_threshold_cm ?? config.occupancy_dist_threshold_cm;

    setStatus((prev) => ({
      ...prev,
      ...(config.auto_mode !== undefined ? { auto_mode: config.auto_mode } : {}),
      ...(config.auto_target !== undefined ? { auto_target: config.auto_target } : {}),
      ...(config.auto_off_delay_sec !== undefined ? { auto_off_delay_sec: config.auto_off_delay_sec } : {}),
      ...(config.tariff_rate !== undefined ? { tariff_rate: config.tariff_rate } : {}),
      ...(config.grid_voltage !== undefined ? { voltage: config.grid_voltage } : {}),
      ...(distThresh !== undefined ? { occupancy_dist_threshold_cm: distThresh } : {}),
    }));

    if (!isConnected) {
      return true;
    }

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
    if (!isConnected) {
      return false;
    }
    const ok = await EnergyMeterService.resetEnergy(ipAddress);
    if (ok) {
      setLoadActiveSec(0);
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
    loadActiveSec,
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
