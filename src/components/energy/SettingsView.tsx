import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';

interface Props {
  autoMode: boolean;
  autoTarget: 1 | 2 | 3;
  autoOffDelaySec: number;
  occupancyDistThresholdCm?: number;
  ipAddress: string;
  tariffRate: number;
  voltage?: number;
  onToggleAutoMode: () => void;
  onUpdateTarget: (target: 1 | 2 | 3) => void;
  onUpdateDelay: (delaySec: number) => void;
  onSaveConfig: (config: any) => Promise<boolean>;
  onResetEnergy: () => Promise<boolean>;
  onIpChange: (ip: string) => void;
  onOpenSystemStatus: () => void;
}

export function SettingsView({
  autoMode,
  autoTarget,
  autoOffDelaySec,
  occupancyDistThresholdCm,
  ipAddress,
  tariffRate,
  onToggleAutoMode,
  onUpdateTarget,
  onUpdateDelay,
  onSaveConfig,
  onResetEnergy,
  onIpChange,
  onOpenSystemStatus,
}: Props) {
  const { colors, isDark, setTheme, toggleTheme } = useTheme();
  const [prevDistThresh, setPrevDistThresh] = useState(occupancyDistThresholdCm);
  const [distanceThreshold, setDistanceThreshold] = useState(occupancyDistThresholdCm ?? 50);
  const [distInputStr, setDistInputStr] = useState(String(occupancyDistThresholdCm ?? 50));

  if (occupancyDistThresholdCm !== undefined && prevDistThresh !== occupancyDistThresholdCm) {
    setPrevDistThresh(occupancyDistThresholdCm);
    setDistanceThreshold(occupancyDistThresholdCm);
    setDistInputStr(String(occupancyDistThresholdCm));
  }

  const [prevAutoTarget, setPrevAutoTarget] = useState(autoTarget);
  const [selectedTarget, setSelectedTarget] = useState<1 | 2 | 3>(autoTarget);

  if (prevAutoTarget !== autoTarget) {
    setPrevAutoTarget(autoTarget);
    setSelectedTarget(autoTarget);
  }

  const [prevDelaySec, setPrevDelaySec] = useState(autoOffDelaySec);
  const [timeoutMins, setTimeoutMins] = useState(Math.max(1, Math.round(autoOffDelaySec / 60)));

  if (prevDelaySec !== autoOffDelaySec) {
    setPrevDelaySec(autoOffDelaySec);
    setTimeoutMins(Math.max(1, Math.round(autoOffDelaySec / 60)));
  }

  const [prevIp, setPrevIp] = useState(ipAddress);
  const [tempIp, setTempIp] = useState(ipAddress);

  if (prevIp !== ipAddress) {
    setPrevIp(ipAddress);
    setTempIp(ipAddress);
  }

  const [prevTariff, setPrevTariff] = useState(tariffRate);
  const [tempTariff, setTempTariff] = useState(String(tariffRate));

  if (prevTariff !== tariffRate) {
    setPrevTariff(tariffRate);
    setTempTariff(String(tariffRate));
  }

  // Individual setting update states
  const [isSavingTimeout, setIsSavingTimeout] = useState(false);
  const [timeoutStatus, setTimeoutStatus] = useState<string | null>(null);

  const [isSavingDist, setIsSavingDist] = useState(false);
  const [distStatus, setDistStatus] = useState<string | null>(null);

  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string | null>(null);

  const [isSavingIp, setIsSavingIp] = useState(false);
  const [ipStatus, setIpStatus] = useState<string | null>(null);

  const [isSavingTariff, setIsSavingTariff] = useState(false);
  const [tariffStatus, setTariffStatus] = useState<string | null>(null);

  // Stepper handlers
  const handleDecTimeout = () => {
    if (timeoutMins > 1) {
      setTimeoutMins((prev) => prev - 1);
    }
  };

  const handleIncTimeout = () => {
    if (timeoutMins < 60) {
      setTimeoutMins((prev) => prev + 1);
    }
  };

  // Distance Threshold manual handlers
  const handleDistTextChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    setDistInputStr(cleaned);
    const parsed = parseInt(cleaned, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setDistanceThreshold(Math.min(200, parsed));
    }
  };

  const handleDistBlur = () => {
    const parsed = parseInt(distInputStr, 10);
    if (isNaN(parsed) || parsed < 10) {
      setDistanceThreshold(10);
      setDistInputStr('10');
    } else if (parsed > 200) {
      setDistanceThreshold(200);
      setDistInputStr('200');
    } else {
      setDistanceThreshold(parsed);
      setDistInputStr(String(parsed));
    }
  };

  const handleDecDist = () => {
    const next = Math.max(10, distanceThreshold - 10);
    setDistanceThreshold(next);
    setDistInputStr(String(next));
  };

  const handleIncDist = () => {
    const next = Math.min(200, distanceThreshold + 10);
    setDistanceThreshold(next);
    setDistInputStr(String(next));
  };

  // Target checkboxes
  const controlLoad1 = selectedTarget === 1 || selectedTarget === 3;
  const controlLoad2 = selectedTarget === 2 || selectedTarget === 3;

  const toggleControlLoad1 = () => {
    if (controlLoad1 && controlLoad2) {
      setSelectedTarget(2); // keep only load 2
    } else if (!controlLoad1 && controlLoad2) {
      setSelectedTarget(3); // both
    } else {
      setSelectedTarget(1);
    }
  };

  const toggleControlLoad2 = () => {
    if (controlLoad1 && controlLoad2) {
      setSelectedTarget(1); // keep only load 1
    } else if (controlLoad1 && !controlLoad2) {
      setSelectedTarget(3); // both
    } else {
      setSelectedTarget(2);
    }
  };


  // 1. Update Timeout individually
  const handleUpdateTimeout = async () => {
    setIsSavingTimeout(true);
    setTimeoutStatus(null);
    try {
      const ok = await onSaveConfig({ auto_off_delay_sec: timeoutMins * 60 });
      if (ok) {
        onUpdateDelay(timeoutMins * 60);
        setTimeoutStatus(`✓ Timeout set to ${timeoutMins} min!`);
        setTimeout(() => setTimeoutStatus(null), 3000);
      } else {
        setTimeoutStatus('❌ Failed to update timeout');
      }
    } catch {
      setTimeoutStatus('❌ Error updating timeout');
    } finally {
      setIsSavingTimeout(false);
    }
  };

  // 2. Update Distance Threshold individually
  const handleUpdateDistance = async () => {
    setIsSavingDist(true);
    setDistStatus(null);
    try {
      const ok = await onSaveConfig({
        dist_threshold_cm: distanceThreshold,
        occupancy_dist_threshold_cm: distanceThreshold,
      });
      if (ok) {
        setDistStatus(`✓ Distance set to ${distanceThreshold} cm!`);
        setTimeout(() => setDistStatus(null), 3000);
      } else {
        setDistStatus('❌ Failed to update distance');
      }
    } catch {
      setDistStatus('❌ Error updating distance');
    } finally {
      setIsSavingDist(false);
    }
  };

  // 3. Update Target Lights individually
  const handleUpdateTarget = async () => {
    setIsSavingTarget(true);
    setTargetStatus(null);
    try {
      const ok = await onSaveConfig({ auto_target: selectedTarget });
      if (ok) {
        onUpdateTarget(selectedTarget);
        const targetLabel =
          selectedTarget === 3 ? 'Both Lights' : selectedTarget === 1 ? 'Light 1' : 'Light 2';
        setTargetStatus(`✓ Target set to ${targetLabel}!`);
        setTimeout(() => setTargetStatus(null), 3000);
      } else {
        setTargetStatus('❌ Failed to update target lights');
      }
    } catch {
      setTargetStatus('❌ Error updating target');
    } finally {
      setIsSavingTarget(false);
    }
  };

  // 4. Update IP Address individually
  const handleUpdateIp = () => {
    setIsSavingIp(true);
    setIpStatus(null);
    const clean = tempIp.trim();
    if (!clean) {
      setIpStatus('❌ Please enter a valid IP');
      setIsSavingIp(false);
      return;
    }
    onIpChange(clean);
    setIpStatus(`✓ ESP32 IP set to ${clean}`);
    setTimeout(() => setIpStatus(null), 3000);
    setIsSavingIp(false);
  };

  // 5. Update Tariff Rate individually
  const handleUpdateTariff = async () => {
    setIsSavingTariff(true);
    setTariffStatus(null);
    const val = parseFloat(tempTariff);
    if (isNaN(val) || val < 0) {
      setTariffStatus('❌ Please enter a valid tariff rate');
      setIsSavingTariff(false);
      return;
    }
    try {
      const ok = await onSaveConfig({ tariff_rate: val });
      if (ok) {
        setTariffStatus(`✓ Tariff set to ₹${val.toFixed(2)}/kWh!`);
        setTimeout(() => setTariffStatus(null), 3000);
      } else {
        setTariffStatus('❌ Failed to save tariff');
      }
    } catch {
      setTariffStatus('❌ Error saving tariff');
    } finally {
      setIsSavingTariff(false);
    }
  };


  const handleResetConfirm = async () => {
    const doReset = async () => {
      await onResetEnergy();
      if (Platform.OS === 'web') {
        window.alert('Energy counter reset to 0.0 kWh');
      } else {
        Alert.alert('Reset Complete', 'Energy counter has been reset to 0.0 kWh');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset cumulative energy counter to 0.0 kWh?')) {
        await doReset();
      }
    } else {
      Alert.alert(
        'Reset Energy Counter',
        'Are you sure you want to reset accumulated energy to 0.0 kWh?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: doReset },
        ]
      );
    }
  };

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
          name="options"
          variant="emerald"
          size={22}
          containerSize={46}
        />
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Settings</ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Automation Rules & Preferences
          </ThemedText>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.statusBtn,
            { backgroundColor: colors.primaryTint, borderColor: colors.primaryBorder },
            pressed && { transform: [{ scale: 0.95 }], opacity: 0.85 },
          ]}
          onPress={onOpenSystemStatus}>
          <Ionicons name="pulse" size={14} color={colors.primary} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.statusBtnText, { color: colors.primary }]}>
            System Status ›
          </ThemedText>
        </Pressable>
      </Animated.View>

      {/* 1. Theme & Appearance Switcher Card with Colorful Badges */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(60)}
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWithIcon}>
            <ColorfulIcon
              library="ionicons"
              name={isDark ? 'moon' : 'sunny'}
              variant={isDark ? 'darkCosmic' : 'amber'}
              size={20}
              containerSize={38}
            />
            <View>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Display Theme
              </ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Switch between Light and Dark mode
              </ThemedText>
            </View>
          </View>

          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#E2E8F0', true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Visual Theme Selection Options */}
        <View style={styles.themeOptionsRow}>
          {/* Light Theme Option */}
          <Pressable
            style={({ pressed }) => [
              styles.themeOptionCard,
              {
                backgroundColor: !isDark ? (isDark ? '#1C2E24' : '#F0FDF4') : colors.inputBg,
                borderColor: !isDark ? colors.primary : colors.cardBorder,
              },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
            ]}
            onPress={() => setTheme('light')}>
            <View style={styles.themeOptionTop}>
              <ColorfulIcon
                library="ionicons"
                name="sunny"
                variant="amber"
                size={18}
                containerSize={34}
              />
              <View
                style={[
                  styles.themeRadioCircle,
                  { borderColor: !isDark ? colors.primary : colors.textMuted },
                ]}>
                {!isDark && (
                  <View
                    style={[styles.themeRadioDot, { backgroundColor: colors.primary }]}
                  />
                )}
              </View>
            </View>
            <ThemedText style={[styles.themeOptionTitle, { color: colors.text }]}>
              Light Theme
            </ThemedText>
            <ThemedText style={[styles.themeOptionSub, { color: colors.textSecondary }]}>
              Clean green & crisp white
            </ThemedText>
          </Pressable>

          {/* Dark Theme Option */}
          <Pressable
            style={({ pressed }) => [
              styles.themeOptionCard,
              {
                backgroundColor: isDark ? '#16281E' : colors.inputBg,
                borderColor: isDark ? colors.primary : colors.cardBorder,
              },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
            ]}
            onPress={() => setTheme('dark')}>
            <View style={styles.themeOptionTop}>
              <ColorfulIcon
                library="ionicons"
                name="moon"
                variant="darkCosmic"
                size={18}
                containerSize={34}
              />
              <View
                style={[
                  styles.themeRadioCircle,
                  { borderColor: isDark ? colors.primary : colors.textMuted },
                ]}>
                {isDark && (
                  <View
                    style={[styles.themeRadioDot, { backgroundColor: colors.primary }]}
                  />
                )}
              </View>
            </View>
            <ThemedText style={[styles.themeOptionTitle, { color: colors.text }]}>
              Dark Theme
            </ThemedText>
            <ThemedText style={[styles.themeOptionSub, { color: colors.textSecondary }]}>
              Sleek obsidian & emerald
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>

      {/* 2. Control Mode Card with Colorful Icons */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(110)}
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Control Mode</ThemedText>
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
            style={({ pressed }) => [
              styles.modeSegment,
              !autoMode
                ? [styles.modeSegmentActive, { backgroundColor: colors.primary }]
                : { backgroundColor: 'transparent' },
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
            ]}
            onPress={() => {
              if (autoMode) onToggleAutoMode();
            }}>
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
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
            ]}
            onPress={() => {
              if (!autoMode) onToggleAutoMode();
            }}>
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
      </Animated.View>

      {/* 3. Smart Control Settings Card with Colorful Icons */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(160)}
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          Smart Control Settings
        </ThemedText>

        {/* No Presence Timeout Stepper */}
        <View style={styles.settingItemRow}>
          <View style={styles.itemLabelCol}>
            <ColorfulIcon
              library="ionicons"
              name="timer"
              variant="cyan"
              size={18}
              containerSize={38}
            />
            <View>
              <ThemedText style={[styles.itemLabel, { color: colors.text }]}>
                No Presence Timeout
              </ThemedText>
              <ThemedText style={[styles.itemLabelSub, { color: colors.textSecondary }]}>
                Turn off lights after vacancy
              </ThemedText>
            </View>
          </View>

          <View style={[styles.stepperContainer, { backgroundColor: colors.inputBg }]}>
            <Pressable
              style={({ pressed }) => [
                styles.stepperBtn,
                { backgroundColor: colors.card },
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
              onPress={handleDecTimeout}>
              <Ionicons name="remove" size={16} color={colors.primary} />
            </Pressable>
            <ThemedText style={[styles.stepperValText, { color: colors.text }]}>
              {timeoutMins} min
            </ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.stepperBtn,
                { backgroundColor: colors.card },
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
              onPress={handleIncTimeout}>
              <Ionicons name="add" size={16} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Individual Timeout Update Action */}
        <View style={styles.singleActionRow}>
          {timeoutStatus && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={{ flex: 1 }}>
              <ThemedText
                style={[
                  styles.inlineStatusText,
                  { color: timeoutStatus.startsWith('✓') ? colors.success : colors.danger },
                ]}>
                {timeoutStatus}
              </ThemedText>
            </Animated.View>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.singleUpdateBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
              isSavingTimeout && { opacity: 0.6 },
            ]}
            onPress={handleUpdateTimeout}
            disabled={isSavingTimeout}>
            {isSavingTimeout ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            )}
            <ThemedText style={styles.singleUpdateBtnText}>
              {isSavingTimeout ? 'Saving...' : `Update Timeout (${timeoutMins} min)`}
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Ultrasonic Distance Threshold */}
        <View style={styles.settingItemRow}>
          <View style={styles.itemLabelCol}>
            <ColorfulIcon
              library="material"
              name="ruler"
              variant="violet"
              size={18}
              containerSize={38}
            />
            <View>
              <ThemedText style={[styles.itemLabel, { color: colors.text }]}>
                Distance Threshold
              </ThemedText>
              <ThemedText style={[styles.itemLabelSub, { color: colors.textSecondary }]}>
                Proximity trigger limit (manual input)
              </ThemedText>
            </View>
          </View>

          {/* Editable Manual Input & Stepper */}
          <View
            style={[
              styles.distInputWrapper,
              { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
            ]}>
            <Pressable
              style={[styles.stepperBtn, { backgroundColor: colors.card }]}
              onPress={handleDecDist}>
              <Ionicons name="remove" size={15} color={colors.primary} />
            </Pressable>

            <View style={styles.distInputInner}>
              <TextInput
                style={[styles.distTextInput, { color: colors.text }]}
                value={distInputStr}
                onChangeText={handleDistTextChange}
                onBlur={handleDistBlur}
                keyboardType="numeric"
                maxLength={3}
                placeholder="50"
                placeholderTextColor={colors.textMuted}
                selectTextOnFocus
              />
              <ThemedText style={[styles.distUnitLabel, { color: colors.primary }]}>
                cm
              </ThemedText>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.stepperBtn,
                { backgroundColor: colors.card },
                pressed && { transform: [{ scale: 0.92 }] },
              ]}
              onPress={handleIncDist}>
              <Ionicons name="add" size={15} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Interactive Distance Threshold Bar */}
        <View style={styles.sliderTrackWrapper}>
          <View style={[styles.sliderTrack, { backgroundColor: colors.segmentBg }]}>
            <View
              style={[
                styles.sliderFill,
                {
                  width: `${Math.min(100, Math.max(0, (distanceThreshold / 200) * 100))}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <View style={styles.sliderMinMaxRow}>
            <ThemedText style={[styles.sliderSub, { color: colors.textMuted }]}>
              10 cm
            </ThemedText>
            <View style={styles.presetButtonsRow}>
              {[30, 50, 100, 150, 200].map((d) => (
                <Pressable
                  key={d}
                  style={({ pressed }) => [
                    styles.presetChip,
                    { backgroundColor: colors.inputBg },
                    distanceThreshold === d && [
                      styles.presetChipActive,
                      { backgroundColor: colors.primary },
                    ],
                    pressed && { transform: [{ scale: 0.93 }] },
                  ]}
                  onPress={() => {
                    setDistanceThreshold(d);
                    setDistInputStr(String(d));
                  }}>
                  <ThemedText
                    style={[
                      styles.presetChipText,
                      { color: colors.textSecondary },
                      distanceThreshold === d && styles.presetChipTextActive,
                    ]}>
                    {d}cm
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText style={[styles.sliderSub, { color: colors.textMuted }]}>
              200 cm
            </ThemedText>
          </View>
        </View>

        {/* Individual Distance Update Action */}
        <View style={styles.singleActionRow}>
          {distStatus && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={{ flex: 1 }}>
              <ThemedText
                style={[
                  styles.inlineStatusText,
                  { color: distStatus.startsWith('✓') ? colors.success : colors.danger },
                ]}>
                {distStatus}
              </ThemedText>
            </Animated.View>
          )}
          <Pressable
            style={({ pressed }) => [
              styles.singleUpdateBtn,
              { backgroundColor: colors.primary },
              pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
              isSavingDist && { opacity: 0.6 },
            ]}
            onPress={handleUpdateDistance}
            disabled={isSavingDist}>
            {isSavingDist ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
            )}
            <ThemedText style={styles.singleUpdateBtnText}>
              {isSavingDist ? 'Saving...' : `Update Distance (${distanceThreshold} cm)`}
            </ThemedText>
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Which Lights to Control in Smart Control Mode */}
        <View style={styles.checkboxSection}>
          <ThemedText style={[styles.subHeading, { color: colors.textSecondary }]}>
            Which Lights to Control in Smart Control Mode
          </ThemedText>

          {/* Checkbox Light 1 */}
          <Pressable
            style={({ pressed }) => [
              styles.checkboxRow,
              pressed && { opacity: 0.8 },
            ]}
            onPress={toggleControlLoad1}>
            <View
              style={[
                styles.checkboxBox,
                { borderColor: colors.inputBorder },
                controlLoad1 && [
                  styles.checkboxBoxChecked,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                ],
              ]}>
              {controlLoad1 && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>
              Control Light 1 (5V DC Bulb)
            </ThemedText>
          </Pressable>

          {/* Checkbox Light 2 */}
          <Pressable
            style={({ pressed }) => [
              styles.checkboxRow,
              pressed && { opacity: 0.8 },
            ]}
            onPress={toggleControlLoad2}>
            <View
              style={[
                styles.checkboxBox,
                { borderColor: colors.inputBorder },
                controlLoad2 && [
                  styles.checkboxBoxChecked,
                  { backgroundColor: colors.primary, borderColor: colors.primary },
                ],
              ]}>
              {controlLoad2 && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <ThemedText style={[styles.checkboxLabel, { color: colors.text }]}>
              Control Light 2 (5V DC Bulb)
            </ThemedText>
          </Pressable>

          {/* Individual Target Lights Update Action */}
          <View style={styles.singleActionRow}>
            {targetStatus && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={{ flex: 1 }}>
                <ThemedText
                  style={[
                    styles.inlineStatusText,
                    { color: targetStatus.startsWith('✓') ? colors.success : colors.danger },
                  ]}>
                  {targetStatus}
                </ThemedText>
              </Animated.View>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.singleUpdateBtn,
                { backgroundColor: colors.primary },
                pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
                isSavingTarget && { opacity: 0.6 },
              ]}
              onPress={handleUpdateTarget}
              disabled={isSavingTarget}>
              {isSavingTarget ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark-sharp" size={14} color="#FFFFFF" />
              )}
              <ThemedText style={styles.singleUpdateBtnText}>
                {isSavingTarget ? 'Saving...' : 'Update Target Lights'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* 4. ESP32 Hardware & Tariff Configuration */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(210)}
        style={[
          styles.sectionCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}>
        <View style={styles.cardTitleWithIcon}>
          <ColorfulIcon
            library="ionicons"
            name="server"
            variant="blue"
            size={18}
            containerSize={38}
          />
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            ESP32 Device Settings
          </ThemedText>
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
            ESP32 IP Address
          </ThemedText>
          <View style={styles.inputWithActionRow}>
            <TextInput
              style={[
                styles.textInput,
                styles.inputFlex,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              value={tempIp}
              onChangeText={setTempIp}
              placeholder="192.168.1.100"
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleUpdateIp}
            />
            <Pressable
              style={({ pressed }) => [
                styles.singleUpdateBtn,
                { backgroundColor: colors.primary, height: 42, paddingHorizontal: 14 },
                pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
                isSavingIp && { opacity: 0.6 },
              ]}
              onPress={handleUpdateIp}
              disabled={isSavingIp}>
              <Ionicons name="link-outline" size={15} color="#FFFFFF" />
              <ThemedText style={styles.singleUpdateBtnText}>Update IP</ThemedText>
            </Pressable>
          </View>
          {ipStatus && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={{ flex: 1 }}>
              <ThemedText
                style={[
                  styles.inlineStatusText,
                  { color: ipStatus.startsWith('✓') ? colors.success : colors.danger },
                ]}>
                {ipStatus}
              </ThemedText>
            </Animated.View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <View>
            <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Tariff Rate (₹ per kWh)
            </ThemedText>
            <ThemedText style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
              Electricity board cost per unit (1 unit = 1 kWh) to calculate your power bill
            </ThemedText>
          </View>
          <View style={styles.inputWithActionRow}>
            <TextInput
              style={[
                styles.textInput,
                styles.inputFlex,
                {
                  backgroundColor: colors.inputBg,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              value={tempTariff}
              onChangeText={setTempTariff}
              keyboardType="numeric"
              placeholder="8.0"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable
              style={({ pressed }) => [
                styles.singleUpdateBtn,
                { backgroundColor: colors.primary, height: 42, paddingHorizontal: 14 },
                pressed && { transform: [{ scale: 0.96 }], opacity: 0.85 },
                isSavingTariff && { opacity: 0.6 },
              ]}
              onPress={handleUpdateTariff}
              disabled={isSavingTariff}>
              {isSavingTariff ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="cash-outline" size={15} color="#FFFFFF" />
              )}
              <ThemedText style={styles.singleUpdateBtnText}>
                {isSavingTariff ? 'Saving...' : 'Update Tariff'}
              </ThemedText>
            </Pressable>
          </View>
          {tariffStatus && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
              style={{ flex: 1 }}>
              <ThemedText
                style={[
                  styles.inlineStatusText,
                  { color: tariffStatus.startsWith('✓') ? colors.success : colors.danger },
                ]}>
                {tariffStatus}
              </ThemedText>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      {/* 5. Reset Energy Counter */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(260)}
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.card,
            borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
          },
        ]}>
        <View style={styles.cardTitleWithIcon}>
          <ColorfulIcon
            library="ionicons"
            name="trash"
            variant="rose"
            size={18}
            containerSize={38}
          />
          <ThemedText style={[styles.sectionTitle, { color: '#EF4444' }]}>
            Reset Cumulative Energy
          </ThemedText>
        </View>
        <ThemedText style={[styles.resetDesc, { color: colors.textSecondary }]}>
          Zero out accumulated kilowatt-hours (kWh) and cost for a new test cycle.
        </ThemedText>

        <Pressable
          style={({ pressed }) => [
            styles.resetBtn,
            pressed && { transform: [{ scale: 0.97 }], opacity: 0.85 },
          ]}
          onPress={handleResetConfirm}>
          <ThemedText style={styles.resetBtnText}>Reset Energy to 0.000 kWh</ThemedText>
        </Pressable>
      </Animated.View>

      {/* 6. Official App Brand Card */}
      <Animated.View
        entering={FadeInDown.duration(340).delay(300)}
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
            alignItems: 'center',
            paddingVertical: 22,
          },
        ]}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', marginBottom: 10 }}
          resizeMode="cover"
        />
        <ThemedText style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
          Smart Energy Meter
        </ThemedText>
        <ThemedText style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          Live IoT Power & Room Automation
        </ThemedText>
        <ThemedText style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
          Version 1.0.0 • Pure 5V DC Edition
        </ThemedText>
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
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  themeOptionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  themeOptionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    gap: 4,
  },
  themeOptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  themeRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeOptionSub: {
    fontSize: 10,
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
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  itemLabelSub: {
    fontSize: 10,
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 3,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValText: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
  },
  distBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  distBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  distInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  distInputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    minWidth: 54,
  },
  distTextInput: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    minWidth: 28,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  distUnitLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  sliderTrackWrapper: {
    gap: 8,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 4,
  },
  sliderMinMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderSub: {
    fontSize: 10,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  presetChipActive: {},
  presetChipText: {
    fontSize: 10,
    fontWeight: '700',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  checkboxSection: {
    gap: 10,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {},
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  saveStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  resetDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 12,
  },
  cardActionRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    gap: 8,
  },
  singleActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  singleUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  singleUpdateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  inlineStatusText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  inputWithActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputFlex: {
    flex: 1,
  },
  individualUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  individualUpdateBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  smartStatusBadge: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smartStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
