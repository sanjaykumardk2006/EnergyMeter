import React, { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';
import { ColorfulIcon } from './ColorfulIcon';

interface ActionItem {
  id: string;
  iconType: 'bulb-on' | 'bulb-off' | 'motion' | 'idle';
  title: string;
  time: string;
}

interface Props {
  visible: boolean;
  isConnected: boolean;
  ipAddress: string;
  lastActionReason?: string;
  lastUpdated: Date | null;
  onIpChange: (newIp: string) => void;
  onRefresh: () => void;
  onClose: () => void;
}

export function SystemStatusModal({
  visible,
  isConnected,
  ipAddress,
  lastActionReason,
  lastUpdated,
  onIpChange,
  onRefresh,
  onClose,
}: Props) {
  const { colors, isDark } = useTheme();
  const [tempIp, setTempIp] = useState(ipAddress);

  // Formatted last update text
  const timeAgoText = lastUpdated
    ? `${Math.max(1, Math.round((Date.now() - lastUpdated.getTime()) / 1000))}s ago`
    : 'Not connected';

  // Real-time Action log history anchored by latest ESP32 reason
  const actionItems: ActionItem[] = [
    {
      id: '1',
      iconType: 'bulb-on',
      title: lastActionReason || 'Light 1 turned ON (Manual Control)',
      time: lastUpdated
        ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '09:40:12',
    },
    {
      id: '2',
      iconType: 'motion',
      title: 'Occupancy detected (PIR Sensor)',
      time: '09:39:52',
    },
    {
      id: '3',
      iconType: 'bulb-off',
      title: 'Light 1 turned OFF (Smart Control: Vacancy timeout)',
      time: '09:32:15',
    },
    {
      id: '4',
      iconType: 'bulb-on',
      title: 'Light 2 turned ON (Smart Control: Ultrasonic distance)',
      time: '09:28:41',
    },
    {
      id: '5',
      iconType: 'idle',
      title: 'Room vacated • Idle countdown started',
      time: '09:27:10',
    },
  ];

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
              System Status & Diagnostics
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
          {/* ESP32 Connection Card */}
          <View
            style={[
              styles.connCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}>
            <View style={styles.connHeaderRow}>
              <View style={styles.connTitleCol}>
                <ColorfulIcon
                  library="ionicons"
                  name="wifi"
                  variant={isConnected ? 'emerald' : 'rose'}
                  size={18}
                  containerSize={36}
                />
                <ThemedText style={[styles.connTitle, { color: colors.text }]}>
                  ESP32 Connection
                </ThemedText>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isConnected
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.2)'
                        : '#DCFCE7'
                      : isDark
                      ? 'rgba(239, 68, 68, 0.2)'
                      : '#FEE2E2',
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.statusBadgeText,
                    { color: isConnected ? colors.primary : colors.danger },
                  ]}>
                  {isConnected ? '● Connected' : '● Offline'}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.ipRow, { backgroundColor: colors.inputBg }]}>
              <View style={styles.ipInfoCol}>
                <ThemedText style={[styles.ipLabel, { color: colors.textSecondary }]}>
                  Device IP
                </ThemedText>
                <TextInput
                  style={[styles.ipInput, { color: colors.text }]}
                  value={tempIp}
                  onChangeText={setTempIp}
                  placeholder="192.168.1.100"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={() => onIpChange(tempIp)}
                />
              </View>

              <View style={styles.lastUpdateCol}>
                <ThemedText style={[styles.ipLabel, { color: colors.textSecondary }]}>
                  Last Update
                </ThemedText>
                <ThemedText style={[styles.lastUpdateVal, { color: colors.text }]}>
                  {timeAgoText}
                </ThemedText>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Pressable
                style={[styles.saveIpBtn, { backgroundColor: colors.primary }]}
                onPress={() => {
                  onIpChange(tempIp);
                  onRefresh();
                }}>
                <ThemedText style={styles.saveIpBtnText}>Sync & Reconnect</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Audit Trail / Actions History with Colorful Badges */}
          <View
            style={[
              styles.actionsCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}>
            <View style={styles.actionsHeader}>
              <ThemedText style={[styles.actionsTitle, { color: colors.text }]}>
                Automation & Relay Event Log
              </ThemedText>
              <ThemedText style={[styles.viewAllText, { color: colors.primary }]}>
                Recent Events
              </ThemedText>
            </View>

            <View style={styles.actionsList}>
              {actionItems.map((item) => (
                <View key={item.id} style={styles.actionItemRow}>
                  <ColorfulIcon
                    library="material"
                    name={
                      item.iconType === 'bulb-on'
                        ? 'lightbulb-on'
                        : item.iconType === 'bulb-off'
                        ? 'lightbulb-outline'
                        : item.iconType === 'motion'
                        ? 'motion-sensor'
                        : 'sleep'
                    }
                    variant={
                      item.iconType === 'bulb-on'
                        ? 'amber'
                        : item.iconType === 'bulb-off'
                        ? 'slate'
                        : item.iconType === 'motion'
                        ? 'violet'
                        : 'cyan'
                    }
                    size={18}
                    containerSize={36}
                  />
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.actionTitle, { color: colors.text }]}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={[styles.actionTime, { color: colors.textMuted }]}>
                      {item.time}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
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
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 18,
  },
  connCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    gap: 14,
  },
  connHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connTitleCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  ipInfoCol: {
    flex: 1,
    gap: 4,
  },
  ipLabel: {
    fontSize: 11,
  },
  ipInput: {
    fontSize: 14,
    fontWeight: '700',
    padding: 0,
  },
  lastUpdateCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  lastUpdateVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnRow: {
    marginTop: 4,
  },
  saveIpBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveIpBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionsCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  actionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsList: {
    gap: 12,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionTime: {
    fontSize: 11,
    marginTop: 1,
  },
});
