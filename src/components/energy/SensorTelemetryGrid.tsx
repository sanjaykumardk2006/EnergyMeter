import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  pirMotion: boolean;
  irDetected: boolean;
  distanceCm: number;
}

export function SensorTelemetryGrid({
  pirMotion,
  irDetected,
  distanceCm,
}: Props) {
  const theme = useTheme();

  // Normalize distance for progress bar (max 200cm range)
  const clampedDist = Math.max(0, Math.min(200, distanceCm));
  const distPercent = (clampedDist / 200) * 100;

  const isHumanPresent = pirMotion || irDetected || distanceCm < 120;

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            HARDWARE SENSORS & OCCUPANCY
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Live Telemetry from ESP32 GPIOs
          </ThemedText>
        </View>

        <View
          style={[
            styles.occupancyBadge,
            { backgroundColor: isHumanPresent ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)' },
          ]}>
          <ThemedText
            style={[
              styles.occupancyText,
              { color: isHumanPresent ? '#10B981' : theme.textSecondary },
            ]}>
            {isHumanPresent ? '👤 OCCUPIED' : '💤 ROOM EMPTY'}
          </ThemedText>
        </View>
      </View>

      {/* Sensor Cards Row */}
      <View style={styles.sensorGrid}>
        {/* PIR Sensor Card */}
        <View style={[styles.sensorCard, { backgroundColor: theme.background }]}>
          <View style={styles.pinHeader}>
            <ThemedText style={styles.sensorIcon}>🚶</ThemedText>
            <View style={styles.pinPill}>
              <ThemedText style={styles.pinPillText}>GPIO 27</ThemedText>
            </View>
          </View>
          <ThemedText type="smallBold">PIR Motion</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Human Detection
          </ThemedText>
          <View
            style={[
              styles.statePill,
              { backgroundColor: pirMotion ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)' },
            ]}>
            <View
              style={[
                styles.smallDot,
                { backgroundColor: pirMotion ? '#10B981' : '#64748B' },
              ]}
            />
            <ThemedText
              style={[
                styles.statePillText,
                { color: pirMotion ? '#10B981' : '#94A3B8' },
              ]}>
              {pirMotion ? 'MOTION' : 'CLEAR'}
            </ThemedText>
          </View>
        </View>

        {/* IR Sensor Card */}
        <View style={[styles.sensorCard, { backgroundColor: theme.background }]}>
          <View style={styles.pinHeader}>
            <ThemedText style={styles.sensorIcon}>📡</ThemedText>
            <View style={styles.pinPill}>
              <ThemedText style={styles.pinPillText}>GPIO 26</ThemedText>
            </View>
          </View>
          <ThemedText type="smallBold">IR Obstacle</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Proximity / Beam
          </ThemedText>
          <View
            style={[
              styles.statePill,
              { backgroundColor: irDetected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(100, 116, 139, 0.2)' },
            ]}>
            <View
              style={[
                styles.smallDot,
                { backgroundColor: irDetected ? '#F59E0B' : '#64748B' },
              ]}
            />
            <ThemedText
              style={[
                styles.statePillText,
                { color: irDetected ? '#F59E0B' : '#94A3B8' },
              ]}>
              {irDetected ? 'TRIGGERED' : 'CLEAR'}
            </ThemedText>
          </View>
        </View>

        {/* HC-SR04 Ultrasonic Distance Card */}
        <View style={[styles.sensorCard, { backgroundColor: theme.background }]}>
          <View style={styles.pinHeader}>
            <ThemedText style={styles.sensorIcon}>📏</ThemedText>
            <View style={styles.pinPill}>
              <ThemedText style={styles.pinPillText}>T:5 E:18</ThemedText>
            </View>
          </View>
          <ThemedText type="smallBold">HC-SR04</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Distance
          </ThemedText>
          <View style={styles.distValueWrapper}>
            <ThemedText style={styles.distNumber}>
              {distanceCm.toFixed(1)}
            </ThemedText>
            <ThemedText style={styles.distUnit}>cm</ThemedText>
          </View>
        </View>
      </View>

      {/* Ultrasonic Visual Distance Bar */}
      <View style={[styles.distBarContainer, { backgroundColor: theme.background }]}>
        <View style={styles.distBarHeader}>
          <ThemedText type="small" themeColor="textSecondary">
            Ultrasonic Proximity Range
          </ThemedText>
          <ThemedText type="smallBold">
            {distanceCm < 50 ? 'Near (< 50cm)' : distanceCm < 120 ? 'Mid Range' : 'Clear (> 1.2m)'}
          </ThemedText>
        </View>
        <View style={styles.distTrack}>
          <View
            style={[
              styles.distFill,
              {
                width: `${distPercent}%`,
                backgroundColor: distanceCm < 50 ? '#EF4444' : distanceCm < 120 ? '#F59E0B' : '#10B981',
              },
            ]}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    letterSpacing: 0.8,
    color: '#0284C7',
  },
  occupancyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  occupancyText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sensorCard: {
    flex: 1,
    minWidth: 90,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    gap: 4,
  },
  pinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sensorIcon: {
    fontSize: 20,
  },
  pinPill: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
  },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  smallDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  distValueWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginTop: 4,
  },
  distNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
  },
  distUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  distBarContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  distBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    overflow: 'hidden',
  },
  distFill: {
    height: '100%',
    borderRadius: 4,
  },
});
