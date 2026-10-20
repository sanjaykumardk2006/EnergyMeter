import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  currentPowerWatts: number;
}

export function PowerConsumptionChart({ currentPowerWatts }: Props) {
  const { colors, isDark } = useTheme();

  // 9 sample data points across 24h anchored by live current power
  const baseWatts = Math.max(0.5, currentPowerWatts > 0 ? currentPowerWatts : 4.3);
  const dataPoints = [
    { time: '00:00', watts: Math.max(0.2, baseWatts * 0.35).toFixed(1) },
    { time: '03:00', watts: Math.max(0.1, baseWatts * 0.2).toFixed(1) },
    { time: '06:00', watts: Math.max(0.5, baseWatts * 0.55).toFixed(1) },
    { time: '09:00', watts: Math.max(1.2, baseWatts * 0.85).toFixed(1) },
    { time: '12:00', watts: (baseWatts * 1.15).toFixed(1) },
    { time: '15:00', watts: (baseWatts * 0.95).toFixed(1) },
    { time: '18:00', watts: (baseWatts * 1.35).toFixed(1) },
    { time: '21:00', watts: baseWatts.toFixed(1) },
    { time: '24:00', watts: Math.max(0.4, baseWatts * 0.45).toFixed(1) },
  ];

  const maxScaleWatts = 10;
  const [selectedPoint, setSelectedPoint] = useState<number | null>(7);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}>
      <View style={styles.cardHeader}>
        <ThemedText style={[styles.cardTitle, { color: colors.text }]}>
          Power Consumption (W)
        </ThemedText>
        {selectedPoint !== null && (
          <View
            style={[
              styles.valueBadge,
              { backgroundColor: colors.primaryTint, borderColor: colors.primaryBorder },
            ]}>
            <ThemedText style={[styles.valueBadgeText, { color: colors.primary }]}>
              {dataPoints[selectedPoint].watts} W @ {dataPoints[selectedPoint].time}
            </ThemedText>
          </View>
        )}
      </View>

      {/* Chart Canvas Area */}
      <View style={styles.chartContainer}>
        {/* Y Axis Labels & Grid */}
        <View style={styles.yAxisCol}>
          <ThemedText style={[styles.axisLabel, { color: colors.textMuted }]}>10</ThemedText>
          <ThemedText style={[styles.axisLabel, { color: colors.textMuted }]}>8</ThemedText>
          <ThemedText style={[styles.axisLabel, { color: colors.textMuted }]}>6</ThemedText>
          <ThemedText style={[styles.axisLabel, { color: colors.textMuted }]}>4</ThemedText>
          <ThemedText style={[styles.axisLabel, { color: colors.textMuted }]}>2</ThemedText>
          <ThemedText style={[styles.axisLabel, { color: colors.textMuted }]}>0</ThemedText>
        </View>

        {/* Chart Plot Area */}
        <View style={styles.plotArea}>
          {/* Horizontal Grid lines */}
          <View style={[styles.gridLine, { top: '0%', backgroundColor: colors.divider }]} />
          <View style={[styles.gridLine, { top: '20%', backgroundColor: colors.divider }]} />
          <View style={[styles.gridLine, { top: '40%', backgroundColor: colors.divider }]} />
          <View style={[styles.gridLine, { top: '60%', backgroundColor: colors.divider }]} />
          <View style={[styles.gridLine, { top: '80%', backgroundColor: colors.divider }]} />
          <View style={[styles.gridLine, { top: '100%', backgroundColor: colors.divider }]} />

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
                  <Animated.View
                    entering={FadeInUp.duration(360).delay(idx * 35)}
                    style={[
                      styles.barFill,
                      {
                        height: `${heightPercent}%`,
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(16, 185, 129, 0.45)'
                            : 'rgba(5, 150, 105, 0.35)'
                          : isDark
                          ? 'rgba(16, 185, 129, 0.22)'
                          : 'rgba(5, 150, 105, 0.16)',
                        transform: [{ scale: isSelected ? 1.08 : 1 }],
                      },
                    ]}>
                    <View
                      style={[
                        styles.dotPoint,
                        { backgroundColor: colors.primary },
                        isSelected && [
                          styles.dotPointActive,
                          { backgroundColor: colors.primaryHover },
                        ],
                      ]}
                    />
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* X Axis Time Labels */}
      <View style={styles.xAxisRow}>
        <ThemedText style={[styles.xAxisLabel, { color: colors.textMuted }]}>00:00</ThemedText>
        <ThemedText style={[styles.xAxisLabel, { color: colors.textMuted }]}>06:00</ThemedText>
        <ThemedText style={[styles.xAxisLabel, { color: colors.textMuted }]}>12:00</ThemedText>
        <ThemedText style={[styles.xAxisLabel, { color: colors.textMuted }]}>18:00</ThemedText>
        <ThemedText style={[styles.xAxisLabel, { color: colors.textMuted }]}>24:00</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
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
  },
  valueBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  valueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
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
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    position: 'relative',
  },
  dotPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: -4,
  },
  dotPointActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    fontWeight: '500',
  },
});
