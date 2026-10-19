import { useCallback, useEffect, useRef, useState } from 'react';
import { EnergyMeterConfig, EnergyMeterStatus } from '@/types/energy';
import { EnergyMeterService } from '@/services/energyMeterService';

export function useEnergyMeter(defaultIp = '192.168.1.100') {
  const [ipAddress, setIpAddress] = useState<string>(defaultIp);
  const [status, setStatus] = useState<EnergyMeterStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSwitchingRelay, setIsSwitchingRelay] = useState<{ 1: boolean; 2: boolean }>({ 1: false, 2: false });
  const [isSwitchingAutoMode, setIsSwitchingAutoMode] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isPollingRef = useRef<boolean>(true);

  const fetchLatest = useCallback(async () => {
    try {
      const { data } = await EnergyMeterService.getStatus(ipAddress);
      setStatus(data);
      setIsConnected(true);
      setLastUpdated(new Date());
      setErrorMsg(null);
    } catch (err: any) {
      setIsConnected(false);
      setErrorMsg(`Cannot connect to ESP32 at ${ipAddress}. Please check IP address & Wi-Fi.`);
    } finally {
      setIsLoading(false);
    }
  }, [ipAddress]);

  // Polling loop
  useEffect(() => {
    isPollingRef.current = true;
    fetchLatest();

    const interval = setInterval(() => {
      if (isPollingRef.current) {
        fetchLatest();
      }
    }, 2000);

    return () => {
      isPollingRef.current = false;
      clearInterval(interval);
    };
  }, [fetchLatest]);

  const setRelay = async (relayId: 1 | 2, newState: boolean) => {
    if (!status) return;
    const currentState = relayId === 1 ? status.relay1 : status.relay2;
    if (currentState === newState) return;

    setActionError(null);
    setIsSwitchingRelay((prev) => ({ ...prev, [relayId]: true }));

    // Optimistic UI update
    setStatus((prev) => (prev ? {
      ...prev,
      [relayId === 1 ? 'relay1' : 'relay2']: newState,
    } : null));

    try {
      const ok = await EnergyMeterService.setRelay(ipAddress, relayId, newState);
      if (!ok) {
        // Revert
        setStatus((prev) => (prev ? {
          ...prev,
          [relayId === 1 ? 'relay1' : 'relay2']: currentState,
        } : null));
        setActionError(`Failed to turn Load ${relayId} ${newState ? 'ON' : 'OFF'}. Verify ESP32 connection.`);
      } else {
        setTimeout(fetchLatest, 300);
      }
    } catch (err) {
      setStatus((prev) => (prev ? {
        ...prev,
        [relayId === 1 ? 'relay1' : 'relay2']: currentState,
      } : null));
      setActionError(`Network error communicating with ESP32.`);
    } finally {
      setIsSwitchingRelay((prev) => ({ ...prev, [relayId]: false }));
    }
  };

  const toggleRelay = async (relayId: 1 | 2) => {
    if (!status) return;
    const currentState = relayId === 1 ? status.relay1 : status.relay2;
    await setRelay(relayId, !currentState);
  };

  const setBothRelays = async (state: boolean) => {
    if (!status) return;
    setActionError(null);
    setIsSwitchingRelay({ 1: true, 2: true });

    // Optimistic update
    setStatus((prev) => (prev ? { ...prev, relay1: state, relay2: state } : null));

    try {
      const [r1Ok, r2Ok] = await Promise.all([
        EnergyMeterService.setRelay(ipAddress, 1, state),
        EnergyMeterService.setRelay(ipAddress, 2, state),
      ]);
      if (!r1Ok || !r2Ok) {
        setActionError('One or more loads failed to switch. Re-syncing...');
      }
      setTimeout(fetchLatest, 300);
    } catch (err) {
      setActionError('Network error while toggling both loads.');
      setTimeout(fetchLatest, 400);
    } finally {
      setIsSwitchingRelay({ 1: false, 2: false });
    }
  };

  const setAutoMode = async (newState: boolean, target?: 1 | 2 | 3) => {
    if (!status) return;
    setActionError(null);
    setIsSwitchingAutoMode(true);
    const prevAuto = status.auto_mode;
    const prevTarget = status.auto_target;

    setStatus((prev) => (prev ? {
      ...prev,
      auto_mode: newState,
      ...(target !== undefined ? { auto_target: target } : {}),
    } : null));

    try {
      const ok = await EnergyMeterService.setAutoMode(ipAddress, newState, target);
      if (!ok) {
        setStatus((prev) => (prev ? { ...prev, auto_mode: prevAuto, auto_target: prevTarget } : null));
        setActionError('Failed to change mode on ESP32.');
      } else {
        setTimeout(fetchLatest, 300);
      }
    } catch (err) {
      setStatus((prev) => (prev ? { ...prev, auto_mode: prevAuto, auto_target: prevTarget } : null));
      setActionError('Network error changing mode.');
    } finally {
      setIsSwitchingAutoMode(false);
    }
  };

  const toggleAutoMode = async () => {
    if (!status) return;
    await setAutoMode(!status.auto_mode);
  };

  const updateConfig = async (config: Partial<EnergyMeterConfig>) => {
    setActionError(null);
    const ok = await EnergyMeterService.updateConfig(ipAddress, config);
    if (ok) {
      setTimeout(fetchLatest, 400);
    } else {
      setActionError('Failed to save configuration to ESP32 Flash.');
    }
    return ok;
  };

  const resetEnergy = async () => {
    setActionError(null);
    const ok = await EnergyMeterService.resetEnergy(ipAddress);
    if (ok) {
      setTimeout(fetchLatest, 300);
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
    isLoading,
    isSwitchingRelay,
    isSwitchingAutoMode,
    actionError,
    dismissActionError: () => setActionError(null),
    lastUpdated,
    errorMsg,
    refresh: fetchLatest,
    toggleRelay,
    setRelay,
    setBothRelays,
    toggleAutoMode,
    setAutoMode,
    updateConfig,
    resetEnergy,
  };
}
