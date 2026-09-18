import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  powerWatts: number;
  totalKwh: number;
  costEstimate: number;
  voltage: number;
  currentAmps: number;
  tariffRate: number;
}

export function PowerOverviewCard({
  powerWatts,
  totalKwh,
  costEstimate,
  voltage,
  currentAmps,
  tariffRate,
}: Props) {
  const theme = useTheme();

  const isPowerActive = powerWatts > 0;
  const glowColor = isPowerActive ? '#00E5FF' : '#6B7280';

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <ThemedText type="smallBold" style={styles.titleLabel}>
            REAL-TIME POWER CONSUMPTION
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Active Appliance Load
          </ThemedText>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: isPowerActive ? 'rgba(0, 229, 255, 0.15)' : 'rgba(107, 114, 128, 0.15)' },
          ]}>
          <View style={[styles.pulsingDot, { backgroundColor: glowColor }]} />
          <ThemedText
            style={[styles.pillText, { color: glowColor }]}>
            {isPowerActive ? 'ACTIVE LOAD' : 'IDLE / STANDBY'}
          </ThemedText>
        </View>
      </View>

      {/* Big Power Readout */}
      <View style={styles.heroPowerRow}>
        <View style={styles.powerValueWrapper}>
          <ThemedText style={[styles.heroPowerNumber, { color: isPowerActive ? glowColor : theme.text }]}>
            {powerWatts.toFixed(1)}
          </ThemedText>
          <ThemedText style={styles.heroPowerUnit} themeColor="textSecondary">
            WATTS
          </ThemedText>
        </View>

        <View style={styles.subStatsCol}>
          <View style={styles.subStatItem}>
            <ThemedText type="small" themeColor="textSecondary">
              Voltage
            </ThemedText>
            <ThemedText type="smallBold">{voltage.toFixed(0)} V</ThemedText>
          </View>
          <View style={styles.subStatItem}>
            <ThemedText type="small" themeColor="textSecondary">
              Current
            </ThemedText>
            <ThemedText type="smallBold">{currentAmps.toFixed(2)} A</ThemedText>
          </View>
        </View>
      </View>

      {/* Cumulative Energy & Cost Grid */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Cumulative Energy
          </ThemedText>
          <ThemedText style={styles.metricBig}>
            {totalKwh.toFixed(4)}
          </ThemedText>
          <ThemedText type="small" style={{ color: '#10B981', fontWeight: '600' }}>
            kWh units
          </ThemedText>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Estimated Cost
          </ThemedText>
          <ThemedText style={styles.metricBig}>
            ₹ {costEstimate.toFixed(2)}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            @ ₹{tariffRate.toFixed(1)}/unit
          </ThemedText>
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
  titleLabel: {
    letterSpacing: 0.8,
    color: '#0284C7',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroPowerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: Spacing.two,
  },
  powerValueWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroPowerNumber: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  heroPowerUnit: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  subStatsCol: {
    gap: 6,
    alignItems: 'flex-end',
  },
  subStatItem: {
    alignItems: 'flex-end',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: 4,
  },
  metricBig: {
    fontSize: 20,
    fontWeight: '800',
  },
});
