import React from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  autoMode: boolean;
  onToggleAutoMode: () => void;
  idleSec: number;
  autoCutoffCountdownSec: number;
  autoOffDelaySec: number;
  isRelayActive: boolean;
}

export function SmartEcoBanner({
  autoMode,
  onToggleAutoMode,
  idleSec,
  autoCutoffCountdownSec,
  autoOffDelaySec,
  isRelayActive,
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
      <View style={styles.topRow}>
        <View style={styles.titleInfo}>
          <ThemedText style={styles.leafIcon}>🌱</ThemedText>
          <View>
            <ThemedText type="smallBold" style={styles.title}>
              SMART ECO-SAVER AUTOMATION
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Auto-cuts appliance power when room is vacant
            </ThemedText>
          </View>
        </View>

        <Switch
          value={autoMode}
          onValueChange={onToggleAutoMode}
          trackColor={{ false: '#374151', true: '#10B981' }}
          thumbColor="#ffffff"
        />
      </View>

      {autoMode && isRelayActive && (
        <View style={[styles.timerRow, { backgroundColor: theme.background }]}>
          <View style={styles.timerItem}>
            <ThemedText type="small" themeColor="textSecondary">
              Inactivity Duration:
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: '#F59E0B' }}>
              {formatSec(idleSec)}
            </ThemedText>
          </View>

          <View style={styles.timerDivider} />

          <View style={styles.timerItem}>
            <ThemedText type="small" themeColor="textSecondary">
              Auto-Cutoff In:
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: '#10B981' }}>
              {autoCutoffCountdownSec > 0 ? formatSec(autoCutoffCountdownSec) : 'Triggered'}
            </ThemedText>
          </View>
        </View>
      )}

      {autoMode && !isRelayActive && (
        <ThemedText type="small" style={{ color: '#10B981', fontStyle: 'italic' }}>
          ✓ All relays off. Zero vampire power consumption.
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
  leafIcon: {
    fontSize: 24,
  },
  title: {
    color: '#10B981',
    letterSpacing: 0.5,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.two,
    marginTop: Spacing.one,
  },
  timerItem: {
    alignItems: 'center',
    gap: 2,
  },
  timerDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
});
