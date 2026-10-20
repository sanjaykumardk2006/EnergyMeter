import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useEnergyMeter } from '@/hooks/useEnergyMeter';
import { useTheme } from '@/hooks/use-theme';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const {
    status,
    ipAddress,
    updateConfig,
    resetEnergy,
  } = useEnergyMeter();

  const [voltage, setVoltage] = useState(String(status?.voltage ?? 5.0));
  const [tariff, setTariff] = useState(String(status?.tariff_rate ?? 8));
  const [delaySec, setDelaySec] = useState(String(status?.auto_off_delay_sec ?? 300));
  const [calibI, setCalibI] = useState(String(status?.calib_i ?? 1.0));
  const [acsSens, setAcsSens] = useState(String(status?.acs_sensitivity ?? 0.100));
  const [autoTarget, setAutoTarget] = useState<1 | 2 | 3>(status?.auto_target ?? 3);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top + Spacing.two,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.four,
      paddingBottom: Spacing.six,
    },
    default: {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
  });

  const handleSaveConfig = async () => {
    const v = parseFloat(voltage);
    const t = parseFloat(tariff);
    const d = parseInt(delaySec, 10);
    const ci = parseFloat(calibI);
    const sens = parseFloat(acsSens);

    if (isNaN(v) || isNaN(t) || isNaN(d) || isNaN(ci) || isNaN(sens)) {
      if (Platform.OS === 'web') {
        window.alert('Please enter valid numeric values for all calibration fields.');
      } else {
        Alert.alert('Invalid Input', 'Please enter valid numeric values for all calibration fields.');
      }
      return;
    }

    const ok = await updateConfig({
      grid_voltage: v,
      tariff_rate: t,
      auto_off_delay_sec: d,
      calib_i: ci,
      acs_sens: sens,
      auto_target: autoTarget,
    });

    if (ok) {
      setSaveStatus('✓ Settings saved to ESP32 Flash memory!');
      setTimeout(() => setSaveStatus(null), 3500);
    } else {
      setSaveStatus('❌ Failed to update settings on ESP32.');
    }
  };

  const handleReset = async () => {
    const confirmAction = async () => {
      await resetEnergy();
      if (Platform.OS === 'web') {
        window.alert('Cumulative energy counter reset to 0.0 Wh / 0.0 kWh');
      } else {
        Alert.alert('Reset Complete', 'Cumulative energy has been reset to 0.0 Wh / 0.0 kWh');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset cumulative energy counter to 0.0 kWh?')) {
        await confirmAction();
      }
    } else {
      Alert.alert(
        'Reset Energy Counter',
        'Are you sure you want to reset accumulated energy (Wh & kWh) to 0.0000?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: confirmAction },
        ]
      );
    }
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      showsVerticalScrollIndicator={false}>
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.titleContainer}>
          <ThemedText type="subtitle">⚙️ 5V DC System Setup & Wiring</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Pin Reference, ACS712 Calibration & Auto-Mode Parameters
          </ThemedText>
        </View>

        {/* 1. Hardware Pinout Reference */}
        <Collapsible title="🔌 5V DC Prototype Hardware Wiring Reference">
          <ThemedView type="backgroundElement" style={styles.innerBox}>
            <ThemedText type="smallBold" style={{ color: '#0284C7' }}>
              Pin Connections for 5V DC Prototype:
            </ThemedText>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">1. IR Obstacle Sensor:</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                DO → <ThemedText type="code">GPIO 26</ThemedText> (Digital IN, Active-LOW) | VCC → 3.3V/5V | GND → GND
              </ThemedText>
            </View>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">2. PIR Motion Sensor:</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                OUT → <ThemedText type="code">GPIO 27</ThemedText> (Digital IN, Active-HIGH) | VCC → 5V | GND → GND
              </ThemedText>
            </View>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">3. HC-SR04 Ultrasonic Sensor:</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                TRIG → <ThemedText type="code">GPIO 5</ThemedText> (3.3V OUT) | ECHO → <ThemedText type="code">GPIO 18</ThemedText> (via 1kΩ/2kΩ voltage divider!)
              </ThemedText>
            </View>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">4. Dual 5V Relay Module:</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                IN1 (Load 1: 5V DC Bulb) → <ThemedText type="code">GPIO 25</ThemedText> | IN2 (Load 2: 5V DC Bulb) → <ThemedText type="code">GPIO 33</ThemedText> (Active-LOW: LOW=ON, HIGH=OFF)
              </ThemedText>
            </View>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">5. Current Sensor (ACS712):</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                OUT → <ThemedText type="code">GPIO 34</ThemedText> (ADC1 CH6 - WiFi Safe) | VCC → 5V | In series with common 5V supply to BOTH bulb relays
              </ThemedText>
            </View>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">6. Common DC Voltage:</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Common 5.0V DC bus feeding Load 1 and Load 2 (Optional voltage divider to <ThemedText type="code">GPIO 35</ThemedText>)
              </ThemedText>
            </View>

            <View style={styles.divider} />
            <ThemedText type="small" style={{ fontStyle: 'italic', color: '#EF4444' }}>
              ⚠️ SAFETY NOTICE: This prototype is strictly 5V DC. DO NOT connect 230V AC mains to this prototype. Always use a voltage divider on HC-SR04 ECHO (ESP32 inputs cannot accept 5V).
            </ThemedText>
          </ThemedView>
        </Collapsible>

        {/* 2. Calibration & System Settings */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionHeading}>
            ⚡ 5V DC CALIBRATION & AUTOMATION SETTINGS
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Configure nominal DC supply voltage, ACS712 module sensitivity, and occupancy timeout.
          </ThemedText>

          <View style={styles.inputGrid}>
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Common DC Voltage (V)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={voltage}
                onChangeText={setVoltage}
                placeholder="5.0"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">ACS712 Sensitivity (V/A)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={acsSens}
                onChangeText={setAcsSens}
                placeholder="0.100 (20A) or 0.185 (5A)"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Current Calib Multiplier</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={calibI}
                onChangeText={setCalibI}
                placeholder="1.0"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Tariff Rate (₹ per kWh)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={tariff}
                onChangeText={setTariff}
                placeholder="8.0"
              />
            </View>

            <View style={styles.inputGroupFull}>
              <ThemedText type="smallBold">No-Occupancy Timeout (Seconds)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={delaySec}
                onChangeText={setDelaySec}
                placeholder="300 (5 minutes)"
              />
              <ThemedText type="small" themeColor="textSecondary">
                Default: 300 seconds (5 minutes). Loads turn OFF only after room stays vacant for this period.
              </ThemedText>
            </View>

            <View style={styles.inputGroupFull}>
              <ThemedText type="smallBold">Automatic Mode Target Load:</ThemedText>
              <View style={styles.targetRow}>
                <Pressable
                  style={[styles.chipBtn, autoTarget === 1 && styles.chipBtnActive]}
                  onPress={() => setAutoTarget(1)}>
                  <ThemedText style={[styles.chipText, autoTarget === 1 && styles.chipTextActive]}>
                    Load 1
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.chipBtn, autoTarget === 2 && styles.chipBtnActive]}
                  onPress={() => setAutoTarget(2)}>
                  <ThemedText style={[styles.chipText, autoTarget === 2 && styles.chipTextActive]}>
                    Load 2
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.chipBtn, autoTarget === 3 && styles.chipBtnActive]}
                  onPress={() => setAutoTarget(3)}>
                  <ThemedText style={[styles.chipText, autoTarget === 3 && styles.chipTextActive]}>
                    Both Loads (1 & 2)
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>

          {saveStatus && (
            <ThemedText
              type="smallBold"
              style={{ color: saveStatus.startsWith('✓') ? '#10B981' : '#EF4444' }}>
              {saveStatus}
            </ThemedText>
          )}

          <Pressable
            style={({ pressed }) => [styles.saveBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleSaveConfig}>
            <ThemedText style={styles.saveBtnText}>Save Parameters to ESP32 Flash</ThemedText>
          </Pressable>
        </ThemedView>

        {/* 3. Energy Counter Reset */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={{ color: '#EF4444' }}>
            🗑️ RESET ACCUMULATED ENERGY
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Zero out accumulated Wh, kWh, and cost calculations for a new measurement session.
          </ThemedText>

          <Pressable
            style={({ pressed }) => [styles.resetBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleReset}>
            <ThemedText style={styles.resetBtnText}>Reset Energy Meter to 0.0 Wh / 0.0 kWh</ThemedText>
          </Pressable>
        </ThemedView>

        {/* 4. Live Diagnostics / Raw JSON Viewer */}
        <Collapsible title="📊 Raw ESP32 JSON Diagnostics">
          <ThemedView type="backgroundElement" style={styles.innerBox}>
            <ThemedText type="small" themeColor="textSecondary">
              Endpoint: <ThemedText type="code">http://{ipAddress}/api/status</ThemedText>
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Active Reason: {status?.last_action_reason || 'System Initialized'}
            </ThemedText>
            <View style={[styles.codeBox, { backgroundColor: theme.background }]}>
              <ThemedText type="code" style={styles.codeText}>
                {status ? JSON.stringify(status, null, 2) : 'No data received from ESP32'}
              </ThemedText>
            </View>
          </ThemedView>
        </Collapsible>

        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  titleContainer: {
    gap: Spacing.one,
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  centerText: {
    textAlign: 'center',
  },
  innerBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
  },
  pinRow: {
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginVertical: Spacing.one,
  },
  sectionCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionHeading: {
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  inputGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  inputGroup: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: 4,
  },
  inputGroupFull: {
    width: '100%',
    gap: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    fontSize: 14,
  },
  targetRow: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginTop: 4,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    alignItems: 'center',
  },
  chipBtnActive: {
    backgroundColor: '#0284C7',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  resetBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  resetBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
  codeBox: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    maxHeight: 250,
  },
  codeText: {
    fontSize: 11,
  },
});
