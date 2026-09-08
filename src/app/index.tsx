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
    isMockMode,
    setIsMockMode,
    isLoading,
    refresh,
    toggleRelay,
    toggleAutoMode,
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
  const costEstimate = status?.cost_estimate ?? 0;
  const voltage = status?.voltage ?? 230;
  const currentAmps = status?.current_amps ?? 0;
  const tariffRate = status?.tariff_rate ?? 8;
  const relay1 = status?.relay1 ?? false;
  const relay2 = status?.relay2 ?? false;
  const load1Watts = status?.load1_watts ?? 60;
  const load2Watts = status?.load2_watts ?? 1200;
  const pirMotion = status?.pir_motion ?? false;
  const irDetected = status?.ir_detected ?? false;
  const distanceCm = status?.distance_cm ?? 0;
  const autoMode = status?.auto_mode ?? true;
  const idleSec = status?.idle_sec ?? 0;
  const autoCutoffCountdownSec = status?.auto_cutoff_countdown_sec ?? 0;
  const autoOffDelaySec = status?.auto_off_delay_sec ?? 180;

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
              ⚡ Energy Meter
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              ESP32 Smart Telemetry & Relay Automation
            </ThemedText>
          </View>
        </View>

        {/* 1. Connection & IP Bar */}
        <ConnectionBar
          ipAddress={ipAddress}
          onIpChange={setIpAddress}
          isConnected={isConnected}
          isMockMode={isMockMode}
          onToggleMockMode={setIsMockMode}
          onRefresh={refresh}
          isLoading={isLoading}
        />

        {/* 2. Real-Time Power & Energy Overview */}
        <PowerOverviewCard
          powerWatts={powerWatts}
          totalKwh={totalKwh}
          costEstimate={costEstimate}
          voltage={voltage}
          currentAmps={currentAmps}
          tariffRate={tariffRate}
        />

        {/* 3. Dual Relay Control */}
        <RelayControlSection
          relay1={relay1}
          relay2={relay2}
          load1Watts={load1Watts}
          load2Watts={load2Watts}
          onToggleRelay={toggleRelay}
        />

        {/* 4. Hardware Sensors Telemetry (IR, PIR, Ultrasonic) */}
        <SensorTelemetryGrid
          pirMotion={pirMotion}
          irDetected={irDetected}
          distanceCm={distanceCm}
        />

        {/* 5. Smart Eco Auto-Cutoff Mode */}
        <SmartEcoBanner
          autoMode={autoMode}
          onToggleAutoMode={toggleAutoMode}
          idleSec={idleSec}
          autoCutoffCountdownSec={autoCutoffCountdownSec}
          autoOffDelaySec={autoOffDelaySec}
          isRelayActive={relay1 || relay2}
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
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
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
