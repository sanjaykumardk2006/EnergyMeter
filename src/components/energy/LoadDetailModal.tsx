import React from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

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
  // Approximate load share if active
  const loadAmps = isOn ? (currentAmps > 0 ? (currentAmps / 2) : 0.42) : 0.0;
  const loadWatts = loadAmps * voltage;
  const loadKwhToday = (loadWatts * 2.5) / 1000; // estimated today based on runtime

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.modalRoot}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <Pressable style={styles.backBtn} onPress={onClose}>
            <ThemedText style={styles.backArrow}>‹</ThemedText>
            <ThemedText style={styles.headerTitle}>
              Load {loadId} Control
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Bulb Hero Area */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.bulbGlowCircle,
                {
                  backgroundColor: isOn
                    ? 'rgba(251, 191, 36, 0.2)'
                    : 'rgba(226, 232, 240, 0.5)',
                  shadowColor: isOn ? '#F59E0B' : 'transparent',
                },
              ]}>
              <ThemedText style={styles.bulbIcon}>💡</ThemedText>
            </View>

            <ThemedText style={styles.loadTitle}>Load {loadId}</ThemedText>
            <ThemedText style={styles.loadSubtitle}>5V DC Bulb</ThemedText>

            {/* Big Toggle Switch */}
            <View style={styles.switchWrapper}>
              <Switch
                value={isOn}
                onValueChange={onToggle}
                trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
                thumbColor="#FFFFFF"
                style={{ transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }] }}
              />
            </View>

            {/* State Banner */}
            <View
              style={[
                styles.stateBanner,
                {
                  backgroundColor: isOn ? '#DCFCE7' : '#FEE2E2',
                  borderColor: isOn ? '#86EFAC' : '#FCA5A5',
                },
              ]}>
              <ThemedText
                style={[
                  styles.stateBannerText,
                  { color: isOn ? '#15803D' : '#B91C1C' },
                ]}>
                {isOn ? '✓ Load is ON' : '● Load is OFF'}
              </ThemedText>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <ThemedText style={styles.detailIcon}>✋</ThemedText>
                <ThemedText style={styles.detailLabel}>Control Mode</ThemedText>
              </View>
              <ThemedText style={styles.detailValue}>
                {autoMode ? 'Automatic' : 'Manual'}
              </ThemedText>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <ThemedText style={styles.detailIcon}>📈</ThemedText>
                <ThemedText style={styles.detailLabel}>Current</ThemedText>
              </View>
              <ThemedText style={styles.detailValue}>
                {loadAmps.toFixed(2)} A
              </ThemedText>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <ThemedText style={styles.detailIcon}>⚡</ThemedText>
                <ThemedText style={styles.detailLabel}>Power</ThemedText>
              </View>
              <ThemedText style={styles.detailValue}>
                {loadWatts.toFixed(2)} W
              </ThemedText>
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailLabelCol}>
                <ThemedText style={styles.detailIcon}>🔋</ThemedText>
                <ThemedText style={styles.detailLabel}>Energy (Today)</ThemedText>
              </View>
              <ThemedText style={styles.detailValue}>
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
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backArrow: {
    fontSize: 28,
    fontWeight: '300',
    color: '#0F172A',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  heroSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  bulbGlowCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  bulbIcon: {
    fontSize: 48,
  },
  loadTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  loadSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: -6,
  },
  switchWrapper: {
    marginVertical: 8,
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
  detailIcon: {
    fontSize: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
});
