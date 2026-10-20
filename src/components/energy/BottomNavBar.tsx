import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
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

function NavTabItem({
  item,
  isActive,
  onPress,
  colors,
}: {
  item: (typeof tabConfig)[TabKey];
  isActive: boolean;
  onPress: () => void;
  colors: any;
}) {
  const iconScale = useSharedValue(isActive ? 1.1 : 1.0);

  useEffect(() => {
    iconScale.value = withSpring(isActive ? 1.12 : 1.0, {
      damping: 14,
      stiffness: 240,
    });
  }, [isActive, iconScale]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tabItem,
        pressed && styles.tabItemPressed,
      ]}
      onPress={onPress}>
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <Ionicons
          name={isActive ? item.iconActive : item.iconInactive}
          size={22}
          color={isActive ? item.color : colors.textMuted}
        />
      </Animated.View>

      <ThemedText
        style={[
          styles.tabLabel,
          { color: isActive ? item.color : colors.textSecondary },
          isActive && styles.tabLabelActive,
        ]}>
        {item.label}
      </ThemedText>

      {isActive ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          exiting={FadeOut.duration(100)}
          style={[styles.activeDot, { backgroundColor: item.color }]}
        />
      ) : (
        <View style={styles.dotSpacer} />
      )}
    </Pressable>
  );
}

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
          <NavTabItem
            key={key}
            item={item}
            isActive={isActive}
            onPress={() => onSelectTab(key)}
            colors={colors}
          />
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
    paddingVertical: 4,
    gap: 2,
  },
  tabItemPressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.8,
  },
  iconContainer: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  dotSpacer: {
    width: 4,
    height: 4,
    marginTop: 2,
  },
});
