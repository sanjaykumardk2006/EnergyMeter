import React, { useState } from 'react';
import {
  Alert,
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
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';

interface Props {
  autoMode: boolean;
  autoTarget: 1 | 2 | 3;
  autoOffDelaySec: number;
  ipAddress: string;
  tariffRate: number;
  voltage: number;
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
  ipAddress,
  tariffRate,
  voltage,
  onToggleAutoMode,
  onUpdateTarget,
  onUpdateDelay,
  onSaveConfig,
  onResetEnergy,
  onIpChange,
  onOpenSystemStatus,
}: Props) {
  const { colors, isDark, setTheme, toggleTheme } = useTheme();
  const [timeoutMins, setTimeoutMins] = useState(Math.max(1, Math.round(autoOffDelaySec / 60)));
  const [distanceThreshold, setDistanceThreshold] = useState(50);
  const [tempIp, setTempIp] = useState(ipAddress);
  const [tempTariff, setTempTariff] = useState(String(tariffRate));
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Stepper handlers
  const handleDecTimeout = () => {
    if (timeoutMins > 1) {
      const next = timeoutMins - 1;
      setTimeoutMins(next);
      onUpdateDelay(next * 60);
    }
  };

  const handleIncTimeout = () => {
    if (timeoutMins < 60) {
      const next = timeoutMins + 1;
      setTimeoutMins(next);
      onUpdateDelay(next * 60);
    }
  };

  // Target checkboxes
  const controlLoad1 = autoTarget === 1 || autoTarget === 3;
  const controlLoad2 = autoTarget === 2 || autoTarget === 3;

  const toggleControlLoad1 = () => {
    if (controlLoad1 && controlLoad2) {
      onUpdateTarget(2); // keep only load 2
    } else if (!controlLoad1 && controlLoad2) {
      onUpdateTarget(3); // both
    } else {
      onUpdateTarget(1);
    }
  };

  const toggleControlLoad2 = () => {
    if (controlLoad1 && controlLoad2) {
      onUpdateTarget(1); // keep only load 1
    } else if (controlLoad1 && !controlLoad2) {
      onUpdateTarget(3); // both
    } else {
      onUpdateTarget(2);
    }
  };

  const handleSaveAll = async () => {
    const tariff = parseFloat(tempTariff);
    const ok = await onSaveConfig({
      auto_off_delay_sec: timeoutMins * 60,
      auto_target: autoTarget,
      tariff_rate: isNaN(tariff) ? 8.0 : tariff,
    });
    if (ok) {
      setSaveStatus('✓ Settings saved to ESP32 Flash!');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('❌ Failed to save configuration');
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
      <View style={styles.headerRow}>
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
          style={[
            styles.statusBtn,
            { backgroundColor: colors.primaryTint, borderColor: colors.primaryBorder },
          ]}
          onPress={onOpenSystemStatus}>
          <Ionicons name="pulse" size={14} color={colors.primary} style={{ marginRight: 4 }} />
          <ThemedText style={[styles.statusBtnText, { color: colors.primary }]}>
            System Status ›
          </ThemedText>
        </Pressable>
      </View>

      {/* 1. Theme & Appearance Switcher Card with Colorful Badges */}
      <View
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
            style={[
              styles.themeOptionCard,
              {
                backgroundColor: !isDark ? (isDark ? '#1C2E24' : '#F0FDF4') : colors.inputBg,
                borderColor: !isDark ? colors.primary : colors.cardBorder,
              },
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
            style={[
              styles.themeOptionCard,
              {
                backgroundColor: isDark ? '#16281E' : colors.inputBg,
                borderColor: isDark ? colors.primary : colors.cardBorder,
              },
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
      </View>

      {/* 2. Control Mode Card with Colorful Icons */}
      <View
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
            style={[
              styles.modeSegment,
              !autoMode
                ? [styles.modeSegmentActive, { backgroundColor: colors.primary }]
                : { backgroundColor: 'transparent' },
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
            style={[
              styles.modeSegment,
              autoMode
                ? [styles.modeSegmentActive, { backgroundColor: colors.primary }]
                : { backgroundColor: 'transparent' },
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
      </View>

      {/* 3. Smart Control Settings Card with Colorful Icons */}
      <View
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
              style={[styles.stepperBtn, { backgroundColor: colors.card }]}
              onPress={handleDecTimeout}>
              <Ionicons name="remove" size={16} color={colors.primary} />
            </Pressable>
            <ThemedText style={[styles.stepperValText, { color: colors.text }]}>
              {timeoutMins} min
            </ThemedText>
            <Pressable
              style={[styles.stepperBtn, { backgroundColor: colors.card }]}
              onPress={handleIncTimeout}>
              <Ionicons name="add" size={16} color={colors.primary} />
            </Pressable>
          </View>
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
                Proximity trigger limit
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.distBadge,
              { backgroundColor: colors.primaryTint, borderColor: colors.primaryBorder },
            ]}>
            <ThemedText style={[styles.distBadgeText, { color: colors.primary }]}>
              {distanceThreshold} cm
            </ThemedText>
          </View>
        </View>

        {/* Interactive Distance Threshold Bar */}
        <View style={styles.sliderTrackWrapper}>
          <View style={[styles.sliderTrack, { backgroundColor: colors.segmentBg }]}>
            <View
              style={[
                styles.sliderFill,
                {
                  width: `${(distanceThreshold / 200) * 100}%`,
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
              {[30, 50, 100, 150].map((d) => (
                <Pressable
                  key={d}
                  style={[
                    styles.presetChip,
                    { backgroundColor: colors.inputBg },
                    distanceThreshold === d && [
                      styles.presetChipActive,
                      { backgroundColor: colors.primary },
                    ],
                  ]}
                  onPress={() => setDistanceThreshold(d)}>
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

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {/* Which Lights to Control in Smart Control Mode */}
        <View style={styles.checkboxSection}>
          <ThemedText style={[styles.subHeading, { color: colors.textSecondary }]}>
            Which Lights to Control in Smart Control Mode
          </ThemedText>

          {/* Checkbox Light 1 */}
          <Pressable style={styles.checkboxRow} onPress={toggleControlLoad1}>
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
          <Pressable style={styles.checkboxRow} onPress={toggleControlLoad2}>
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
        </View>
      </View>

      {/* 4. ESP32 Hardware & Tariff Configuration */}
      <View
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
          <TextInput
            style={[
              styles.textInput,
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
            onSubmitEditing={() => onIpChange(tempIp)}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Tariff Rate (₹ per kWh)
          </ThemedText>
          <TextInput
            style={[
              styles.textInput,
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
        </View>

        {saveStatus && (
          <ThemedText
            style={[
              styles.saveStatusText,
              { color: saveStatus.startsWith('✓') ? colors.success : colors.danger },
            ]}>
            {saveStatus}
          </ThemedText>
        )}

        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSaveAll}>
          <View style={styles.btnContentRow}>
            <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" />
            <ThemedText style={styles.saveBtnText}>Save All Settings to ESP32</ThemedText>
          </View>
        </Pressable>
      </View>

      {/* 5. Reset Energy Counter */}
      <View
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

        <Pressable style={styles.resetBtn} onPress={handleResetConfirm}>
          <ThemedText style={styles.resetBtnText}>Reset Energy to 0.000 kWh</ThemedText>
        </Pressable>
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
});
