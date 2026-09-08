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
    isMockMode,
    updateConfig,
    resetEnergy,
  } = useEnergyMeter();

  const [load1, setLoad1] = useState(String(status?.load1_watts ?? 60));
  const [load2, setLoad2] = useState(String(status?.load2_watts ?? 1200));
  const [voltage, setVoltage] = useState(String(status?.voltage ?? 230));
  const [tariff, setTariff] = useState(String(status?.tariff_rate ?? 8));
  const [delaySec, setDelaySec] = useState(String(status?.auto_off_delay_sec ?? 180));
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
    const l1 = parseFloat(load1);
    const l2 = parseFloat(load2);
    const v = parseFloat(voltage);
    const t = parseFloat(tariff);
    const d = parseInt(delaySec, 10);

    if (isNaN(l1) || isNaN(l2) || isNaN(v) || isNaN(t) || isNaN(d)) {
      if (Platform.OS === 'web') {
        window.alert('Please enter valid numeric values');
      } else {
        Alert.alert('Invalid Input', 'Please enter valid numeric values');
      }
      return;
    }

    const ok = await updateConfig({
      load1_watts: l1,
      load2_watts: l2,
      grid_voltage: v,
      tariff_rate: t,
      auto_off_delay_sec: d,
    });

    if (ok) {
      setSaveStatus('✓ Settings saved to ESP32 Flash!');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus('❌ Failed to update settings');
    }
  };

  const handleReset = async () => {
    const confirmAction = async () => {
      await resetEnergy();
      if (Platform.OS === 'web') {
        window.alert('Cumulative energy reset to 0 kWh');
      } else {
        Alert.alert('Reset Complete', 'Cumulative energy has been reset to 0 kWh');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Reset cumulative energy counter to 0.0 kWh?')) {
        await confirmAction();
      }
    } else {
      Alert.alert(
        'Reset Energy Counter',
        'Are you sure you want to reset accumulated kWh to 0.0000?',
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
          <ThemedText type="subtitle">⚙️ Device & Hardware Setup</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">
            Wiring Reference, Power Calibration & System Diagnostics
          </ThemedText>
        </View>

        {/* 1. Hardware Pinout Reference */}
        <Collapsible title="🔌 Hardware Wiring Reference">
          <ThemedView type="backgroundElement" style={styles.innerBox}>
            <ThemedText type="smallBold" style={{ color: '#0284C7' }}>
              Your Connected ESP32 Pinout:
            </ThemedText>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">1. IR Sensor:</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                DO → <ThemedText type="code">GPIO 26</ThemedText> | VCC → 3V3 | GND → GND
              </ThemedText>
            </View>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">2. PIR Sensor:</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                OUT → <ThemedText type="code">GPIO 27</ThemedText> | VCC → VIN/5V | GND → GND
              </ThemedText>
            </View>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">3. HC-SR04 Ultrasonic:</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                TRIG → <ThemedText type="code">GPIO 5</ThemedText> | ECHO → <ThemedText type="code">GPIO 18</ThemedText> (via 1k/2k divider)
              </ThemedText>
            </View>

            <View style={styles.pinRow}>
              <ThemedText type="smallBold">4. Relays (Dual Channel):</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                IN1 (Load 1) → <ThemedText type="code">GPIO 25</ThemedText> | IN2 (Load 2) → <ThemedText type="code">GPIO 33</ThemedText>
              </ThemedText>
            </View>

            <View style={styles.divider} />
            <ThemedText type="small" style={{ fontStyle: 'italic', color: '#F59E0B' }}>
              ⚠️ Voltage Divider for Echo: 1kΩ resistor from HC-SR04 ECHO to GPIO 18, and 2kΩ from GPIO 18 to GND to step 5V down to ~3.3V safely.
            </ThemedText>
          </ThemedView>
        </Collapsible>

        {/* 2. Appliance & Energy Calibration */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionHeading}>
            ⚡ APPLIANCE POWER & TARIFF CONFIGURATION
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Set rated wattage for connected loads to ensure accurate kWh accumulation.
          </ThemedText>

          <View style={styles.inputGrid}>
            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Load 1 Rating (Watts)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={load1}
                onChangeText={setLoad1}
                placeholder="60"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Load 2 Rating (Watts)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={load2}
                onChangeText={setLoad2}
                placeholder="1200"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="smallBold">Grid Voltage (V)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={voltage}
                onChangeText={setVoltage}
                placeholder="230"
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
              <ThemedText type="smallBold">Auto-Off Vacancy Delay (Seconds)</ThemedText>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                keyboardType="numeric"
                value={delaySec}
                onChangeText={setDelaySec}
                placeholder="180"
              />
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
            <ThemedText style={styles.saveBtnText}>Save Calibration to ESP32</ThemedText>
          </Pressable>
        </ThemedView>

        {/* 3. Energy Counter Reset */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={{ color: '#EF4444' }}>
            🗑️ RESET ENERGY COUNTER
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Zero out accumulated kilowatt-hours (kWh) and cost for a new billing cycle.
          </ThemedText>

          <Pressable
            style={({ pressed }) => [styles.resetBtn, { opacity: pressed ? 0.8 : 1 }]}
            onPress={handleReset}>
            <ThemedText style={styles.resetBtnText}>Reset Energy Meter to 0.0 kWh</ThemedText>
          </Pressable>
        </ThemedView>

        {/* 4. Live Diagnostics / Raw JSON Viewer */}
        <Collapsible title="📊 Raw ESP32 JSON Diagnostics">
          <ThemedView type="backgroundElement" style={styles.innerBox}>
            <ThemedText type="small" themeColor="textSecondary">
              Endpoint: <ThemedText type="code">http://{ipAddress}/api/status</ThemedText>
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Mode: {isMockMode ? 'Simulated Offline Demo' : 'Live ESP32 Device'}
            </ThemedText>
            <View style={[styles.codeBox, { backgroundColor: theme.background }]}>
              <ThemedText type="code" style={styles.codeText}>
                {status ? JSON.stringify(status, null, 2) : 'No data received'}
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
