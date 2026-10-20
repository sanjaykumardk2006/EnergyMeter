import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';
import { RealisticBulb } from './RealisticBulb';

interface Props {
  visible: boolean;
  loadId: 1 | 2;
  isOn: boolean;
  autoMode: boolean;
  currentAmps: number;
  voltage: number;
  tariffRate: number;
  onToggle: () => void;
  onClose: () => void;
}

export function LoadDetailModal({
  visible,
  loadId,
  isOn,
  autoMode,
  currentAmps,
  voltage,
  onToggle,
  onClose,
}: Props) {
  const { colors, isDark } = useTheme();

  // Approximate load share if active
  const loadAmps = isOn ? (currentAmps > 0 ? currentAmps / 2 : 0.42) : 0.0;
  const loadWatts = loadAmps * voltage;
  const loadKwhToday = (loadWatts * 2.5) / 1000;
  const topModalPadding = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 6 : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalRoot, { backgroundColor: colors.background }]}>
        {/* Header Bar */}
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.cardBorder,
              paddingTop: 12 + topModalPadding,
            },
          ]}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
            <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
              Light {loadId} Control
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Light Hero Area with Clean Squircle Lightbulb */}
          <View style={styles.heroSection}>
            <RealisticBulb isOn={isOn} size={52} />

            <ThemedText style={[styles.loadTitle, { color: colors.text }]}>Light {loadId}</ThemedText>
            <ThemedText style={[styles.loadSubtitle, { color: colors.textSecondary }]}>
              5V DC Relay Load
            </ThemedText>

            {/* Big Toggle Switch */}
            <View style={styles.switchWrapper}>
              <Switch
                value={isOn}
                onValueChange={onToggle}
                trackColor={{ false: isDark ? '#334155' : '#CBD5E1', true: colors.primary }}
                thumbColor="#FFFFFF"
                style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
              />
            </View>

            {/* State Banner */}
            <View
              style={[
                styles.stateBanner,
                {
                  backgroundColor: isOn
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.2)'
                      : '#DCFCE7'
                    : isDark
                    ? 'rgba(239, 68, 68, 0.2)'
                    : '#FEE2E2',
                  borderColor: isOn
                    ? colors.primaryBorder
                    : isDark
                    ? 'rgba(239, 68, 68, 0.4)'
                    : '#FCA5A5',
                },
              ]}>
              <ThemedText
                style={[
                  styles.stateBannerText,
                  { color: isOn ? colors.primary : colors.danger },
                ]}>
                {isOn ? '● Light is ON • Glowing' : '● Light is OFF'}
              </ThemedText>
            </View>
          </View>

          {/* Details Card with Colorful Realistic Badges */}
          <View
            style={[
              styles.detailsCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <ColorfulIcon
                  library="material"
                  name={autoMode ? 'robot' : 'gesture-tap'}
                  variant={autoMode ? 'emerald' : 'amber'}
                  size={16}
                  containerSize={32}
                />
                <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Control Mode
                </ThemedText>
              </View>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {autoMode ? 'Smart Control' : 'Manual Control'}
              </ThemedText>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <ColorfulIcon
                  library="material"
                  name="sine-wave"
                  variant="cyan"
                  size={16}
                  containerSize={32}
                />
                <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Current
                </ThemedText>
              </View>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {loadAmps.toFixed(2)} A
              </ThemedText>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <ColorfulIcon
                  library="ionicons"
                  name="speedometer"
                  variant="orange"
                  size={16}
                  containerSize={32}
                />
                <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Power
                </ThemedText>
              </View>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {loadWatts.toFixed(2)} W
              </ThemedText>
            </View>

            <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <ColorfulIcon
                  library="ionicons"
                  name="battery-charging"
                  variant="violet"
                  size={16}
                  containerSize={32}
                />
                <ThemedText style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Energy (Today)
                </ThemedText>
              </View>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {loadKwhToday.toFixed(3)} kWh
              </ThemedText>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  content: {
    padding: 20,
    gap: 20,
  },
  heroSection: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  loadSubtitle: {
    fontSize: 13,
    marginTop: -6,
  },
  switchWrapper: {
    marginVertical: 6,
  },
  stateBanner: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowDivider: {
    height: 1,
  },
});
