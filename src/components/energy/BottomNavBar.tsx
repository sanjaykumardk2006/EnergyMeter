import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';

export type TabKey = 'home' | 'sensors' | 'energy' | 'settings';

interface Props {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

const tabConfig: Record<
  TabKey,
  {
    label: string;
    iconActive: keyof typeof Ionicons.glyphMap;
    iconInactive: keyof typeof Ionicons.glyphMap;
    gradient: [string, string];
    color: string;
  }
> = {
  home: {
    label: 'Home',
    iconActive: 'home',
    iconInactive: 'home-outline',
    gradient: ['#34D399', '#059669'],
    color: '#059669',
  },
  sensors: {
    label: 'Sensors',
    iconActive: 'hardware-chip',
    iconInactive: 'hardware-chip-outline',
    gradient: ['#A78BFA', '#7C3AED'],
    color: '#7C3AED',
  },
  energy: {
    label: 'Energy',
    iconActive: 'analytics',
    iconInactive: 'analytics-outline',
    gradient: ['#22D3EE', '#0284C7'],
    color: '#0284C7',
  },
  settings: {
    label: 'Settings',
    iconActive: 'settings',
    iconInactive: 'settings-outline',
    gradient: ['#FBBF24', '#D97706'],
    color: '#D97706',
  },
};

export function BottomNavBar({ activeTab, onSelectTab }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const tabKeys: TabKey[] = ['home', 'sensors', 'energy', 'settings'];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderTopColor: isDark ? colors.cardBorder : '#ECFDF5',
          paddingBottom: Math.max(12, insets.bottom + 6),
        },
      ]}>
      {tabKeys.map((key) => {
        const item = tabConfig[key];
        const isActive = activeTab === key;
        return (
          <Pressable
            key={key}
            style={styles.tabItem}
            onPress={() => onSelectTab(key)}>
            {isActive ? (
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.activeIconBadge}>
                <Ionicons name={item.iconActive} size={18} color="#FFFFFF" />
              </LinearGradient>
            ) : (
              <View style={styles.inactiveIconWrapper}>
                <Ionicons name={item.iconInactive} size={22} color={colors.textMuted} />
              </View>
            )}

            <ThemedText
              style={[
                styles.tabLabel,
                { color: isActive ? item.color : colors.textSecondary },
                isActive && styles.tabLabelActive,
              ]}>
              {item.label}
            </ThemedText>
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
    borderTopWidth: 1,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 2,
  },
  activeIconBadge: {
    width: 38,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveIconWrapper: {
    width: 38,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '800',
  },
});
