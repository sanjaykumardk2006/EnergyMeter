import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface ActionItem {
  id: string;
  icon: string;
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
  const [tempIp, setTempIp] = useState(ipAddress);

  // Formatted last update text
  const timeAgoText = lastUpdated
    ? `${Math.max(1, Math.round((Date.now() - lastUpdated.getTime()) / 1000))} seconds ago`
    : 'Not connected';

  // Real-time Action log history anchored by latest ESP32 reason
  const actionItems: ActionItem[] = [
    {
      id: '1',
      icon: '💡',
      title: lastActionReason || 'Load 1 turned ON (Manual)',
      time: lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '09:40:12',
    },
    {
      id: '2',
      icon: '🏃',
      title: 'Occupancy detected (PIR)',
      time: '09:39:52',
    },
    {
      id: '3',
      icon: '💡',
      title: 'Load 1 turned OFF (Auto: No presence)',
      time: '09:32:15',
    },
    {
      id: '4',
      icon: '💡',
      title: 'Load 2 turned ON (Auto: Distance)',
      time: '09:28:41',
    },
    {
      id: '5',
      icon: '🚫',
      title: 'Occupancy lost',
      time: '09:27:10',
    },
  ];

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
            <ThemedText style={styles.headerTitle}>System Status</ThemedText>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.content}>
          {/* ESP32 Connection Card */}
          <View style={styles.connCard}>
            <View style={styles.connHeaderRow}>
              <View style={styles.connTitleCol}>
                <ThemedText style={styles.wifiIcon}>📶</ThemedText>
                <ThemedText style={styles.connTitle}>ESP32 Connection</ThemedText>
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isConnected ? '#DCFCE7' : '#FEE2E2' },
                ]}>
                <ThemedText
                  style={[
                    styles.statusBadgeText,
                    { color: isConnected ? '#15803D' : '#B91C1C' },
                  ]}>
                  {isConnected ? 'Connected' : 'Offline'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.ipRow}>
              <View style={styles.ipInfoCol}>
                <ThemedText style={styles.ipLabel}>IP Address</ThemedText>
                <TextInput
                  style={styles.ipInput}
                  value={tempIp}
                  onChangeText={setTempIp}
                  placeholder="192.168.1.100"
                  onSubmitEditing={() => onIpChange(tempIp)}
                />
              </View>

              <View style={styles.lastUpdateCol}>
                <ThemedText style={styles.ipLabel}>Last Update</ThemedText>
                <ThemedText style={styles.lastUpdateVal}>{timeAgoText}</ThemedText>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Pressable
                style={styles.saveIpBtn}
                onPress={() => {
                  onIpChange(tempIp);
                  onRefresh();
                }}>
                <ThemedText style={styles.saveIpBtnText}>Sync & Reconnect</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Last Actions Audit Log */}
          <View style={styles.actionsCard}>
            <View style={styles.actionsHeader}>
              <ThemedText style={styles.actionsTitle}>Last Actions</ThemedText>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </View>

            <View style={styles.actionsList}>
              {actionItems.map((item, idx) => (
                <View key={item.id} style={styles.actionItemRow}>
                  <View style={styles.actionIconCircle}>
                    <ThemedText style={styles.actionIcon}>{item.icon}</ThemedText>
                  </View>

                  <ThemedText style={styles.actionItemText} numberOfLines={1}>
                    {item.title}
                  </ThemedText>

                  <ThemedText style={styles.actionItemTime}>
                    {item.time}
                  </ThemedText>
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
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 18,
    gap: 18,
  },
  connCard: {
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
    gap: 8,
  },
  wifiIcon: {
    fontSize: 18,
  },
  connTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
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
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
  },
  ipInfoCol: {
    flex: 1,
    gap: 4,
  },
  ipLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  ipInput: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  lastUpdateCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  lastUpdateVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  btnRow: {
    marginTop: 4,
  },
  saveIpBtn: {
    backgroundColor: '#2563EB',
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
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  actionsList: {
    gap: 10,
  },
  actionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  actionItemTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
