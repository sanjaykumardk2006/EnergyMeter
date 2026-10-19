import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';

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
  const { colors, isDark } = useTheme();
  const isNearby = distanceValid && distanceCm > 0 && distanceCm < 120;

  return (
    <ScrollView
      style={[styles.scrollArea, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <ColorfulIcon
          library="ionicons"
          name="hardware-chip"
          variant="violet"
          size={22}
          containerSize={46}
        />
        <View>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Sensor Readings
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Multi-sensor hardware telemetry from ESP32
          </ThemedText>
        </View>
      </View>

      <View style={styles.cardsList}>
        {/* 1. PIR Motion Sensor Card */}
        <View
          style={[
            styles.sensorCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <ColorfulIcon
                library="material"
                name="motion-sensor"
                variant={pirMotion ? 'violet' : 'slate'}
                size={22}
                containerSize={44}
              />
              <View>
                <ThemedText style={[styles.sensorName, { color: colors.text }]}>
                  PIR Motion Sensor
                </ThemedText>
                <ThemedText style={[styles.sensorDesc, { color: colors.textSecondary }]}>
                  Pyroelectric Body Detection
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: pirMotion
                    ? isDark
                      ? 'rgba(167, 139, 250, 0.2)'
                      : '#EDE9FE'
                    : isDark
                    ? colors.inputBg
                    : '#F1F5F9',
                },
              ]}>
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  { color: pirMotion ? '#7C3AED' : colors.textSecondary },
                ]}>
                {pirMotion ? '● Motion Active' : '● Clear'}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
            <ThemedText style={[styles.footerValText, { color: colors.textSecondary }]}>
              Pin GPIO27: {pirMotion ? 'HIGH (3.3V Triggered)' : 'LOW (0V Idle)'}
            </ThemedText>
            <ThemedText style={[styles.footerTimeText, { color: colors.textMuted }]}>
              Live Telemetry
            </ThemedText>
          </View>
        </View>

        {/* 2. IR Sensor Card */}
        <View
          style={[
            styles.sensorCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <ColorfulIcon
                library="material"
                name="radar"
                variant={irDetected ? 'rose' : 'slate'}
                size={22}
                containerSize={44}
              />
              <View>
                <ThemedText style={[styles.sensorName, { color: colors.text }]}>
                  IR Proximity Sensor
                </ThemedText>
                <ThemedText style={[styles.sensorDesc, { color: colors.textSecondary }]}>
                  Infrared Beam Reflection
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: irDetected
                    ? isDark
                      ? 'rgba(251, 113, 133, 0.2)'
                      : '#FFE4E6'
                    : isDark
                    ? colors.inputBg
                    : '#F1F5F9',
                },
              ]}>
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  { color: irDetected ? '#E11D48' : colors.textSecondary },
                ]}>
                {irDetected ? '● Beam Obstructed' : '● Path Clear'}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
            <ThemedText style={[styles.footerValText, { color: colors.textSecondary }]}>
              Pin GPIO26: {irDetected ? 'LOW (Active-LOW Detect)' : 'HIGH (Clear)'}
            </ThemedText>
            <ThemedText style={[styles.footerTimeText, { color: colors.textMuted }]}>
              Live Telemetry
            </ThemedText>
          </View>
        </View>

        {/* 3. Ultrasonic Sensor Card */}
        <View
          style={[
            styles.sensorCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <ColorfulIcon
                library="material"
                name="signal-distance-variant"
                variant="cyan"
                size={22}
                containerSize={44}
              />
              <View>
                <ThemedText style={[styles.sensorName, { color: colors.text }]}>
                  Ultrasonic Ranging
                </ThemedText>
                <ThemedText style={[styles.sensorDesc, { color: colors.textSecondary }]}>
                  HC-SR04 Sonar Echo Sensor
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark ? 'rgba(34, 211, 238, 0.15)' : '#E0F2FE',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(34, 211, 238, 0.3)' : '#BAE6FD',
                },
              ]}>
              <ThemedText style={[styles.statusBadgeText, { color: '#0284C7' }]}>
                {distanceValid ? `${distanceCm.toFixed(0)} cm` : 'Timeout'}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
            <ThemedText style={[styles.footerValText, { color: colors.textSecondary }]}>
              {distanceValid
                ? isNearby
                  ? 'Target in range (< 120cm)'
                  : 'Target clear (> 120cm)'
                : 'Echo timeout'}
            </ThemedText>
            <ThemedText style={[styles.footerTimeText, { color: colors.textMuted }]}>
              Live Telemetry
            </ThemedText>
          </View>
        </View>

        {/* 4. ACS712 Current Sensor Card */}
        <View
          style={[
            styles.sensorCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <ColorfulIcon
                library="material"
                name="sine-wave"
                variant="emerald"
                size={22}
                containerSize={44}
              />
              <View style={{ flex: 1, paddingRight: 6 }}>
                <ThemedText style={[styles.sensorName, { color: colors.text }]}>
                  ACS712 Current Sensor
                </ThemedText>
                <ThemedText style={[styles.sensorDesc, { color: colors.textSecondary }]}>
                  Combined Load (Light 1 + Light 2)
                </ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0',
                },
              ]}>
              <ThemedText style={[styles.statusBadgeText, { color: colors.primary }]}>
                {currentAmps.toFixed(2)} A
              </ThemedText>
            </View>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: colors.divider }]}>
            <ThemedText style={[styles.footerValText, { color: colors.textSecondary }]}>
              ADC1 CH6: {currentAmps > 0.05 ? 'Load Drawing Current' : 'Zero/Quiescent Load'}
            </ThemedText>
            <ThemedText style={[styles.footerTimeText, { color: colors.textMuted }]}>
              Live Telemetry
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  cardsList: {
    gap: 12,
  },
  sensorCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
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
  sensorName: {
    fontSize: 15,
    fontWeight: '700',
  },
  sensorDesc: {
    fontSize: 12,
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
  },
  footerValText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footerTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
