import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { PowerConsumptionChart } from './PowerConsumptionChart';

interface Props {
  voltage: number;
  currentAmps: number;
  powerWatts: number;
  totalKwh: number;
  costEstimate: number;
  tariffRate: number;
}

export function EnergyView({
  voltage,
  currentAmps,
  powerWatts,
  totalKwh,
  costEstimate,
  tariffRate,
}: Props) {
  const [filter, setFilter] = useState<'Live' | 'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Estimate active time based on energy consumed vs current power
  const activeHours = powerWatts > 0.05
    ? Math.max(0.5, (totalKwh * 1000) / Math.max(1, powerWatts))
    : 2.5;

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconCircle}>
          <ThemedText style={styles.headerIcon}>🗓️</ThemedText>
        </View>
        <View>
          <ThemedText style={styles.headerTitle}>Energy Monitoring</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Track your consumption
          </ThemedText>
        </View>
      </View>

      {/* 2x2 Telemetry Grid */}
      <View style={styles.metricsGrid}>
        {/* Voltage */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <ThemedText style={styles.metricIcon}>⚡</ThemedText>
          </View>
          <ThemedText style={styles.metricLabel}>Voltage</ThemedText>
          <ThemedText style={styles.metricNumber}>
            {voltage.toFixed(2)} V
          </ThemedText>
          <ThemedText style={styles.metricSub}>DC Supply</ThemedText>
        </View>

        {/* Current */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <ThemedText style={styles.metricIcon}>📈</ThemedText>
          </View>
          <ThemedText style={styles.metricLabel}>Current</ThemedText>
          <ThemedText style={styles.metricNumber}>
            {currentAmps.toFixed(2)} A
          </ThemedText>
          <ThemedText style={styles.metricSub}>Total Load</ThemedText>
        </View>

        {/* Power */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#FFFBEB' }]}>
            <ThemedText style={styles.metricIcon}>📊</ThemedText>
          </View>
          <ThemedText style={styles.metricLabel}>Power</ThemedText>
          <ThemedText style={styles.metricNumber}>
            {powerWatts.toFixed(2)} W
          </ThemedText>
          <ThemedText style={styles.metricSub}>Voltage × Current</ThemedText>
        </View>

        {/* Energy */}
        <View style={styles.metricCard}>
          <View style={[styles.metricIconCircle, { backgroundColor: '#F5F3FF' }]}>
            <ThemedText style={styles.metricIcon}>🔋</ThemedText>
          </View>
          <ThemedText style={styles.metricLabel}>Energy</ThemedText>
          <ThemedText style={styles.metricNumber}>
            {totalKwh.toFixed(3)} kWh
          </ThemedText>
          <ThemedText style={styles.metricSub}>Total Consumption</ThemedText>
        </View>
      </View>

      {/* Time Range Filter Buttons */}
      <View style={styles.filterRow}>
        {(['Live', 'Daily', 'Weekly', 'Monthly'] as const).map((item) => {
          const isSelected = filter === item;
          return (
            <Pressable
              key={item}
              style={[
                styles.filterBtn,
                isSelected && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(item)}>
              <ThemedText
                style={[
                  styles.filterBtnText,
                  isSelected && styles.filterBtnTextActive,
                ]}>
                {item}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* Power Consumption (W) Chart */}
      <PowerConsumptionChart currentPowerWatts={powerWatts} />

      {/* Bottom Summary Stats Cards */}
      <View style={styles.bottomStatsRow}>
        {/* Estimated Cost Card */}
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <ThemedText style={styles.summaryIcon}>🍃</ThemedText>
          </View>
          <View>
            <ThemedText style={styles.summaryLabel}>Estimated Cost</ThemedText>
            <ThemedText style={styles.summaryNumber}>
              ₹{costEstimate.toFixed(2)}
            </ThemedText>
            <ThemedText style={styles.summarySub}>
              Today @ ₹{tariffRate.toFixed(1)}/kWh
            </ThemedText>
          </View>
        </View>

        {/* Active Time Card */}
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIconCircle, { backgroundColor: '#F5F3FF' }]}>
            <ThemedText style={styles.summaryIcon}>📊</ThemedText>
          </View>
          <View>
            <ThemedText style={styles.summaryLabel}>Active Time</ThemedText>
            <ThemedText style={styles.summaryNumber}>
              {activeHours.toFixed(1)} hours
            </ThemedText>
            <ThemedText style={styles.summarySub}>Today</ThemedText>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '47%',
    flexGrow: 1,
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
    gap: 4,
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricIcon: {
    fontSize: 18,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
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
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIcon: {
    fontSize: 18,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginVertical: 1,
  },
  summarySub: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
