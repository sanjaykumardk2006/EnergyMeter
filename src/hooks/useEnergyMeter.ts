import { useCallback, useEffect, useRef, useState } from 'react';
import { EnergyMeterConfig, EnergyMeterStatus } from '@/types/energy';
import { EnergyMeterService } from '@/services/energyMeterService';

const defaultStatus: EnergyMeterStatus = {
  device: 'ESP32 Smart Energy Meter',
  uptime_sec: 0,
  ip: '192.168.1.100',
  wifi_rssi: -50,
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
  distance_valid: true,
  occupancy_dist_threshold_cm: 50,
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

  // Store user's explicit mode choice if changed by user (null = use device state)
  const userModeChoiceRef = useRef<boolean | null>(null);
  const isPollingRef = useRef<boolean>(true);

  // fetchStatus: Core data fetcher
  const fetchStatus = useCallback(async (targetIp?: string) => {
    const ip = (targetIp || ipAddress).trim();
    if (!ip) return;
    try {
      const { data } = await EnergyMeterService.getStatus(ip);
      // Preserve user's explicit mode choice if chosen, otherwise use device reported state
      const activeMode = userModeChoiceRef.current !== null ? userModeChoiceRef.current : (data.auto_mode ?? false);
      setStatus({
        ...data,
        auto_mode: activeMode,
      });
      setIsConnected(true);
      setLastUpdated(new Date());
      setErrorMsg(null);
    } catch {
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

  // Localhost/offline simulation effect: accumulates energy & power when loads are active, and handles smart control sensor automation
  useEffect(() => {
    if (isConnected) return;
    const interval = setInterval(() => {
      setStatus((prev) => {
        // Smart Control Automation: If no sensors detect anything, turn OFF all loads
        if (prev.auto_mode) {
          const threshold = prev.occupancy_dist_threshold_cm || 50;
          const isOccupied =
            prev.pir_motion ||
            prev.ir_detected ||
            (prev.distance_valid && prev.distance_cm > 0 && prev.distance_cm <= threshold);

          if (!isOccupied && (prev.relay1 || prev.relay2)) {
            // NO sensors detected presence -> Turn loads OFF!
            return {
              ...prev,
              relay1: false,
              relay2: false,
              current_amps: 0.0,
              power_watts: 0.0,
              occupancy_detected: false,
              last_action_reason: 'Auto: All sensors clear (PIR, IR & Ultrasonic) -> Loads turned OFF',
            };
          } else if (isOccupied) {
            const target = prev.auto_target ?? 3;
            const targetR1 = target === 1 || target === 3;
            const targetR2 = target === 2 || target === 3;
            if ((targetR1 && !prev.relay1) || (targetR2 && !prev.relay2)) {
              const v = prev.voltage || 5.0;
              const i = (targetR1 ? 0.42 : 0) + (targetR2 ? 0.45 : 0);
              return {
                ...prev,
                relay1: targetR1,
                relay2: targetR2,
                current_amps: parseFloat(i.toFixed(2)),
                power_watts: parseFloat((i * v).toFixed(2)),
                occupancy_detected: true,
                last_action_reason: 'Auto: Presence detected -> Target Lights ON',
              };
            }
          }
        }

        if (!prev.relay1 && !prev.relay2) return prev;
        const v = prev.voltage || 5.0;
        const i = (prev.relay1 ? 0.42 : 0) + (prev.relay2 ? 0.45 : 0);
        const p = i * v;
        const addedWh = p * (1 / 3600);
        const newWh = prev.total_wh + addedWh;
        const newKwh = newWh / 1000;
        return {
          ...prev,
          current_amps: parseFloat(i.toFixed(2)),
          power_watts: parseFloat(p.toFixed(2)),
          total_wh: parseFloat(newWh.toFixed(3)),
          total_kwh: parseFloat(newKwh.toFixed(5)),
          cost_estimate: parseFloat((newKwh * (prev.tariff_rate || 8.0)).toFixed(3)),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const setRelay = async (relayId: 1 | 2, newState: boolean) => {
    setActionError(null);
    setIsSwitchingRelay((prev) => ({ ...prev, [relayId]: true }));

    // Optimistic UI update with mock simulation if offline
    setStatus((prev) => {
      const r1 = relayId === 1 ? newState : prev.relay1;
      const r2 = relayId === 2 ? newState : prev.relay2;
      const v = prev.voltage || 5.0;
      const i = !isConnected ? (r1 ? 0.42 : 0) + (r2 ? 0.45 : 0) : prev.current_amps;
      const p = !isConnected ? i * v : prev.power_watts;
      return {
        ...prev,
        [relayId === 1 ? 'relay1' : 'relay2']: newState,
        ...(!isConnected ? { current_amps: parseFloat(i.toFixed(2)), power_watts: parseFloat(p.toFixed(2)) } : {}),
      };
    });

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

    // Optimistic update with mock simulation if offline
    setStatus((prev) => {
      const v = prev.voltage || 5.0;
      const i = !isConnected ? (state ? 0.87 : 0) : prev.current_amps;
      const p = !isConnected ? i * v : prev.power_watts;
      return {
        ...prev,
        relay1: state,
        relay2: state,
        ...(!isConnected ? { current_amps: parseFloat(i.toFixed(2)), power_watts: parseFloat(p.toFixed(2)) } : {}),
      };
    });

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

    // Optimistically update auto_mode and turn OFF loads if no sensors detect presence
    setStatus((prev) => {
      const threshold = prev.occupancy_dist_threshold_cm || 50;
      const isOccupied =
        prev.pir_motion ||
        prev.ir_detected ||
        (prev.distance_valid && prev.distance_cm > 0 && prev.distance_cm <= threshold);

      const targetVal = target ?? prev.auto_target ?? 3;
      // In Smart Control mode, if all sensors clear -> turn OFF all loads
      const r1 = newState
        ? isOccupied && (targetVal === 1 || targetVal === 3)
        : prev.relay1;
      const r2 = newState
        ? isOccupied && (targetVal === 2 || targetVal === 3)
        : prev.relay2;

      const v = prev.voltage || 5.0;
      const i = !isConnected ? (r1 ? 0.42 : 0) + (r2 ? 0.45 : 0) : prev.current_amps;
      const p = !isConnected ? i * v : prev.power_watts;

      return {
        ...prev,
        auto_mode: newState,
        relay1: r1,
        relay2: r2,
        current_amps: parseFloat(i.toFixed(2)),
        power_watts: parseFloat(p.toFixed(2)),
        occupancy_detected: isOccupied,
        last_action_reason: newState
          ? isOccupied
            ? 'Auto: Presence detected -> Target Lights ON'
            : 'Auto: All sensors clear (PIR, IR & Ultrasonic) -> Loads turned OFF'
          : 'Manual Control mode active',
        ...(target !== undefined ? { auto_target: target } : {}),
      };
    });

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

  const simulateSensorTrigger = (sensor: 'pir' | 'ir' | 'ultrasonic' | 'clear') => {
    setStatus((prev) => {
      const threshold = prev.occupancy_dist_threshold_cm || 50;
      let pir = prev.pir_motion;
      let ir = prev.ir_detected;
      let dist = prev.distance_cm;
      let valid = prev.distance_valid;

      if (sensor === 'pir') {
        pir = !pir;
      } else if (sensor === 'ir') {
        ir = !ir;
      } else if (sensor === 'ultrasonic') {
        // Toggle distance inside vs outside threshold
        dist = dist > 0 && dist <= threshold ? threshold + 40 : Math.max(15, Math.round(threshold * 0.6));
        valid = true;
      } else if (sensor === 'clear') {
        pir = false;
        ir = false;
        dist = 0;
        valid = true;
      }

      const isOccupied = pir || ir || (valid && dist > 0 && dist <= threshold);

      // In smart control mode, immediately enforce rule:
      // If occupied -> turn on target lights; if not occupied -> turn off all loads!
      const targetVal = prev.auto_target ?? 3;
      const shouldR1 = prev.auto_mode
        ? (isOccupied && (targetVal === 1 || targetVal === 3))
        : prev.relay1;
      const shouldR2 = prev.auto_mode
        ? (isOccupied && (targetVal === 2 || targetVal === 3))
        : prev.relay2;

      const v = prev.voltage || 5.0;
      const i = !isConnected ? (shouldR1 ? 0.42 : 0) + (shouldR2 ? 0.45 : 0) : prev.current_amps;
      const p = !isConnected ? i * v : prev.power_watts;

      return {
        ...prev,
        pir_motion: pir,
        ir_detected: ir,
        distance_cm: dist,
        distance_valid: valid,
        occupancy_detected: isOccupied,
        relay1: shouldR1,
        relay2: shouldR2,
        current_amps: parseFloat(i.toFixed(2)),
        power_watts: parseFloat(p.toFixed(2)),
        last_action_reason: prev.auto_mode
          ? isOccupied
            ? `Auto: Sensor detected presence (${pir ? 'PIR ' : ''}${ir ? 'IR ' : ''}${dist > 0 && dist <= threshold ? 'US ' : ''}) -> Loads ON`
            : 'Auto: All sensors clear (PIR, IR & Ultrasonic) -> Loads turned OFF'
          : prev.last_action_reason,
      };
    });
  };

  const toggleAutoMode = async () => {
    await setAutoMode(!status.auto_mode);
  };

  const updateConfig = async (config: Partial<EnergyMeterConfig>) => {
    setActionError(null);
    const distThresh = config.dist_threshold_cm ?? config.occupancy_dist_threshold_cm;

    // Optimistic / local state update
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
    simulateSensorTrigger,
  };
}
