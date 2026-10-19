import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type TabKey = 'home' | 'sensors' | 'energy' | 'settings';

interface Props {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export function BottomNavBar({ activeTab, onSelectTab }: Props) {
  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'sensors', label: 'Sensors', icon: '📍' },
    { key: 'energy', label: 'Energy', icon: '📊' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onSelectTab(tab.key)}>
            <ThemedText style={[styles.tabIcon, isActive && styles.tabIconActive]}>
              {tab.icon}
            </ThemedText>
            <ThemedText
              style={[
                styles.tabLabel,
                isActive ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}>
              {tab.label}
            </ThemedText>
            {isActive && <View style={styles.activeDot} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 10,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 3,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748B',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginTop: 2,
  },
});
