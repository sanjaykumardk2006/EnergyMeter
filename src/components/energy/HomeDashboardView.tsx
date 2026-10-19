import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface Props {
  autoMode: boolean;
  occupancyDetected: boolean;
  relay1: boolean;
  relay2: boolean;
  voltage: number;
  currentAmps: number;
  powerWatts: number;
  totalKwh: number;
  autoOffDelaySec: number;
  onToggleAutoMode: () => void;
  onToggleRelay1: () => void;
  onToggleRelay2: () => void;
  onOpenLoadDetail: (id: 1 | 2) => void;
  onOpenSettings: () => void;
  onOpenSystemStatus: () => void;
}

export function HomeDashboardView({
  autoMode,
  occupancyDetected,
  relay1,
  relay2,
  voltage,
  currentAmps,
  powerWatts,
  totalKwh,
  autoOffDelaySec,
  onToggleAutoMode,
  onToggleRelay1,
  onToggleRelay2,
  onOpenLoadDetail,
  onOpenSettings,
  onOpenSystemStatus,
}: Props) {
  const timeoutMins = Math.round(autoOffDelaySec / 60);

  return (
    <ScrollView
      style={styles.scrollArea}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* 1. Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View style={styles.lightningIconCircle}>
            <ThemedText style={styles.lightningIcon}>⚡</ThemedText>
          </View>
          <View>
            <ThemedText style={styles.appTitle}>Smart Energy</ThemedText>
            <ThemedText style={styles.appSubtitle}>
              Efficient Living, Greener Tomorrow
            </ThemedText>
          </View>
        </View>

        <Pressable style={styles.settingsIconBtn} onPress={onOpenSystemStatus}>
          <ThemedText style={styles.gearIcon}>⚙️</ThemedText>
        </Pressable>
      </View>

      {/* 2. Operation Mode Selector (Manual vs Automatic) */}
      <View style={styles.modeSelectorContainer}>
        <Pressable
          style={[
            styles.modeSegment,
            !autoMode && styles.modeSegmentActive,
          ]}
          onPress={() => {
            if (autoMode) onToggleAutoMode();
          }}>
          <ThemedText style={styles.modeIcon}>✋</ThemedText>
          <ThemedText
            style={[
              styles.modeSegmentText,
              !autoMode && styles.modeSegmentTextActive,
            ]}>
            Manual Mode
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.modeSegment,
            autoMode && styles.modeSegmentActive,
          ]}
          onPress={() => {
            if (!autoMode) onToggleAutoMode();
          }}>
          <ThemedText style={styles.modeIcon}>⚙️</ThemedText>
          <ThemedText
            style={[
              styles.modeSegmentText,
              autoMode && styles.modeSegmentTextActive,
            ]}>
            Automatic Mode
          </ThemedText>
        </Pressable>
      </View>

      {/* 3. Automatic Mode Occupancy Banner (Screen 2) */}
      {autoMode && (
        <View
          style={[
            styles.occupancyBanner,
            {
              backgroundColor: occupancyDetected ? '#ECFDF5' : '#F1F5F9',
              borderColor: occupancyDetected ? '#A7F3D0' : '#E2E8F0',
            },
          ]}>
          <View style={styles.occupancyLeft}>
            <View
              style={[
                styles.occupancyIconCircle,
                { backgroundColor: occupancyDetected ? '#DCFCE7' : '#E2E8F0' },
              ]}>
              <ThemedText style={styles.occupancyIcon}>
                {occupancyDetected ? '🏃' : '💤'}
              </ThemedText>
            </View>
            <View>
              <ThemedText style={styles.occupancyTitle}>
                {occupancyDetected ? 'Occupancy Detected' : 'Room is Vacant'}
              </ThemedText>
              <ThemedText style={styles.occupancySub}>
                {occupancyDetected
                  ? 'Sensors indicate presence'
                  : 'No motion or proximity detected'}
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.statusPulseDot,
              { backgroundColor: occupancyDetected ? '#10B981' : '#94A3B8' },
            ]}
          />
        </View>
      )}

      {/* 4. Loads Control Section (Screen 1 & Screen 2) */}
      <View style={styles.sectionHeaderRow}>
        <ThemedText style={styles.sectionHeading}>
          {autoMode ? 'Loads Status' : 'Loads Control'}
        </ThemedText>
      </View>

      <View style={styles.loadsRow}>
        {/* Load 1 Card */}
        <Pressable
          style={styles.loadCard}
          onPress={() => onOpenLoadDetail(1)}>
          <View style={styles.bulbCircle}>
            <ThemedText style={styles.bulbIcon}>💡</ThemedText>
          </View>

          <ThemedText style={styles.loadName}>Load 1</ThemedText>
          <ThemedText style={styles.loadType}>5V DC Bulb</ThemedText>

          <View style={styles.switchWrapper}>
            <Switch
              value={relay1}
              onValueChange={onToggleRelay1}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {autoMode ? (
            <ThemedText style={styles.autoTagPresence}>
              ✓ Auto: Presence
            </ThemedText>
          ) : (
            <ThemedText
              style={[
                styles.loadStatusText,
                { color: relay1 ? '#2563EB' : '#94A3B8' },
              ]}>
              {relay1 ? 'ON' : 'OFF'}
            </ThemedText>
          )}
        </Pressable>

        {/* Load 2 Card */}
        <Pressable
          style={styles.loadCard}
          onPress={() => onOpenLoadDetail(2)}>
          <View style={styles.bulbCircle}>
            <ThemedText style={styles.bulbIcon}>💡</ThemedText>
          </View>

          <ThemedText style={styles.loadName}>Load 2</ThemedText>
          <ThemedText style={styles.loadType}>5V DC Bulb</ThemedText>

          <View style={styles.switchWrapper}>
            <Switch
              value={relay2}
              onValueChange={onToggleRelay2}
              trackColor={{ false: '#E2E8F0', true: '#2563EB' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {autoMode ? (
            <ThemedText style={styles.autoTagDistance}>
              ✓ Auto: Distance
            </ThemedText>
          ) : (
            <ThemedText
              style={[
                styles.loadStatusText,
                { color: relay2 ? '#2563EB' : '#94A3B8' },
              ]}>
              {relay2 ? 'ON' : 'OFF'}
            </ThemedText>
          )}
        </Pressable>
      </View>

      {/* 5. Auto Control Settings Shortcut (Screen 2) */}
      {autoMode && (
        <View style={styles.autoSettingsSection}>
          <ThemedText style={styles.sectionHeading}>Auto Control Settings</ThemedText>
          <Pressable style={styles.timeoutCard} onPress={onOpenSettings}>
            <View style={styles.timeoutLeft}>
              <View style={styles.clockCircle}>
                <ThemedText style={styles.clockIcon}>⏱️</ThemedText>
              </View>
              <ThemedText style={styles.timeoutLabel}>
                No Presence Timeout
              </ThemedText>
            </View>

            <View style={styles.timeoutRight}>
              <ThemedText style={styles.timeoutValue}>
                {timeoutMins} minutes
              </ThemedText>
              <ThemedText style={styles.chevron}>›</ThemedText>
            </View>
          </Pressable>
        </View>
      )}

      {/* 6. Real-Time Monitoring Section (2x2 Grid) */}
      <View style={styles.sectionHeaderRow}>
        <ThemedText style={styles.sectionHeading}>Real-Time Monitoring</ThemedText>
      </View>

      <View style={styles.metricsGrid}>
        {/* Voltage Card */}
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

        {/* Current Card */}
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

        {/* Power Card */}
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

        {/* Energy Card */}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lightningIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightningIcon: {
    fontSize: 24,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  settingsIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearIcon: {
    fontSize: 18,
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  modeSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modeSegmentActive: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modeIcon: {
    fontSize: 15,
  },
  modeSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modeSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  occupancyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  occupancyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  occupancyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  occupancyIcon: {
    fontSize: 20,
  },
  occupancyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  occupancySub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  statusPulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionHeaderRow: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  loadsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  loadCard: {
    flex: 1,
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
    gap: 6,
  },
  bulbCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  bulbIcon: {
    fontSize: 22,
  },
  loadName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  loadType: {
    fontSize: 12,
    color: '#64748B',
  },
  switchWrapper: {
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  loadStatusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  autoTagPresence: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  autoTagDistance: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  autoSettingsSection: {
    gap: 10,
  },
  timeoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  timeoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clockCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockIcon: {
    fontSize: 16,
  },
  timeoutLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  timeoutRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeoutValue: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '300',
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
});
