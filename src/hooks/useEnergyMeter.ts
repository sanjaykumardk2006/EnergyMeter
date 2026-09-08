import { useCallback, useEffect, useRef, useState } from 'react';
import { EnergyMeterConfig, EnergyMeterStatus } from '@/types/energy';
import { EnergyMeterService } from '@/services/energyMeterService';

export function useEnergyMeter(defaultIp = '192.168.1.100') {
  const [ipAddress, setIpAddress] = useState<string>(defaultIp);
  const [status, setStatus] = useState<EnergyMeterStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isPollingRef = useRef<boolean>(true);

  const fetchLatest = useCallback(async () => {
    try {
      const { data, isMock } = await EnergyMeterService.getStatus(ipAddress, isMockMode);
      setStatus(data);
      setIsConnected(true);
      setIsMockMode(isMock);
      setLastUpdated(new Date());
      setErrorMsg(null);
    } catch (err: any) {
      setIsConnected(false);
      setErrorMsg(`Cannot connect to ESP32 at ${ipAddress}. Enable Mock Mode to test.`);
    } finally {
      setIsLoading(false);
    }
  }, [ipAddress, isMockMode]);

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

  const toggleRelay = async (relayId: 1 | 2) => {
    if (!status) return;
    const currentState = relayId === 1 ? status.relay1 : status.relay2;
    const newState = !currentState;

    // Optimistic UI update
    setStatus((prev) => (prev ? {
      ...prev,
      [relayId === 1 ? 'relay1' : 'relay2']: newState,
    } : null));

    const ok = await EnergyMeterService.setRelay(ipAddress, relayId, newState, isMockMode);
    if (!ok) {
      // Revert if failed
      setStatus((prev) => (prev ? {
        ...prev,
        [relayId === 1 ? 'relay1' : 'relay2']: currentState,
      } : null));
    } else {
      setTimeout(fetchLatest, 300);
    }
  };

  const toggleAutoMode = async () => {
    if (!status) return;
    const newState = !status.auto_mode;

    setStatus((prev) => (prev ? { ...prev, auto_mode: newState } : null));
    const ok = await EnergyMeterService.setAutoMode(ipAddress, newState, isMockMode);
    if (!ok) {
      setStatus((prev) => (prev ? { ...prev, auto_mode: !newState } : null));
    } else {
      setTimeout(fetchLatest, 300);
    }
  };

  const updateConfig = async (config: Partial<EnergyMeterConfig>) => {
    const ok = await EnergyMeterService.updateConfig(ipAddress, config, isMockMode);
    if (ok) {
      setTimeout(fetchLatest, 400);
    }
    return ok;
  };

  const resetEnergy = async () => {
    const ok = await EnergyMeterService.resetEnergy(ipAddress, isMockMode);
    if (ok) {
      setTimeout(fetchLatest, 300);
    }
    return ok;
  };

  return {
    status,
    ipAddress,
    setIpAddress,
    isConnected,
    isMockMode,
    setIsMockMode,
    isLoading,
    lastUpdated,
    errorMsg,
    refresh: fetchLatest,
    toggleRelay,
    toggleAutoMode,
    updateConfig,
    resetEnergy,
  };
}
