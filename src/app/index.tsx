import React, { useState } from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNavBar, TabKey } from '@/components/energy/BottomNavBar';
import { EnergyView } from '@/components/energy/EnergyView';
import { HomeDashboardView } from '@/components/energy/HomeDashboardView';
import { LoadDetailModal } from '@/components/energy/LoadDetailModal';
import { SensorsView } from '@/components/energy/SensorsView';
import { SettingsView } from '@/components/energy/SettingsView';
import { SystemStatusModal } from '@/components/energy/SystemStatusModal';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useEnergyMeter } from '@/hooks/useEnergyMeter';

function MainAppContent() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [loadDetailModal, setLoadDetailModal] = useState<{ visible: boolean; loadId: 1 | 2 }>({
    visible: false,
    loadId: 1,
  });
  const [systemStatusVisible, setSystemStatusVisible] = useState<boolean>(false);

  // Top spacing to ensure content clears status bar/notch and sits comfortably lower
  const topPadding = (Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : insets.top) + 16;

  const {
    status,
    ipAddress,
    setIpAddress,
    isConnected,
    isConnecting,
    isRefreshing,
    isLoading,
    lastUpdated,
    toggleRelay,
    toggleAutoMode,
    setAutoMode,
    updateConfig,
    resetEnergy,
    refresh,
    connectToIp,
  } = useEnergyMeter();

  const voltage = status?.voltage ?? 5.0; // 5V DC Nominal
  const currentAmps = status?.current_amps ?? 0;
  const powerWatts = status?.power_watts ?? 0;
  const totalKwh = status?.total_kwh ?? 0;
  const tariffRate = status?.tariff_rate ?? 8;
  const costEstimate = status?.cost_estimate ?? totalKwh * tariffRate;
  const relay1 = status?.relay1 ?? false;
  const relay2 = status?.relay2 ?? false;
  const pirMotion = status?.pir_motion ?? false;
  const irDetected = status?.ir_detected ?? false;
  const distanceCm = status?.distance_cm ?? 0;
  const distanceValid = status?.distance_valid ?? true;
  // Default strictly to Manual Control (false)
  const autoMode = status?.auto_mode ?? false;
  const autoTarget = status?.auto_target ?? 3;
  const autoOffDelaySec = status?.auto_off_delay_sec ?? 300;
  const occupancyDetected =
    status?.occupancy_detected ??
    (pirMotion || irDetected || (distanceValid && distanceCm > 0 && distanceCm < 120));
  const lastActionReason = status?.last_action_reason;

  return (
    <View style={[styles.safeRoot, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={Platform.OS === 'android'}
      />
      <View
        style={[
          styles.contentContainer,
          { backgroundColor: colors.background, paddingTop: topPadding },
        ]}>
        {/* Tab 1: Home Dashboard (Screen 1: Manual Control & Screen 2: Smart Control) */}
        {activeTab === 'home' && (
          <HomeDashboardView
            autoMode={autoMode}
            occupancyDetected={occupancyDetected}
            relay1={relay1}
            relay2={relay2}
            voltage={voltage}
            currentAmps={currentAmps}
            powerWatts={powerWatts}
            totalKwh={totalKwh}
            autoOffDelaySec={autoOffDelaySec}
            ipAddress={ipAddress}
            isConnected={isConnected}
            isConnecting={isConnecting}
            isRefreshing={isRefreshing}
            isLoading={isLoading}
            lastUpdated={lastUpdated}
            onConnect={connectToIp}
            onRefresh={refresh}
            onSetAutoMode={setAutoMode}
            onToggleAutoMode={toggleAutoMode}
            onToggleRelay1={() => toggleRelay(1)}
            onToggleRelay2={() => toggleRelay(2)}
            onOpenLoadDetail={(id) => setLoadDetailModal({ visible: true, loadId: id })}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenSystemStatus={() => setSystemStatusVisible(true)}
          />
        )}

        {/* Tab 2: Sensors Page (Screen 3) */}
        {activeTab === 'sensors' && (
          <SensorsView
            pirMotion={pirMotion}
            irDetected={irDetected}
            distanceCm={distanceCm}
            distanceValid={distanceValid}
            currentAmps={currentAmps}
          />
        )}

        {/* Tab 3: Energy Monitoring Page (Screen 4) */}
        {activeTab === 'energy' && (
          <EnergyView
            voltage={voltage}
            currentAmps={currentAmps}
            powerWatts={powerWatts}
            totalKwh={totalKwh}
            costEstimate={costEstimate}
            tariffRate={tariffRate}
          />
        )}

        {/* Tab 4: Settings Page (Screen 5) */}
        {activeTab === 'settings' && (
          <SettingsView
            autoMode={autoMode}
            autoTarget={autoTarget}
            autoOffDelaySec={autoOffDelaySec}
            ipAddress={ipAddress}
            tariffRate={tariffRate}
            voltage={voltage}
            onToggleAutoMode={toggleAutoMode}
            onUpdateTarget={(target) => setAutoMode(true, target)}
            onUpdateDelay={(delay) => updateConfig({ auto_off_delay_sec: delay })}
            onSaveConfig={updateConfig}
            onResetEnergy={resetEnergy}
            onIpChange={setIpAddress}
            onOpenSystemStatus={() => setSystemStatusVisible(true)}
          />
        )}
      </View>

      {/* Persistent Bottom Navigation Bar across all tabs */}
      <BottomNavBar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Modals for Screens 6 & 7 (Light 1 & Light 2 Controls) */}
      <LoadDetailModal
        visible={loadDetailModal.visible}
        loadId={loadDetailModal.loadId}
        isOn={loadDetailModal.loadId === 1 ? relay1 : relay2}
        autoMode={autoMode}
        currentAmps={currentAmps}
        voltage={voltage}
        tariffRate={tariffRate}
        onToggle={() => toggleRelay(loadDetailModal.loadId)}
        onClose={() => setLoadDetailModal((prev) => ({ ...prev, visible: false }))}
      />

      {/* Modal for Screen 8 (System Status & Last Actions Audit Log) */}
      <SystemStatusModal
        visible={systemStatusVisible}
        isConnected={isConnected}
        ipAddress={ipAddress}
        lastActionReason={lastActionReason}
        lastUpdated={lastUpdated}
        onIpChange={setIpAddress}
        onRefresh={refresh}
        onClose={() => setSystemStatusVisible(false)}
      />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});
