import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';
import { RealisticBulb } from './RealisticBulb';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function GlowingLightCard({
  isOn,
  loadNumber,
  autoMode,
  onToggle,
  onPress,
}: {
  isOn: boolean;
  loadNumber: 1 | 2;
  autoMode: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const glowPulse = useSharedValue(0.3);
  const borderPulse = useSharedValue(1.5);
  const dotPulse = useSharedValue(1);

  useEffect(() => {
    if (isOn) {
      glowPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 950 }),
          withTiming(0.3, { duration: 950 })
        ),
        -1,
        true
      );
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(2.2, { duration: 950 }),
          withTiming(1.5, { duration: 950 })
        ),
        -1,
        true
      );
      dotPulse.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 750 }),
          withTiming(0.85, { duration: 750 })
        ),
        -1,
        true
      );
    } else {
      glowPulse.value = withTiming(0, { duration: 250 });
      borderPulse.value = withTiming(1.5, { duration: 250 });
      dotPulse.value = withTiming(1, { duration: 250 });
    }
  }, [isOn, glowPulse, borderPulse, dotPulse]);

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      borderWidth: borderPulse.value,
      borderColor: isOn
        ? isDark
          ? `rgba(245, 158, 11, ${0.45 + glowPulse.value * 0.5})`
          : `rgba(217, 119, 6, ${0.45 + glowPulse.value * 0.5})`
        : colors.cardBorder,
      shadowColor: isOn ? '#F59E0B' : '#000',
      shadowOpacity: isOn ? 0.25 + glowPulse.value * 0.45 : 0.04,
      shadowRadius: isOn ? 8 + glowPulse.value * 12 : 6,
      elevation: isOn ? 6 : 2,
    };
  });

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotPulse.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.loadCard,
        {
          backgroundColor: isOn
            ? isDark
              ? '#261806'
              : '#FFFBEB'
            : colors.card,
        },
        animatedCardStyle,
      ]}
      onPress={onPress}>
      <View style={styles.loadCardTopRow}>
        <RealisticBulb isOn={isOn} size={36} />
        <Switch
          value={isOn}
          onValueChange={onToggle}
          trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.loadCardBottom}>
        <View style={styles.loadNameRow}>
          <ThemedText style={[styles.loadName, { color: colors.text }]}>
            Light {loadNumber}
          </ThemedText>
          {isOn && (
            <View
              style={[
                styles.glowingPill,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.25)' : '#FEF3C7',
                  borderColor: isDark ? '#F59E0B' : '#FBBF24',
                },
              ]}>
              <Animated.View style={[styles.glowingDot, animatedDotStyle]} />
              <ThemedText
                style={[
                  styles.glowingPillText,
                  { color: isDark ? '#FDE68A' : '#B45309' },
                ]}>
                GLOWING
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.loadType, { color: colors.textSecondary }]}>
          {autoMode
            ? loadNumber === 1
              ? 'Smart: PIR / IR'
              : 'Smart: Ultrasonic'
            : isOn
            ? '5V DC • Active ON'
            : '5V DC • Standby'}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

interface Props {
  autoMode: boolean;
  occupancyDetected: boolean;
  relay1: boolean;
  relay2: boolean;
  voltage: number;
  measuredVoltage?: number;
  hardwareVoltageActive?: boolean;
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
  pirMotion?: boolean;
  irDetected?: boolean;
  distanceCm?: number;
  distanceValid?: boolean;
  errorMsg?: string | null;
  onConnect: (ip: string) => void;
  onRefresh: (ip?: string) => void;
  onSetAutoMode: (mode: boolean) => void;
  onToggleAutoMode?: () => void;
  onToggleRelay1: () => void;
  onToggleRelay2: () => void;
  onOpenLoadDetail: (id: 1 | 2) => void;
  onOpenSettings: () => void;
  onOpenSystemStatus: () => void;
  actionError?: string | null;
  onDismissActionError?: () => void;
}

