import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';
import { PowerConsumptionChart } from './PowerConsumptionChart';

interface Props {
  voltage: number;
  hardwareVoltageActive?: boolean;
  currentAmps: number;
  powerWatts: number;
  totalKwh: number;
  costEstimate: number;
  tariffRate: number;
  isConnected?: boolean;
  loadActiveSec?: number;
  relay1?: boolean;
  relay2?: boolean;
}

export function EnergyView({
  voltage,
  hardwareVoltageActive = false,
  currentAmps,
  powerWatts,
  totalKwh,
  costEstimate,
  tariffRate,
  isConnected = false,
  loadActiveSec = 0,
  relay1 = false,
  relay2 = false,
}: Props) {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'Live' | 'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Accurately calculated active hours based on hardware tracking and load state
  const activeHours = isConnected ? (loadActiveSec / 3600) : 0;

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
          name="analytics"
          variant="cyan"
          size={22}
          containerSize={46}
        />
        <View>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
            Energy Analytics
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Real-time power consumption and expenditure
          </ThemedText>
        </View>
      </Animated.View>

      {/* 2x2 Telemetry Grid with Colorful Badges */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(60)}
        style={styles.metricsGrid}>
        {/* Voltage */}
        <Animated.View
          entering={FadeInUp.duration(300).delay(100)}
          style={[
            styles.metricCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <ColorfulIcon
            library="ionicons"
            name="flash"
            variant="amber"
            size={18}
            containerSize={36}
            style={{ marginBottom: 6 }}
          />
          <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Voltage
          </ThemedText>
          <ThemedText style={[styles.metricNumber, { color: colors.text }]}>
            {isConnected ? voltage.toFixed(2) : '0.00'} V
          </ThemedText>
          <ThemedText style={[styles.metricSub, { color: hardwareVoltageActive ? '#D97706' : colors.textMuted }]}>
            {isConnected ? (hardwareVoltageActive ? 'GPIO 35 • Live Rail' : 'No Voltage (Standby)') : 'Hardware Disconnected'}
          </ThemedText>
        </Animated.View>

        {/* Current */}
        <Animated.View
          entering={FadeInUp.duration(300).delay(140)}
          style={[
            styles.metricCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <ColorfulIcon
            library="material"
            name="sine-wave"
            variant="cyan"
            size={18}
            containerSize={36}
            style={{ marginBottom: 6 }}
          />
          <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Current
          </ThemedText>
          <ThemedText style={[styles.metricNumber, { color: colors.text }]}>
            {isConnected ? currentAmps.toFixed(2) : '0.00'} A
          </ThemedText>
          <ThemedText style={[styles.metricSub, { color: colors.textMuted }]}>
            {isConnected ? 'Total Load' : 'Hardware Disconnected'}
          </ThemedText>
        </Animated.View>

        {/* Power */}
        <Animated.View
          entering={FadeInUp.duration(300).delay(180)}
          style={[
            styles.metricCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <ColorfulIcon
            library="ionicons"
            name="speedometer"
            variant="orange"
            size={18}
            containerSize={36}
            style={{ marginBottom: 6 }}
          />
          <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Power
          </ThemedText>
          <ThemedText style={[styles.metricNumber, { color: colors.text }]}>
            {isConnected ? powerWatts.toFixed(2) : '0.00'} W
          </ThemedText>
          <ThemedText style={[styles.metricSub, { color: colors.textMuted }]}>
            {isConnected ? 'Voltage × Current' : 'Hardware Disconnected'}
          </ThemedText>
        </Animated.View>

        {/* Energy */}
        <Animated.View
          entering={FadeInUp.duration(300).delay(220)}
          style={[
            styles.metricCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <ColorfulIcon
            library="ionicons"
            name="battery-charging"
            variant="violet"
            size={18}
            containerSize={36}
            style={{ marginBottom: 6 }}
          />
          <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Energy
          </ThemedText>
          <ThemedText style={[styles.metricNumber, { color: colors.text }]}>
            {isConnected ? totalKwh.toFixed(3) : '0.000'} kWh
          </ThemedText>
          <ThemedText style={[styles.metricSub, { color: colors.textMuted }]}>
            {isConnected ? 'Total Accumulation' : 'Hardware Disconnected'}
          </ThemedText>
        </Animated.View>
      </Animated.View>

      {/* Time Range Filter Buttons */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(130)}
        style={[styles.filterRow, { backgroundColor: colors.segmentBg }]}>
        {(['Live', 'Daily', 'Weekly', 'Monthly'] as const).map((item) => {
          const isSelected = filter === item;
          return (
            <Pressable
              key={item}
              style={({ pressed }) => [
                styles.filterBtn,
                isSelected && [styles.filterBtnActive, { backgroundColor: colors.primary }],
                pressed && { transform: [{ scale: 0.95 }], opacity: 0.8 },
              ]}
              onPress={() => setFilter(item)}>
              <ThemedText
                style={[
                  styles.filterBtnText,
                  { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                  isSelected && styles.filterBtnTextActive,
                ]}>
                {item}
              </ThemedText>
            </Pressable>
          );
        })}
      </Animated.View>

      {/* Power Consumption (W) Chart */}
      <Animated.View entering={FadeInDown.duration(340).delay(180)}>
        <PowerConsumptionChart currentPowerWatts={powerWatts} filter={filter} isConnected={isConnected} />
      </Animated.View>

      {/* Bottom Summary Stats Cards with Colorful Icons */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(230)}
        style={styles.bottomStatsRow}>
        {/* Estimated Cost Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <ColorfulIcon
            library="ionicons"
            name="wallet"
            variant="emerald"
            size={20}
            containerSize={42}
          />
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Estimated Cost
            </ThemedText>
            <ThemedText style={[styles.summaryNumber, { color: colors.text }]}>
              {isConnected ? `₹${costEstimate.toFixed(2)}` : '₹0.00'}
            </ThemedText>
            <ThemedText style={[styles.summarySub, { color: colors.textMuted }]}>
              {isConnected ? `Today @ ₹${tariffRate.toFixed(1)}/kWh` : 'Hardware Disconnected'}
            </ThemedText>
          </View>
        </View>

        {/* Active Time Card */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}>
          <ColorfulIcon
            library="ionicons"
            name="hourglass"
            variant="rose"
            size={20}
            containerSize={42}
          />
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Active Time
            </ThemedText>
            <ThemedText style={[styles.summaryNumber, { color: colors.text }]}>
              {isConnected ? `${activeHours.toFixed(1)} hours` : '0.0 hours'}
            </ThemedText>
            <ThemedText style={[styles.summarySub, { color: colors.textMuted }]}>
              {isConnected ? (relay1 || relay2 ? 'Loads Currently Active' : 'Loads Standby / Idle') : 'Hardware Disconnected'}
            </ThemedText>
          </View>
        </View>
      </Animated.View>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    gap: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  filterBtnActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterBtnTextActive: {
    fontWeight: '700',
  },
  bottomStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 1,
  },
  summarySub: {
    fontSize: 10,
  },
});
