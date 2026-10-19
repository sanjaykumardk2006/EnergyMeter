import React, { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

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
      style={styles.scrollArea}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconCircle}>
          <ThemedText style={styles.headerIcon}>⚙️</ThemedText>
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.headerTitle}>Settings</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Automation Rules & Device Configuration
          </ThemedText>
        </View>

        <Pressable style={styles.statusBtn} onPress={onOpenSystemStatus}>
          <ThemedText style={styles.statusBtnText}>System Status ›</ThemedText>
        </Pressable>
      </View>

      {/* 1. Operation Mode Card */}
      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionTitle}>Operation Mode</ThemedText>
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
      </View>

      {/* 2. Automation Settings Card (Screen 5) */}
      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionTitle}>Automation Settings</ThemedText>

        {/* No Presence Timeout Stepper */}
        <View style={styles.settingItemRow}>
          <View style={styles.itemLabelCol}>
            <View style={[styles.itemIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <ThemedText style={styles.itemIcon}>⏱️</ThemedText>
            </View>
            <ThemedText style={styles.itemLabel}>No Presence Timeout</ThemedText>
          </View>

          <View style={styles.stepperContainer}>
            <Pressable style={styles.stepperBtn} onPress={handleDecTimeout}>
              <ThemedText style={styles.stepperBtnText}>−</ThemedText>
            </Pressable>
            <ThemedText style={styles.stepperValText}>
              {timeoutMins} min
            </ThemedText>
            <Pressable style={styles.stepperBtn} onPress={handleIncTimeout}>
              <ThemedText style={styles.stepperBtnText}>+</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Ultrasonic Distance Threshold Slider */}
        <View style={styles.settingItemRow}>
          <View style={styles.itemLabelCol}>
            <View style={[styles.itemIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <ThemedText style={styles.itemIcon}>📏</ThemedText>
            </View>
            <ThemedText style={styles.itemLabel}>
              Ultrasonic Distance Threshold
            </ThemedText>
          </View>

          <View style={styles.distBadge}>
            <ThemedText style={styles.distBadgeText}>
              {distanceThreshold} cm
            </ThemedText>
          </View>
        </View>

        {/* Interactive Distance Threshold Bar */}
        <View style={styles.sliderTrackWrapper}>
          <View style={styles.sliderTrack}>
            <View
              style={[
                styles.sliderFill,
                { width: `${(distanceThreshold / 200) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.sliderMinMaxRow}>
            <ThemedText style={styles.sliderSub}>10 cm</ThemedText>
            <View style={styles.presetButtonsRow}>
              {[30, 50, 100, 150].map((d) => (
                <Pressable
                  key={d}
                  style={[
                    styles.presetChip,
                    distanceThreshold === d && styles.presetChipActive,
                  ]}
                  onPress={() => setDistanceThreshold(d)}>
                  <ThemedText
                    style={[
                      styles.presetChipText,
                      distanceThreshold === d && styles.presetChipTextActive,
                    ]}>
                    {d}cm
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText style={styles.sliderSub}>200 cm</ThemedText>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Which Loads to Control in Automatic Mode */}
        <View style={styles.checkboxSection}>
          <ThemedText style={styles.subHeading}>
            Which Loads to Control in Automatic Mode
          </ThemedText>

          {/* Checkbox Load 1 */}
          <Pressable style={styles.checkboxRow} onPress={toggleControlLoad1}>
            <View
              style={[
                styles.checkboxBox,
                controlLoad1 && styles.checkboxBoxChecked,
              ]}>
              {controlLoad1 && <ThemedText style={styles.checkMark}>✓</ThemedText>}
            </View>
            <ThemedText style={styles.checkboxLabel}>Control Load 1 (5V DC Bulb)</ThemedText>
          </Pressable>

          {/* Checkbox Load 2 */}
          <Pressable style={styles.checkboxRow} onPress={toggleControlLoad2}>
            <View
              style={[
                styles.checkboxBox,
                controlLoad2 && styles.checkboxBoxChecked,
              ]}>
              {controlLoad2 && <ThemedText style={styles.checkMark}>✓</ThemedText>}
            </View>
            <ThemedText style={styles.checkboxLabel}>Control Load 2 (5V DC Bulb)</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* 3. ESP32 Hardware & Tariff Configuration */}
      <View style={styles.sectionCard}>
        <ThemedText style={styles.sectionTitle}>ESP32 Device Settings</ThemedText>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>ESP32 IP Address</ThemedText>
          <TextInput
            style={styles.textInput}
            value={tempIp}
            onChangeText={setTempIp}
            placeholder="192.168.1.100"
            onSubmitEditing={() => onIpChange(tempIp)}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText style={styles.inputLabel}>Tariff Rate (₹ per kWh)</ThemedText>
          <TextInput
            style={styles.textInput}
            value={tempTariff}
            onChangeText={setTempTariff}
            keyboardType="numeric"
            placeholder="8.0"
          />
        </View>

        {saveStatus && (
          <ThemedText
            style={[
              styles.saveStatusText,
              { color: saveStatus.startsWith('✓') ? '#10B981' : '#EF4444' },
            ]}>
            {saveStatus}
          </ThemedText>
        )}

        <Pressable style={styles.saveBtn} onPress={handleSaveAll}>
          <ThemedText style={styles.saveBtnText}>Save All Settings to ESP32</ThemedText>
        </Pressable>
      </View>

      {/* 4. Reset Energy Counter */}
      <View style={[styles.sectionCard, { borderColor: '#FCA5A5' }]}>
        <ThemedText style={[styles.sectionTitle, { color: '#EF4444' }]}>
          🗑️ Reset Cumulative Energy
        </ThemedText>
        <ThemedText style={styles.resetDesc}>
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
  statusBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  sectionCard: {
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
    gap: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
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
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    fontSize: 16,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  stepperValText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  distBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  distBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  sliderTrackWrapper: {
    gap: 8,
  },
  sliderTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 4,
  },
  sliderMinMaxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  presetChipActive: {
    backgroundColor: '#2563EB',
  },
  presetChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  checkboxSection: {
    gap: 10,
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkMark: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: -2,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  textInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  saveStatusText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  resetDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  resetBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
});
