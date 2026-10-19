import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface Props {
  currentPowerWatts: number;
}

export function PowerConsumptionChart({ currentPowerWatts }: Props) {
  // 9 sample data points across 24h
  // Generate realistic curve anchored by live current power
  const baseWatts = Math.max(0.5, currentPowerWatts > 0 ? currentPowerWatts : 4.3);
  const dataPoints = [
    { time: '00:00', watts: Math.max(0.2, (baseWatts * 0.35)).toFixed(1) },
    { time: '03:00', watts: Math.max(0.1, (baseWatts * 0.2)).toFixed(1) },
    { time: '06:00', watts: Math.max(0.5, (baseWatts * 0.55)).toFixed(1) },
    { time: '09:00', watts: Math.max(1.2, (baseWatts * 0.85)).toFixed(1) },
    { time: '12:00', watts: (baseWatts * 1.15).toFixed(1) },
    { time: '15:00', watts: (baseWatts * 0.95).toFixed(1) },
    { time: '18:00', watts: (baseWatts * 1.35).toFixed(1) },
    { time: '21:00', watts: baseWatts.toFixed(1) },
    { time: '24:00', watts: Math.max(0.4, (baseWatts * 0.45)).toFixed(1) },
  ];

  const maxScaleWatts = 10;
  const [selectedPoint, setSelectedPoint] = useState<number | null>(7);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.cardTitle}>Power Consumption (W)</ThemedText>
        {selectedPoint !== null && (
          <View style={styles.valueBadge}>
            <ThemedText style={styles.valueBadgeText}>
              {dataPoints[selectedPoint].watts} W @ {dataPoints[selectedPoint].time}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Chart Canvas Area */}
      <View style={styles.chartContainer}>
        {/* Y Axis Labels & Grid */}
        <View style={styles.yAxisCol}>
          <ThemedText style={styles.axisLabel}>10</ThemedText>
          <ThemedText style={styles.axisLabel}>8</ThemedText>
          <ThemedText style={styles.axisLabel}>6</ThemedText>
          <ThemedText style={styles.axisLabel}>4</ThemedText>
          <ThemedText style={styles.axisLabel}>2</ThemedText>
          <ThemedText style={styles.axisLabel}>0</ThemedText>
        </View>

        {/* Chart Plot Area */}
        <View style={styles.plotArea}>
          {/* Horizontal Grid lines */}
          <View style={[styles.gridLine, { top: '0%' }]} />
          <View style={[styles.gridLine, { top: '20%' }]} />
          <View style={[styles.gridLine, { top: '40%' }]} />
          <View style={[styles.gridLine, { top: '60%' }]} />
          <View style={[styles.gridLine, { top: '80%' }]} />
          <View style={[styles.gridLine, { top: '100%' }]} />

          {/* Interactive Data Points and Connecting Bars */}
          <View style={styles.pointsRow}>
            {dataPoints.map((dp, idx) => {
              const val = parseFloat(dp.watts);
              const heightPercent = Math.min(100, Math.max(5, (val / maxScaleWatts) * 100));
              const isSelected = selectedPoint === idx;

              return (
                <Pressable
                  key={idx}
                  style={styles.colTouchArea}
                  onPress={() => setSelectedPoint(idx)}>
                  <View style={[styles.barFill, { height: `${heightPercent}%` }]}>
                    <View
                      style={[
                        styles.dotPoint,
                        isSelected && styles.dotPointActive,
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* X Axis Time Labels */}
      <View style={styles.xAxisRow}>
        <ThemedText style={styles.xAxisLabel}>00:00</ThemedText>
        <ThemedText style={styles.xAxisLabel}>06:00</ThemedText>
        <ThemedText style={styles.xAxisLabel}>12:00</ThemedText>
        <ThemedText style={styles.xAxisLabel}>18:00</ThemedText>
        <ThemedText style={styles.xAxisLabel}>24:00</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  valueBadge: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  valueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  chartContainer: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'stretch',
  },
  yAxisCol: {
    width: 24,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  axisLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  plotArea: {
    flex: 1,
    position: 'relative',
    marginLeft: 6,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  pointsRow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  colTouchArea: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.18)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    position: 'relative',
  },
  dotPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    position: 'absolute',
    top: -4,
  },
  dotPointActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1D4ED8',
    top: -6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 30,
    paddingRight: 6,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
