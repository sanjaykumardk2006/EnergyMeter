import React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConnectionBar } from '@/components/energy/ConnectionBar';
import { PowerOverviewCard } from '@/components/energy/PowerOverviewCard';
import { RelayControlSection } from '@/components/energy/RelayControlSection';
import { SensorTelemetryGrid } from '@/components/energy/SensorTelemetryGrid';
import { SmartEcoBanner } from '@/components/energy/SmartEcoBanner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useEnergyMeter } from '@/hooks/useEnergyMeter';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const {
    status,
    ipAddress,
    setIpAddress,
    isConnected,
    isLoading,
    isSwitchingRelay,
    isSwitchingAutoMode,
    actionError,
    dismissActionError,
    refresh,
    toggleRelay,
    setBothRelays,
    toggleAutoMode,
    setAutoMode,
  } = useEnergyMeter();

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top + Spacing.two,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.four,
      paddingBottom: Spacing.six,
    },
    default: {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
  });

  const powerWatts = status?.power_watts ?? 0;
  const totalKwh = status?.total_kwh ?? 0;
  const totalWh = status?.total_wh ?? (totalKwh * 1000);
  const costEstimate = status?.cost_estimate ?? 0;
  const voltage = status?.voltage ?? 5.0; // 5V DC Nominal
  const currentAmps = status?.current_amps ?? 0;
  const tariffRate = status?.tariff_rate ?? 8;
  const relay1 = status?.relay1 ?? false;
  const relay2 = status?.relay2 ?? false;
  const pirMotion = status?.pir_motion ?? false;
  const irDetected = status?.ir_detected ?? false;
  const distanceCm = status?.distance_cm ?? 0;
  const distanceValid = status?.distance_valid ?? true;
  const autoMode = status?.auto_mode ?? true;
  const autoTarget = status?.auto_target ?? 3;
  const occupancyDetected = status?.occupancy_detected ?? (pirMotion || irDetected || (distanceValid && distanceCm > 2 && distanceCm < 120));
  const idleSec = status?.idle_sec ?? 0;
  const autoCutoffCountdownSec = status?.auto_cutoff_countdown_sec ?? 0;
  const autoOffDelaySec = status?.auto_off_delay_sec ?? 300;
  const lastActionReason = status?.last_action_reason;
  const isHardwareCurrentActive = status?.hardware_current_active ?? (currentAmps > 0.05);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.container}>
        {/* App Title Bar */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={styles.appTitle}>
              ⚡ Smart Energy Meter
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ESP32 5V DC Prototype • Dual Bulbs & Sensor Automation
            </ThemedText>
          </View>
        </View>

        {/* 1. Connection & IP Bar */}
        <ConnectionBar
          ipAddress={ipAddress}
          onIpChange={setIpAddress}
          isConnected={isConnected}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        {/* 2. Real-Time 5V DC Power & Energy Overview (Wh & kWh) */}
        <PowerOverviewCard
          powerWatts={powerWatts}
          totalWh={totalWh}
          totalKwh={totalKwh}
          costEstimate={costEstimate}
          voltage={voltage}
          currentAmps={currentAmps}
          tariffRate={tariffRate}
          isHardwareCurrentActive={isHardwareCurrentActive}
        />

        {/* 3. Dual 5V DC Bulb Relay Control (Manual & Auto Aware) */}
        <RelayControlSection
          relay1={relay1}
          relay2={relay2}
          autoMode={autoMode}
          isSwitchingRelay={isSwitchingRelay}
          actionError={actionError}
          onToggleRelay={toggleRelay}
          onSetBothRelays={setBothRelays}
          onDismissError={dismissActionError}
        />

        {/* 4. Hardware Sensors Telemetry (IR, PIR, Ultrasonic) */}
        <SensorTelemetryGrid
          pirMotion={pirMotion}
          irDetected={irDetected}
          distanceCm={distanceCm}
          distanceValid={distanceValid}
          occupancyDetected={occupancyDetected}
        />

        {/* 5. Smart Automation & Occupancy Rules */}
        <SmartEcoBanner
          autoMode={autoMode}
          autoTarget={autoTarget}
          occupancyDetected={occupancyDetected}
          idleSec={idleSec}
          autoCutoffCountdownSec={autoCutoffCountdownSec}
          autoOffDelaySec={autoOffDelaySec}
          isRelayActive={relay1 || relay2}
          lastActionReason={lastActionReason}
          isSwitchingAutoMode={isSwitchingAutoMode}
          onToggleAutoMode={toggleAutoMode}
          onChangeAutoTarget={(target) => setAutoMode(true, target)}
        />

        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    paddingVertical: Spacing.two,
  },
  appTitle: {
    letterSpacing: -0.5,
  },
});
