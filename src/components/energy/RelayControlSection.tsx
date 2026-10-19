import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  relay1: boolean;
  relay2: boolean;
  autoMode: boolean;
  isSwitchingRelay: { 1: boolean; 2: boolean };
  actionError: string | null;
  onToggleRelay: (id: 1 | 2) => void;
  onSetBothRelays: (state: boolean) => void;
  onDismissError: () => void;
}

export function RelayControlSection({
  relay1,
  relay2,
  autoMode,
  isSwitchingRelay,
  actionError,
  onToggleRelay,
  onSetBothRelays,
  onDismissError,
}: Props) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            5V DC BULB RELAY CONTROLS
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Independent Dual-Channel Switching (GPIO 25 & 33)
          </ThemedText>
        </View>

        <View
          style={[
            styles.modePill,
            { backgroundColor: autoMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(2, 132, 199, 0.15)' },
          ]}>
          <ThemedText
            style={[
              styles.modePillText,
              { color: autoMode ? '#10B981' : '#0284C7' },
            ]}>
            {autoMode ? '🤖 AUTO ACTIVE' : '✋ MANUAL MODE'}
          </ThemedText>
        </View>
      </View>

      {/* Mode Status Banner */}
      {autoMode ? (
        <View style={styles.infoBanner}>
          <ThemedText style={styles.infoIcon}>ℹ️</ThemedText>
          <ThemedText type="small" style={styles.infoText}>
            Sensor automation is actively managing loads based on occupancy. Switch to{' '}
            <ThemedText type="smallBold" style={{ color: '#0284C7' }}>Manual Mode</ThemedText>{' '}
            below if you wish to override and lock relay states without auto-off.
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.infoBanner, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
          <ThemedText style={styles.infoIcon}>🔒</ThemedText>
          <ThemedText type="small" style={styles.infoText}>
            Manual control locked: sensors will <ThemedText type="smallBold">NOT</ThemedText> override your relay states.
          </ThemedText>
        </View>
      )}

      {/* Action Error Banner */}
      {actionError && (
        <View style={styles.errorBanner}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ThemedText style={styles.errorIcon}>⚠️</ThemedText>
            <ThemedText type="smallBold" style={styles.errorText}>
              {actionError}
            </ThemedText>
          </View>
          <Pressable onPress={onDismissError} style={styles.dismissBtn}>
            <ThemedText style={styles.dismissBtnText}>✕</ThemedText>
          </Pressable>
        </View>
      )}

      {/* Relay Cards Row */}
      <View style={styles.cardsRow}>
        {/* Load 1 Card */}
        <Pressable
          style={({ pressed }) => [
            styles.relayCard,
            {
              backgroundColor: theme.background,
              borderColor: relay1 ? '#10B981' : theme.backgroundSelected,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => onToggleRelay(1)}>
          <View style={styles.cardHeader}>
            <View style={styles.pinTag}>
              <ThemedText style={styles.pinText}>GPIO 25</ThemedText>
            </View>
            {isSwitchingRelay[1] ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Switch
                value={relay1}
                onValueChange={() => onToggleRelay(1)}
                trackColor={{ false: '#374151', true: '#10B981' }}
                thumbColor="#ffffff"
              />
            )}
          </View>

          <View style={styles.cardBody}>
            <ThemedText style={styles.applianceIcon}>💡</ThemedText>
            <ThemedText type="smallBold">Load 1 (5V Bulb)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Relay Channel 1
            </ThemedText>
          </View>

          <View style={styles.cardFooter}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: relay1 ? '#10B981' : '#6B7280' },
              ]}
            />
            <ThemedText
              type="smallBold"
              style={{ color: relay1 ? '#10B981' : theme.textSecondary }}>
              {relay1 ? 'POWER ON' : 'OFF'}
            </ThemedText>
          </View>
        </Pressable>

        {/* Load 2 Card */}
        <Pressable
          style={({ pressed }) => [
            styles.relayCard,
            {
              backgroundColor: theme.background,
              borderColor: relay2 ? '#F59E0B' : theme.backgroundSelected,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => onToggleRelay(2)}>
          <View style={styles.cardHeader}>
            <View style={styles.pinTag}>
              <ThemedText style={styles.pinText}>GPIO 33</ThemedText>
            </View>
            {isSwitchingRelay[2] ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <Switch
                value={relay2}
                onValueChange={() => onToggleRelay(2)}
                trackColor={{ false: '#374151', true: '#F59E0B' }}
                thumbColor="#ffffff"
              />
            )}
          </View>

          <View style={styles.cardBody}>
            <ThemedText style={styles.applianceIcon}>💡</ThemedText>
            <ThemedText type="smallBold">Load 2 (5V Bulb)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Relay Channel 2
            </ThemedText>
          </View>

          <View style={styles.cardFooter}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: relay2 ? '#F59E0B' : '#6B7280' },
              ]}
            />
            <ThemedText
              type="smallBold"
              style={{ color: relay2 ? '#F59E0B' : theme.textSecondary }}>
              {relay2 ? 'POWER ON' : 'OFF'}
            </ThemedText>
          </View>
        </Pressable>
      </View>

      {/* Quick Master Switches: Both ON / Both OFF */}
      <View style={styles.quickActionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.quickBtn,
            styles.quickBtnOn,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => onSetBothRelays(true)}>
          <ThemedText style={styles.quickBtnOnText}>⚡ Turn Both ON</ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.quickBtn,
            styles.quickBtnOff,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => onSetBothRelays(false)}>
          <ThemedText style={styles.quickBtnOffText}>⏹️ Turn Both OFF</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    alignSelf: 'stretch',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    letterSpacing: 0.8,
    color: '#0284C7',
  },
  modePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
  },
  infoIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#94A3B8',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    flex: 1,
  },
  dismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dismissBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 14,
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  relayCard: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinTag: {
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pinText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  cardBody: {
    gap: 2,
  },
  applianceIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnOn: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  quickBtnOnText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
  },
  quickBtnOff: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  quickBtnOffText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 12,
  },
});
