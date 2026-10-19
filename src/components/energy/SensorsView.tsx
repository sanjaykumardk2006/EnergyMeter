import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface Props {
  pirMotion: boolean;
  irDetected: boolean;
  distanceCm: number;
  distanceValid: boolean;
  currentAmps: number;
}

export function SensorsView({
  pirMotion,
  irDetected,
  distanceCm,
  distanceValid,
  currentAmps,
}: Props) {
  const isNearby = distanceValid && distanceCm > 0 && distanceCm < 120;

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconCircle}>
          <ThemedText style={styles.headerIcon}>📈</ThemedText>
        </View>
        <View>
          <ThemedText style={styles.headerTitle}>Sensor Readings</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Real-time sensor data from ESP32
          </ThemedText>
        </View>
      </View>

      <View style={styles.cardsList}>
        {/* 1. PIR Sensor Card */}
        <View style={styles.sensorCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <View style={[styles.sensorIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <ThemedText style={styles.sensorIcon}>🏃</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.sensorName}>PIR Sensor</ThemedText>
                <ThemedText style={styles.sensorDesc}>Motion Detection</ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: pirMotion ? '#DCFCE7' : '#F1F5F9' },
              ]}>
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  { color: pirMotion ? '#15803D' : '#64748B' },
                ]}>
                {pirMotion ? 'Detected' : 'Clear'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <ThemedText style={styles.footerValText}>
              Value: {pirMotion ? 'HIGH (3.3V)' : 'LOW (0V)'}
            </ThemedText>
            <ThemedText style={styles.footerTimeText}>
              Last updated: 2 sec ago
            </ThemedText>
          </View>
        </View>

        {/* 2. IR Sensor Card */}
        <View style={styles.sensorCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <View style={[styles.sensorIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <ThemedText style={styles.sensorIcon}>📶</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.sensorName}>IR Sensor</ThemedText>
                <ThemedText style={styles.sensorDesc}>Object Detection</ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: irDetected ? '#DCFCE7' : '#F1F5F9' },
              ]}>
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  { color: irDetected ? '#15803D' : '#64748B' },
                ]}>
                {irDetected ? 'Detected' : 'Clear'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <ThemedText style={styles.footerValText}>
              Value: {irDetected ? 'LOW (Active-LOW)' : 'HIGH (Clear)'}
            </ThemedText>
            <ThemedText style={styles.footerTimeText}>
              Last updated: 2 sec ago
            </ThemedText>
          </View>
        </View>

        {/* 3. Ultrasonic Sensor Card */}
        <View style={styles.sensorCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <View style={[styles.sensorIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <ThemedText style={styles.sensorIcon}>📡</ThemedText>
              </View>
              <View>
                <ThemedText style={styles.sensorName}>Ultrasonic Sensor</ThemedText>
                <ThemedText style={styles.sensorDesc}>Distance Measurement</ThemedText>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: '#DBEAFE' }]}>
              <ThemedText style={[styles.statusBadgeText, { color: '#1D4ED8' }]}>
                {distanceValid ? `${distanceCm.toFixed(0)} cm` : 'Timeout'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <ThemedText style={styles.footerValText}>
              {distanceValid ? (isNearby ? 'Object Nearby' : 'Clear Range') : 'Echo Timeout'}
            </ThemedText>
            <ThemedText style={styles.footerTimeText}>
              Last updated: 2 sec ago
            </ThemedText>
          </View>
        </View>

        {/* 4. Current Sensor Card */}
        <View style={styles.sensorCard}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <View style={[styles.sensorIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <ThemedText style={styles.sensorIcon}>⚡</ThemedText>
              </View>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <ThemedText style={styles.sensorName}>Current Sensor</ThemedText>
                <ThemedText style={styles.sensorDesc}>
                  Total Current (Load 1 + Load 2)
                </ThemedText>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: '#EDE9FE' }]}>
              <ThemedText style={[styles.statusBadgeText, { color: '#6D28D9' }]}>
                {currentAmps.toFixed(2)} A
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <ThemedText style={styles.footerValText}>
              {currentAmps > 0.05 ? 'Active Load' : 'Normal Standby'}
            </ThemedText>
            <ThemedText style={styles.footerTimeText}>
              Last updated: 2 sec ago
            </ThemedText>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    padding: 18,
    paddingBottom: 28,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  cardsList: {
    gap: 12,
  },
  sensorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sensorIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorIcon: {
    fontSize: 22,
  },
  sensorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sensorDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerValText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  footerTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
