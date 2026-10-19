import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  autoMode: boolean;
  autoTarget: 1 | 2 | 3;
  occupancyDetected: boolean;
  idleSec: number;
  autoCutoffCountdownSec: number;
  autoOffDelaySec: number;
  isRelayActive: boolean;
  lastActionReason?: string;
  isSwitchingAutoMode: boolean;
  onToggleAutoMode: () => void;
  onChangeAutoTarget: (target: 1 | 2 | 3) => void;
}

export function SmartEcoBanner({
  autoMode,
  autoTarget,
  occupancyDetected,
  idleSec,
  autoCutoffCountdownSec,
  autoOffDelaySec,
  isRelayActive,
  lastActionReason,
  isSwitchingAutoMode,
  onToggleAutoMode,
  onChangeAutoTarget,
}: Props) {
  const theme = useTheme();

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      {/* Mode Selector Header */}
      <View style={styles.topRow}>
        <View style={styles.titleInfo}>
          <ThemedText style={styles.leafIcon}>{autoMode ? '🤖' : '✋'}</ThemedText>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold" style={styles.title}>
              {autoMode ? 'AUTOMATIC MODE (OCCUPANCY RULES)' : 'MANUAL CONTROL MODE'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {autoMode
                ? 'ESP32 sensor fusion controls relays based on room activity'
                : 'Sensors disabled for relay control. Manual switches locked.'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.switchWrapper}>
          {isSwitchingAutoMode ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Switch
              value={autoMode}
              onValueChange={onToggleAutoMode}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor="#ffffff"
            />
          )}
        </View>
      </View>

      {/* When Automatic Mode is active, show target load controls & sensor timers */}
      {autoMode && (
        <View style={styles.autoContent}>
          {/* Target Load Selector */}
          <View style={[styles.targetSelectorCard, { backgroundColor: theme.background }]}>
            <ThemedText type="smallBold" style={styles.subHeading}>
              AUTO-TRIGGER TARGET APPLIANCE:
            </ThemedText>
            <View style={styles.targetButtonsRow}>
              <Pressable
                style={[
                  styles.targetBtn,
                  autoTarget === 1 && styles.targetBtnActive,
                ]}
                onPress={() => onChangeAutoTarget(1)}>
                <ThemedText
                  style={[
                    styles.targetBtnText,
                    autoTarget === 1 && styles.targetBtnTextActive,
                  ]}>
                  Load 1 Only
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.targetBtn,
                  autoTarget === 2 && styles.targetBtnActive,
                ]}
                onPress={() => onChangeAutoTarget(2)}>
                <ThemedText
                  style={[
                    styles.targetBtnText,
                    autoTarget === 2 && styles.targetBtnTextActive,
                  ]}>
                  Load 2 Only
                </ThemedText>
              </Pressable>

              <Pressable
                style={[
                  styles.targetBtn,
                  autoTarget === 3 && styles.targetBtnActive,
                ]}
                onPress={() => onChangeAutoTarget(3)}>
                <ThemedText
                  style={[
                    styles.targetBtnText,
                    autoTarget === 3 && styles.targetBtnTextActive,
                  ]}>
                  Both Loads (1 & 2)
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Occupancy & Inactivity Countdown */}
          <View style={[styles.timerRow, { backgroundColor: theme.background }]}>
            <View style={styles.timerItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Occupancy State:
              </ThemedText>
              <ThemedText
                type="smallBold"
                style={{ color: occupancyDetected ? '#10B981' : '#F59E0B' }}>
                {occupancyDetected ? '👤 Detected' : '💤 Vacant'}
              </ThemedText>
            </View>

            <View style={styles.timerDivider} />

            <View style={styles.timerItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Inactivity Time:
              </ThemedText>
              <ThemedText type="smallBold" style={{ color: '#F59E0B' }}>
                {formatSec(idleSec)}
              </ThemedText>
            </View>

            <View style={styles.timerDivider} />

            <View style={styles.timerItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Auto-Off Countdown:
              </ThemedText>
              <ThemedText
                type="smallBold"
                style={{
                  color:
                    occupancyDetected
                      ? '#10B981'
                      : autoCutoffCountdownSec > 0
                      ? '#38BDF8'
                      : '#EF4444',
                }}>
                {occupancyDetected
                  ? 'Paused (Active)'
                  : autoCutoffCountdownSec > 0
                  ? formatSec(autoCutoffCountdownSec)
                  : 'Cutoff Triggered'}
              </ThemedText>
            </View>
          </View>

          {/* Last Action Reason */}
          {lastActionReason ? (
            <View style={styles.reasonBadge}>
              <ThemedText style={styles.reasonIcon}>📋</ThemedText>
              <ThemedText type="small" style={styles.reasonText}>
                Last Action: <ThemedText type="smallBold" style={{ color: '#E2E8F0' }}>{lastActionReason}</ThemedText>
              </ThemedText>
            </View>
          ) : null}

          {!isRelayActive && !occupancyDetected && (
            <ThemedText type="small" style={styles.zeroPowerText}>
              ✓ Relays in safe standby (OFF). Zero vampire power consumption.
            </ThemedText>
          )}
        </View>
      )}

      {/* Manual mode advisory */}
      {!autoMode && (
        <ThemedText type="small" style={styles.manualNotice}>
          💡 You are in complete manual control. Relays will stay in your selected states until you flip them or enable Automatic Mode.
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
    alignSelf: 'stretch',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  switchWrapper: {
    marginLeft: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafIcon: {
    fontSize: 24,
  },
  title: {
    color: '#10B981',
    letterSpacing: 0.5,
  },
  autoContent: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  targetSelectorCard: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    gap: Spacing.one,
  },
  subHeading: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#94A3B8',
  },
  targetButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  targetBtn: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBtnActive: {
    backgroundColor: '#10B981',
  },
  targetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  targetBtnTextActive: {
    color: '#ffffff',
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  timerItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  timerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
  },
  reasonIcon: {
    fontSize: 12,
  },
  reasonText: {
    fontSize: 11,
    color: '#38BDF8',
  },
  zeroPowerText: {
    color: '#10B981',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
  manualNotice: {
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },
});
