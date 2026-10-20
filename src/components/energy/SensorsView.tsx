import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';

interface Props {
  pirMotion: boolean;
  irDetected: boolean;
  distanceCm: number;
  distanceValid: boolean;
  currentAmps: number;
  autoMode?: boolean;
  relay1?: boolean;
  relay2?: boolean;
  onSimulateSensorTrigger?: (sensor: 'pir' | 'ir' | 'ultrasonic' | 'clear') => void;
}

export function SensorsView({
  pirMotion,
  irDetected,
  distanceCm,
  distanceValid,
  currentAmps,
  autoMode = false,
  relay1 = false,
  relay2 = false,
  onSimulateSensorTrigger,
}: Props) {
  const { colors, isDark } = useTheme();
  const isNearby = distanceValid && distanceCm > 0 && distanceCm < 120;
  const distPercent = distanceValid ? Math.min(100, Math.max(4, (distanceCm / 200) * 100)) : 0;
  const isOccupied = pirMotion || irDetected || isNearby;

  return (
    <ScrollView
      style={[styles.scrollArea, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <Animated.View
        entering={FadeInDown.duration(320).delay(20)}
        style={styles.headerRow}>
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
      </Animated.View>

      {/* Smart Control Automation Logic Status Banner */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(50)}
        style={[
          styles.ruleBanner,
          {
            backgroundColor: isOccupied
              ? isDark
                ? 'rgba(16, 185, 129, 0.15)'
                : '#ECFDF5'
              : isDark
              ? 'rgba(239, 68, 68, 0.12)'
              : '#FEF2F2',
            borderColor: isOccupied
              ? colors.primaryBorder
              : isDark
              ? 'rgba(239, 68, 68, 0.35)'
              : '#FECACA',
          },
        ]}>
        <View style={styles.ruleBannerContent}>
          <ColorfulIcon
            library="material"
            name={isOccupied ? 'motion-sensor' : 'sleep'}
            variant={isOccupied ? 'emerald' : 'rose'}
            size={20}
            containerSize={38}
          />
          <View style={{ flex: 1 }}>
            <ThemedText
              style={[
                styles.ruleBannerTitle,
                { color: isOccupied ? colors.primary : '#EF4444' },
              ]}>
              {isOccupied
                ? 'Presence Detected • Smart Lights Active'
                : 'All Sensors Clear • Loads Automatically OFF'}
            </ThemedText>
            <ThemedText
              style={[
                styles.ruleBannerSub,
                { color: isOccupied ? colors.primaryHover : colors.textMuted },
              ]}>
              {autoMode
                ? isOccupied
                  ? `Sensors active -> Light 1 ${relay1 ? 'ON (Glowing)' : 'OFF'}, Light 2 ${relay2 ? 'ON (Glowing)' : 'OFF'}`
                  : 'PIR, IR & HC-SR04 detect nothing -> Auto-cutoff turned all loads OFF.'
                : `Manual Mode Active -> Light 1: ${relay1 ? 'ON' : 'OFF'}, Light 2: ${relay2 ? 'ON' : 'OFF'}`}
            </ThemedText>
          </View>
        </View>

        {onSimulateSensorTrigger && (
          <View style={[styles.testRow, { borderTopColor: colors.divider }]}>
            <ThemedText style={[styles.testHeading, { color: colors.textSecondary }]}>
              Simulate Sensors:
            </ThemedText>
            <View style={styles.testButtons}>
              <Pressable
                style={[
                  styles.testBtn,
                  pirMotion
                    ? { backgroundColor: '#7C3AED', borderColor: '#A78BFA' }
                    : { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                onPress={() => onSimulateSensorTrigger('pir')}>
                <ThemedText
                  style={[
                    styles.testBtnText,
                    { color: pirMotion ? '#FFFFFF' : colors.textSecondary },
                  ]}>
                  PIR {pirMotion ? 'ON' : 'OFF'}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.testBtn,
                  irDetected
                    ? { backgroundColor: '#E11D48', borderColor: '#FDA4AF' }
                    : { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                onPress={() => onSimulateSensorTrigger('ir')}>
                <ThemedText
                  style={[
                    styles.testBtnText,
                    { color: irDetected ? '#FFFFFF' : colors.textSecondary },
                  ]}>
                  IR {irDetected ? 'ON' : 'OFF'}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.testBtn,
                  distanceCm > 0 && distanceCm <= 50
                    ? { backgroundColor: '#0284C7', borderColor: '#7DD3FC' }
                    : { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                onPress={() => onSimulateSensorTrigger('ultrasonic')}>
                <ThemedText
                  style={[
                    styles.testBtnText,
                    { color: distanceCm > 0 && distanceCm <= 50 ? '#FFFFFF' : colors.textSecondary },
                  ]}>
                  US {distanceCm > 0 && distanceCm <= 50 ? 'Near' : 'Far'}
                </ThemedText>
              </Pressable>

              <Pressable
                style={[styles.testBtn, { backgroundColor: '#DC2626', borderColor: '#FCA5A5' }]}
                onPress={() => onSimulateSensorTrigger('clear')}>
                <ThemedText style={[styles.testBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                  Clear All
                </ThemedText>
              </Pressable>
            </View>
          </View>
        )}
      </Animated.View>

      <View style={styles.cardsList}>
        {/* 1. PIR Motion Sensor Card */}
        <Animated.View
          entering={FadeInDown.duration(340).delay(60)}
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
        </Animated.View>

        {/* 2. IR Sensor Card */}
        <Animated.View
          entering={FadeInDown.duration(340).delay(110)}
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
        </Animated.View>

        {/* 3. Ultrasonic Sensor Card */}
        <Animated.View
          entering={FadeInDown.duration(340).delay(160)}
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

          {/* Proximity Gauge Bar */}
          <View style={styles.gaugeContainer}>
            <View style={[styles.gaugeTrack, { backgroundColor: isDark ? colors.inputBg : '#E2E8F0' }]}>
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${distPercent}%`,
                    backgroundColor: !distanceValid
                      ? colors.textMuted
                      : distanceCm < 50
                      ? '#EF4444'
                      : distanceCm < 120
                      ? '#0284C7'
                      : '#10B981',
                  },
                ]}
              />
            </View>
            <View style={styles.gaugeLabels}>
              <ThemedText style={[styles.gaugeSub, { color: colors.textMuted }]}>0 cm (Near)</ThemedText>
              <ThemedText style={[styles.gaugeSub, { color: colors.textMuted }]}>200 cm (Far)</ThemedText>
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
        </Animated.View>

        {/* 4. ACS712 Current Sensor Card */}
        <Animated.View
          entering={FadeInDown.duration(340).delay(210)}
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
        </Animated.View>
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
  gaugeContainer: {
    gap: 6,
    paddingVertical: 4,
  },
  gaugeTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  ruleBanner: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  ruleBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ruleBannerTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  ruleBannerSub: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  testRow: {
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  testHeading: {
    fontSize: 11,
    fontWeight: '600',
  },
  testButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  testBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  testBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
