import React from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  relay1: boolean;
  relay2: boolean;
  load1Watts: number;
  load2Watts: number;
  onToggleRelay: (id: 1 | 2) => void;
}

export function RelayControlSection({
  relay1,
  relay2,
  load1Watts,
  load2Watts,
  onToggleRelay,
}: Props) {
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            APPLIANCE RELAY CONTROLS
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Remote Switch & Load Management
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Dual Channel
        </ThemedText>
      </View>

      <View style={styles.cardsRow}>
        {/* Relay 1 Card */}
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
            <Switch
              value={relay1}
              onValueChange={() => onToggleRelay(1)}
              trackColor={{ false: '#374151', true: '#10B981' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.cardBody}>
            <ThemedText style={styles.applianceIcon}>💡</ThemedText>
            <ThemedText type="smallBold">Relay 1 (Load 1)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Lights / Fan
            </ThemedText>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.wattBadge}>
              <ThemedText style={styles.wattText}>{load1Watts.toFixed(0)} W</ThemedText>
            </View>
            <ThemedText
              type="smallBold"
              style={{ color: relay1 ? '#10B981' : theme.textSecondary }}>
              {relay1 ? 'POWER ON' : 'OFF'}
            </ThemedText>
          </View>
        </Pressable>

        {/* Relay 2 Card */}
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
            <Switch
              value={relay2}
              onValueChange={() => onToggleRelay(2)}
              trackColor={{ false: '#374151', true: '#F59E0B' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.cardBody}>
            <ThemedText style={styles.applianceIcon}>❄️</ThemedText>
            <ThemedText type="smallBold">Relay 2 (Load 2)</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              AC / Socket Load
            </ThemedText>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.wattBadge}>
              <ThemedText style={styles.wattText}>{load2Watts.toFixed(0)} W</ThemedText>
            </View>
            <ThemedText
              type="smallBold"
              style={{ color: relay2 ? '#F59E0B' : theme.textSecondary }}>
              {relay2 ? 'POWER ON' : 'OFF'}
            </ThemedText>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.one,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  wattBadge: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wattText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
