import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';
import { RealisticBulb } from './RealisticBulb';

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
  ipAddress: string;
  isConnected: boolean;
  isConnecting?: boolean;
  isRefreshing?: boolean;
  isLoading?: boolean;
  lastUpdated: Date | null;
  onConnect: (ip: string) => void;
  onRefresh: () => void;
  onSetAutoMode: (mode: boolean) => void;
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
  ipAddress,
  isConnected,
  isConnecting = false,
  isRefreshing = false,
  lastUpdated,
  onConnect,
  onRefresh,
  onSetAutoMode,
  onToggleAutoMode,
  onToggleRelay1,
  onToggleRelay2,
  onOpenLoadDetail,
  onOpenSettings,
  onOpenSystemStatus,
}: Props) {
  const { colors, isDark } = useTheme();
  const timeoutMins = Math.round(autoOffDelaySec / 60);
  const [inputIp, setInputIp] = useState<string>(ipAddress);

  useEffect(() => {
    setInputIp(ipAddress);
  }, [ipAddress]);

  const handleConnect = () => {
    if (inputIp.trim()) {
      onConnect(inputIp.trim());
    }
  };

  return (
    <ScrollView
      style={[styles.scrollArea, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }>
      {/* 1. Header Bar with Colorful Electric Badge */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <ColorfulIcon
            library="ionicons"
            name="flash"
            variant="emerald"
            size={22}
            containerSize={44}
          />
          <View>
            <ThemedText style={[styles.appTitle, { color: colors.text }]}>
              Smart Energy Meter
            </ThemedText>
            <ThemedText style={[styles.appSubtitle, { color: colors.textSecondary }]}>
              Live IoT Power & Room Automation
            </ThemedText>
          </View>
        </View>
      </View>

      {/* 2. ESP32 Network Connection & Controls Card */}
      <View
        style={[
          styles.connectionCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? colors.cardBorder : colors.primaryBorder,
          },
        ]}>
        <View style={styles.connectionCardHeader}>
          <View style={styles.connectionStatusLeft}>
            <ColorfulIcon
              library="material"
              name="chip"
              variant={isConnected ? 'emerald' : 'rose'}
              size={19}
              containerSize={38}
            />
            <View>
              <ThemedText style={[styles.connectionTitle, { color: colors.text }]}>
                ESP32 Hardware
              </ThemedText>
              <ThemedText
                style={[
                  styles.connectionStatusText,
                  { color: isConnected ? colors.primary : colors.danger },
                ]}>
                {isConnected ? '● Connected & Ready' : '● Offline • Standby'}
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              {
                backgroundColor: colors.primaryTint,
                borderColor: colors.primaryBorder,
              },
              pressed && styles.buttonPressed,
              (isRefreshing || isConnecting) && styles.buttonDisabled,
            ]}
            onPress={onRefresh}
            disabled={isRefreshing || isConnecting}>
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="refresh" size={15} color={colors.primary} />
                <ThemedText style={[styles.refreshButtonText, { color: colors.primary }]}>
                  Refresh
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.ipInputRow}>
          <View
            style={[
              styles.ipInputWrapper,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
            ]}>
            <Ionicons name="globe-outline" size={17} color={colors.textMuted} />
            <TextInput
              style={[styles.ipTextInput, { color: colors.text }]}
              value={inputIp}
              onChangeText={setInputIp}
              placeholder="e.g. 192.168.4.1"
              placeholderTextColor={colors.textMuted}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleConnect}
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.connectButton,
              { backgroundColor: colors.primary },
              pressed && styles.buttonPressed,
              (isConnecting || isRefreshing) && styles.buttonDisabled,
            ]}
            onPress={handleConnect}
            disabled={isConnecting || isRefreshing}>
            {isConnecting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.connectBtnContent}>
                <MaterialCommunityIcons name="link-variant" size={15} color="#FFFFFF" />
                <ThemedText style={styles.connectButtonText}>Connect</ThemedText>
              </View>
            )}
          </Pressable>
        </View>

        <View style={[styles.connectionCardFooter, { borderTopColor: colors.divider }]}>
          <ThemedText style={[styles.lastSyncText, { color: colors.textMuted }]}>
            {lastUpdated
              ? `Synced ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Not synced yet'}
          </ThemedText>
          <View style={styles.presetChips}>
            {['192.168.4.1', '192.168.1.100'].map((preset) => (
              <Pressable
                key={preset}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: colors.primaryTint,
                    borderColor: colors.primaryBorder,
                  },
                ]}
                onPress={() => {
                  setInputIp(preset);
                  onConnect(preset);
                }}>
                <ThemedText style={[styles.presetChipText, { color: colors.primaryHover }]}>
                  {preset === '192.168.4.1' ? 'AP: .4.1' : 'STA: .1.100'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* 3. Colorful Mode Toggle: Manual Control vs Smart Control */}
      <View
        style={[
          styles.modeSelectorContainer,
          {
            backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ECFDF5',
            borderColor: isDark ? 'rgba(5, 150, 105, 0.35)' : '#A7F3D0',
            borderWidth: 1.5,
          },
        ]}>
        <Pressable
          style={[
            styles.modeSegment,
            !autoMode
              ? [styles.modeSegmentActive, { backgroundColor: colors.primary }]
              : { backgroundColor: 'transparent' },
          ]}
          onPress={() => onSetAutoMode(false)}>
          <View
            style={[
              styles.modeSegmentIconSquircle,
              {
                backgroundColor: !autoMode
                  ? 'rgba(255, 255, 255, 0.24)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(5, 150, 105, 0.12)',
              },
            ]}>
            <MaterialCommunityIcons
              name="gesture-tap"
              size={17}
              color={!autoMode ? '#FFFFFF' : isDark ? '#A7F3D0' : colors.primary}
            />
          </View>
          <ThemedText
            style={[
              styles.modeSegmentText,
              { color: !autoMode ? '#FFFFFF' : isDark ? '#A7F3D0' : '#047857' },
              !autoMode && styles.modeSegmentTextActive,
            ]}>
            Manual Control
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.modeSegment,
            autoMode
              ? [styles.modeSegmentActive, { backgroundColor: colors.primary }]
              : { backgroundColor: 'transparent' },
          ]}
          onPress={() => onSetAutoMode(true)}>
          <View
            style={[
              styles.modeSegmentIconSquircle,
              {
                backgroundColor: autoMode
                  ? 'rgba(255, 255, 255, 0.24)'
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(5, 150, 105, 0.12)',
              },
            ]}>
            <MaterialCommunityIcons
              name="robot"
              size={17}
              color={autoMode ? '#FFFFFF' : isDark ? '#A7F3D0' : colors.primary}
            />
          </View>
          <ThemedText
            style={[
              styles.modeSegmentText,
              { color: autoMode ? '#FFFFFF' : isDark ? '#A7F3D0' : '#047857' },
              autoMode && styles.modeSegmentTextActive,
            ]}>
            Smart Control
          </ThemedText>
        </Pressable>
      </View>

      {/* 4. Smart Control Occupancy Banner with Colorful Radar */}
      {autoMode && (
        <View
          style={[
            styles.occupancyBanner,
            {
              backgroundColor: occupancyDetected
                ? isDark
                  ? 'rgba(16, 185, 129, 0.15)'
                  : '#ECFDF5'
                : isDark
                ? colors.card
                : '#F1F5F9',
              borderColor: occupancyDetected
                ? colors.primaryBorder
                : isDark
                ? colors.cardBorder
                : '#E2E8F0',
            },
          ]}>
          <View style={styles.occupancyLeft}>
            <ColorfulIcon
              library="material"
              name={occupancyDetected ? 'motion-sensor' : 'sleep'}
              variant={occupancyDetected ? 'emerald' : 'slate'}
              size={20}
              containerSize={38}
            />
            <View>
              <ThemedText
                style={[
                  styles.occupancyTitle,
                  { color: occupancyDetected ? colors.primary : colors.textSecondary },
                ]}>
                {occupancyDetected ? 'Occupancy Detected' : 'Room is Vacant'}
              </ThemedText>
              <ThemedText
                style={[
                  styles.occupancySub,
                  { color: occupancyDetected ? colors.primaryHover : colors.textMuted },
                ]}>
                {occupancyDetected
                  ? 'Sensors indicate presence in room'
                  : 'Sensors clear • Countdown active'}
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.statusPulseDot,
              { backgroundColor: occupancyDetected ? colors.success : colors.textMuted },
            ]}
          />
        </View>
      )}

      {/* 5. Lights Control Section with Realistic 3D Glowing Bulbs */}
      <View style={styles.sectionHeaderRow}>
        <ThemedText style={[styles.sectionHeading, { color: colors.text }]}>
          {autoMode ? 'Smart Lights Telemetry' : 'Manual Lights Control'}
        </ThemedText>
      </View>

      <View style={styles.loadsRow}>
        {/* Light 1 Card */}
        <Pressable
          style={[
            styles.loadCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            relay1 && (isDark ? styles.loadCardGlowingDark : styles.loadCardGlowingLight),
          ]}
          onPress={() => onOpenLoadDetail(1)}>
          <View style={styles.loadCardTopRow}>
            <RealisticBulb isOn={relay1} size={36} />
            <Switch
              value={relay1}
              onValueChange={onToggleRelay1}
              trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.loadCardBottom}>
            <ThemedText style={[styles.loadName, { color: colors.text }]}>Light 1</ThemedText>
            <ThemedText style={[styles.loadType, { color: colors.textSecondary }]}>
              {autoMode ? 'Smart: Presence' : (relay1 ? '5V DC • Active ON' : '5V DC • Standby')}
            </ThemedText>
          </View>
        </Pressable>

        {/* Light 2 Card */}
        <Pressable
          style={[
            styles.loadCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            relay2 && (isDark ? styles.loadCardGlowingDark : styles.loadCardGlowingLight),
          ]}
          onPress={() => onOpenLoadDetail(2)}>
          <View style={styles.loadCardTopRow}>
            <RealisticBulb isOn={relay2} size={36} />
            <Switch
              value={relay2}
              onValueChange={onToggleRelay2}
              trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.loadCardBottom}>
            <ThemedText style={[styles.loadName, { color: colors.text }]}>Light 2</ThemedText>
            <ThemedText style={[styles.loadType, { color: colors.textSecondary }]}>
              {autoMode ? 'Smart: Distance' : (relay2 ? '5V DC • Active ON' : '5V DC • Standby')}
            </ThemedText>
          </View>
        </Pressable>
      </View>

      {/* 6. Smart Control Settings Shortcut */}
      {autoMode && (
        <View style={styles.autoSettingsSection}>
          <ThemedText style={[styles.sectionHeading, { color: colors.text }]}>
            Smart Control Settings
          </ThemedText>
          <Pressable
            style={[
              styles.timeoutCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={onOpenSettings}>
            <View style={styles.timeoutLeft}>
              <ColorfulIcon
                library="ionicons"
                name="timer"
                variant="cyan"
                size={18}
                containerSize={36}
              />
              <ThemedText style={[styles.timeoutLabel, { color: colors.text }]}>
                No Presence Timeout
              </ThemedText>
            </View>

            <View style={styles.timeoutRight}>
              <ThemedText style={[styles.timeoutValue, { color: colors.textSecondary }]}>
                {timeoutMins} minutes
              </ThemedText>
              <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
            </View>
          </Pressable>
        </View>
      )}

      {/* 7. Real-Time Telemetry Metrics with Colorful Badges */}
      <View style={styles.sectionHeaderRow}>
        <ThemedText style={[styles.sectionHeading, { color: colors.text }]}>
          Real-Time Monitoring
        </ThemedText>
      </View>

      <View style={styles.metricsGrid}>
        {/* Voltage Card */}
        <View
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
            {voltage.toFixed(2)} V
          </ThemedText>
          <ThemedText style={[styles.metricSub, { color: colors.textMuted }]}>
            DC Supply
          </ThemedText>
        </View>

        {/* Current Card */}
        <View
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
            {currentAmps.toFixed(2)} A
          </ThemedText>
          <ThemedText style={[styles.metricSub, { color: colors.textMuted }]}>
            Total Load
          </ThemedText>
        </View>

        {/* Power Card */}
        <View
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
            {powerWatts.toFixed(2)} W
          </ThemedText>
          <ThemedText style={[styles.metricSub, { color: colors.textMuted }]}>
            Voltage × Current
          </ThemedText>
        </View>

        {/* Energy Card */}
        <View
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
            {totalKwh.toFixed(3)} kWh
          </ThemedText>
          <ThemedText style={[styles.metricSub, { color: colors.textMuted }]}>
            Total Accumulation
          </ThemedText>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  modeSelectorContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    gap: 6,
  },
  modeSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeSegmentActive: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  modeSegmentIconSquircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeSegmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modeSegmentTextActive: {
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
  occupancyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  occupancySub: {
    fontSize: 11,
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
  },
  loadsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  loadCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 8,
  },
  loadCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loadCardBottom: {
    gap: 2,
  },
  loadCardGlowingLight: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loadCardGlowingDark: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: '#13281C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  loadName: {
    fontSize: 15,
    fontWeight: '700',
  },
  loadType: {
    fontSize: 12,
  },
  loadStatusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  autoTagPresence: {
    fontSize: 11,
    fontWeight: '700',
  },
  autoTagDistance: {
    fontSize: 11,
    fontWeight: '700',
  },
  autoSettingsSection: {
    gap: 10,
  },
  timeoutCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  timeoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeoutLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeoutRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeoutValue: {
    fontSize: 13,
    fontWeight: '600',
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
  connectionCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  connectionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connectionStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  connectionStatusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  ipInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  ipInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  ipTextInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  connectButton: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 84,
  },
  connectBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  connectionCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  lastSyncText: {
    fontSize: 10,
    fontWeight: '500',
  },
  presetChips: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