export function HomeDashboardView({
  autoMode,
  occupancyDetected,
  relay1,
  relay2,
  voltage,
  measuredVoltage: _measuredVoltage,
  hardwareVoltageActive = false,
  currentAmps,
  powerWatts,
  totalKwh,
  autoOffDelaySec,
  ipAddress,
  isConnected,
  isConnecting = false,
  isRefreshing = false,
  lastUpdated,
  pirMotion = false,
  irDetected = false,
  distanceCm = 0,
  distanceValid = true,
  errorMsg = null,
  onConnect,
  actionError,
  onDismissActionError,
  onRefresh,
  onSetAutoMode,
  onToggleRelay1,
  onToggleRelay2,
  onOpenLoadDetail,
  onOpenSettings,
  onOpenSystemStatus,
}: Props) {
  const { colors, isDark } = useTheme();
  const timeoutMins = Math.round(autoOffDelaySec / 60);
  const [prevIpAddress, setPrevIpAddress] = useState<string>(ipAddress);
  const [inputIp, setInputIp] = useState<string>(ipAddress);

  if (prevIpAddress !== ipAddress) {
    setPrevIpAddress(ipAddress);
    setInputIp(ipAddress);
  }

  // Live breathing pulse animation for occupancy radar dot
  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    if (occupancyDetected) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.35, { duration: 750 }),
          withTiming(0.85, { duration: 750 })
        ),
        -1,
        true
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 300 });
    }
  }, [occupancyDetected, pulseAnim]);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: occupancyDetected ? 1 : 0.6,
  }));

  const [localIpError, setLocalIpError] = useState<string | null>(null);

  const isValidIpOrHost = (ip: string) => {
    const clean = ip.trim();
    if (!clean) return false;
    const hostPortMatch = clean.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::(\d+))?$/);
    if (hostPortMatch) {
      const parts = hostPortMatch[1].split('.').map(Number);
      const validOctets = parts.every((p) => p >= 0 && p <= 255);
      if (!validOctets) return false;
      if (hostPortMatch[2]) {
        const port = Number(hostPortMatch[2]);
        if (port <= 0 || port > 65535) return false;
      }
      return true;
    }
    if (/^localhost(?::\d+)?$/i.test(clean)) return true;
    return false;
  };

  const handleConnect = () => {
    const clean = inputIp.trim();
    if (!clean || !isValidIpOrHost(clean)) {
      setLocalIpError('Please enter the correct IP address (e.g. 192.168.1.100)');
      return;
    }
    setLocalIpError(null);
    onConnect(clean);
  };

  const handleRefresh = () => {
    const clean = inputIp.trim();
    if (!clean || !isValidIpOrHost(clean)) {
      setLocalIpError('Please enter the correct IP address (e.g. 192.168.1.100)');
      return;
    }
    setLocalIpError(null);
    onRefresh(clean);
  };

  return (
    <ScrollView
      style={[styles.scrollArea, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }>
      {/* 1. Header Bar with Official Brand Logo */}
      <Animated.View
        entering={FadeInDown.duration(320).delay(20)}
        style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.appHeaderLogo}
            resizeMode="cover"
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
      </Animated.View>

      {/* 2. ESP32 Network Connection & Controls Card */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(70)}
        style={[
          styles.connectionCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? colors.cardBorder : colors.primaryBorder,
          },
        ]}>
        <View style={styles.connectionCardHeader}>
          <Pressable
            style={({ pressed }) => [styles.connectionStatusLeft, pressed && styles.buttonPressed]}
            onPress={onOpenSystemStatus}>
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
          </Pressable>

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
            onPress={handleRefresh}
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
              {
                backgroundColor: colors.inputBg,
                borderColor: (localIpError || (!isConnected && errorMsg))
                  ? colors.danger
                  : colors.inputBorder,
              },
            ]}>
            <Ionicons
              name="globe-outline"
              size={17}
              color={(localIpError || (!isConnected && errorMsg)) ? colors.danger : colors.textMuted}
            />
            <TextInput
              style={[styles.ipTextInput, { color: colors.text }]}
              value={inputIp}
              onChangeText={(text) => {
                setInputIp(text);
                if (localIpError) {
                  setLocalIpError(null);
                }
              }}
              placeholder="e.g. 192.168.1.100"
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

        {(localIpError || (!isConnected && errorMsg)) && (
          <View style={styles.ipErrorContainer}>
            <Ionicons name="alert-circle" size={15} color={colors.danger} />
            <ThemedText style={[styles.ipErrorText, { color: colors.danger }]}>
              {localIpError || 'Cannot connect to ESP32: Please enter the correct IP address'}
            </ThemedText>
          </View>
        )}
      </Animated.View>

      {/* 3. Colorful Mode Toggle: Manual Control vs Smart Control */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(120)}
        style={[
          styles.modeSelectorContainer,
          {
            backgroundColor: isDark ? 'rgba(5, 150, 105, 0.12)' : '#ECFDF5',
            borderColor: isDark ? 'rgba(5, 150, 105, 0.35)' : '#A7F3D0',
            borderWidth: 1.5,
          },
        ]}>
        <Pressable
          style={({ pressed }) => [
            styles.modeSegment,
            !autoMode
              ? [styles.modeSegmentActive, { backgroundColor: colors.primary }]
              : { backgroundColor: 'transparent' },
            pressed && styles.modeSegmentPressed,
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
          style={({ pressed }) => [
            styles.modeSegment,
            autoMode
              ? [styles.modeSegmentActive, { backgroundColor: colors.primary }]
              : { backgroundColor: 'transparent' },
            pressed && styles.modeSegmentPressed,
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
      </Animated.View>

      {/* 4. Smart Control Occupancy Banner with Colorful Radar */}
      {autoMode && (
        <Animated.View
          entering={FadeInDown.duration(340).delay(170)}
          style={[
            styles.occupancyBanner,
            {
              backgroundColor: occupancyDetected
                ? isDark
                  ? 'rgba(16, 185, 129, 0.15)'
                  : '#ECFDF5'
                : isDark
                ? 'rgba(239, 68, 68, 0.12)'
                : '#FEF2F2',
              borderColor: occupancyDetected
                ? colors.primaryBorder
                : isDark
                ? 'rgba(239, 68, 68, 0.35)'
                : '#FECACA',
            },
          ]}>
          <View style={styles.occupancyLeft}>
            <ColorfulIcon
              library="material"
              name={occupancyDetected ? 'motion-sensor' : 'sleep'}
              variant={occupancyDetected ? 'emerald' : 'rose'}
              size={20}
              containerSize={38}
            />
            <View style={{ flex: 1 }}>
              <ThemedText
                style={[
                  styles.occupancyTitle,
                  { color: occupancyDetected ? colors.primary : '#EF4444' },
                ]}>
                {occupancyDetected ? 'Occupancy Detected' : 'All Sensors Clear (Vacant)'}
              </ThemedText>
              <ThemedText
                style={[
                  styles.occupancySub,
                  { color: occupancyDetected ? colors.primaryHover : colors.textMuted },
                ]}>
                {occupancyDetected
                  ? 'Sensors active • Target Lights ON & Glowing'
                  : 'PIR, IR & Ultrasonic clear • All Loads Turned OFF'}
              </ThemedText>
            </View>
          </View>

          <Animated.View
            style={[
              styles.statusPulseDot,
              { backgroundColor: occupancyDetected ? colors.success : '#EF4444' },
              pulseAnimatedStyle,
            ]}
          />
        </Animated.View>
      )}

      {/* 5. Lights Control Section with Glowing Light Cards */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(210)}
        style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[styles.sectionHeading, { color: colors.text }]}>
            {autoMode ? 'Smart Lights Telemetry' : 'Manual Lights Control'}
          </ThemedText>
        </View>

        <View style={styles.loadsRow}>
          <GlowingLightCard
            isOn={relay1}
            loadNumber={1}
            autoMode={autoMode}
            onToggle={onToggleRelay1}
            onPress={() => onOpenLoadDetail(1)}
          />
          <GlowingLightCard
            isOn={relay2}
            loadNumber={2}
            autoMode={autoMode}
            onToggle={onToggleRelay2}
            onPress={() => onOpenLoadDetail(2)}
          />
        </View>
      </Animated.View>

      {/* 6. Smart Control Settings Shortcut */}
      {autoMode && (
        <Animated.View
          entering={FadeInDown.duration(340).delay(250)}
          style={styles.autoSettingsSection}>
          <ThemedText style={[styles.sectionHeading, { color: colors.text }]}>
            Smart Control Settings
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.timeoutCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
              pressed && styles.loadCardPressed,
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
        </Animated.View>
      )}

      {/* 7. Real-Time Telemetry Metrics with Colorful Badges */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(290)}
        style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={[styles.sectionHeading, { color: colors.text }]}>
            Real-Time Monitoring
          </ThemedText>
        </View>

        <View style={styles.metricsGrid}>
          {/* Voltage Card */}
          <Animated.View
            entering={FadeInUp.duration(320).delay(280)}
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

          {/* Current Card */}
          <Animated.View
            entering={FadeInUp.duration(320).delay(320)}
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

          {/* Power Card */}
          <Animated.View
            entering={FadeInUp.duration(320).delay(360)}
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

          {/* Energy Card */}
          <Animated.View
            entering={FadeInUp.duration(320).delay(400)}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appHeaderLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
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
  modeSegmentPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.85,
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
  sectionContainer: {
    gap: 12,
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
  loadCardPressed: {
    transform: [{ scale: 0.97 }],
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
  ipErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    marginTop: -2,
  },
  ipErrorText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  glowingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  glowingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  glowingPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
