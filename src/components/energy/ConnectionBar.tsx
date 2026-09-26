import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  ipAddress: string;
  onIpChange: (ip: string) => void;
  isConnected: boolean;
  onRefresh: () => void;
  isLoading: boolean;
}

export function ConnectionBar({
  ipAddress,
  onIpChange,
  isConnected,
  onRefresh,
  isLoading,
}: Props) {
  const theme = useTheme();
  const [localIp, setLocalIp] = useState(ipAddress);
  const [isEditing, setIsEditing] = useState(false);

  const handleApplyIp = () => {
    onIpChange(localIp.trim());
    setIsEditing(false);
  };

  const statusColor = isConnected
    ? '#10B981' // Green for Connected
    : '#EF4444'; // Red for Offline

  const statusLabel = isConnected
    ? 'CONNECTED'
    : 'OFFLINE';

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.statusGroup}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <ThemedText style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </ThemedText>
          <ThemedText style={styles.deviceLabel} themeColor="textSecondary" numberOfLines={1} ellipsizeMode="tail">
            {ipAddress}
          </ThemedText>
        </View>

        <View style={styles.actionGroup}>
          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.backgroundSelected, opacity: pressed || isLoading ? 0.6 : 1 },
            ]}
            onPress={onRefresh}
            disabled={isLoading}>
            <ThemedText style={styles.btnText}>
              {isLoading ? '⏳' : '🔄 Refresh'}
            </ThemedText>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.iconBtn,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setIsEditing(!isEditing)}>
            <ThemedText style={styles.btnText}>⚙️ IP</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* Expandable IP Editor */}
      {isEditing && (
        <View style={styles.editRow}>
          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.background,
                borderColor: theme.backgroundSelected,
              },
            ]}
            value={localIp}
            onChangeText={setLocalIp}
            placeholder="ESP32 IP e.g. 192.168.1.100"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            style={({ pressed }) => [
              styles.applyBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleApplyIp}>
            <ThemedText style={styles.applyText}>Connect</ThemedText>
          </Pressable>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.four,
    padding: Spacing.three,
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deviceLabel: {
    fontSize: 12,
    marginLeft: Spacing.one,
    flexShrink: 1,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  iconBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
  },

  editRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
  },
  applyBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  applyText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
