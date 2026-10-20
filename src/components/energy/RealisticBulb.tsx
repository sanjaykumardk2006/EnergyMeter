import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  isOn: boolean;
  size?: number; // default 38
  type?: string;
}

export function RealisticBulb({ isOn, size = 38 }: Props) {
  const { isDark } = useTheme();

  // Reanimated shared values for multi-layered breathing glow
  const haloScale = useSharedValue(1);
  const haloOpacity = useSharedValue(0.4);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    if (isOn) {
      haloScale.value = withRepeat(
        withSequence(
          withTiming(1.36, { duration: 1000 }),
          withTiming(0.92, { duration: 1000 })
        ),
        -1,
        true
      );
      haloOpacity.value = withRepeat(
        withSequence(
          withTiming(0.75, { duration: 1000 }),
          withTiming(0.28, { duration: 1000 })
        ),
        -1,
        true
      );
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 900 }),
          withTiming(1.0, { duration: 900 })
        ),
        -1,
        true
      );
    } else {
      haloScale.value = withTiming(1, { duration: 250 });
      haloOpacity.value = withTiming(0, { duration: 250 });
      iconScale.value = withTiming(1, { duration: 250 });
    }
  }, [isOn, haloScale, haloOpacity, iconScale]);

  const outerHaloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: haloScale.value }],
    opacity: haloOpacity.value,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const squircleRadius = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.52);

  const bgColor = isOn
    ? isDark
      ? '#78350F'
      : '#FEF3C7'
    : isDark
    ? '#1E293B'
    : '#F8FAFC';

  const borderColor = isOn
    ? isDark
      ? '#F59E0B'
      : '#FBBF24'
    : isDark
    ? '#334155'
    : '#E2E8F0';

  const iconColor = isOn
    ? isDark
      ? '#FEF08A'
      : '#D97706'
    : isDark
    ? '#94A3B8'
    : '#64748B';

  const haloColor = isDark
    ? 'rgba(245, 158, 11, 0.45)'
    : 'rgba(251, 191, 36, 0.55)';

  const innerRingColor = isDark
    ? 'rgba(252, 211, 77, 0.35)'
    : 'rgba(245, 158, 11, 0.35)';

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {/* 1. Outer Pulsing Glow Aura */}
      {isOn && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.outerHalo,
            {
              width: size * 1.52,
              height: size * 1.52,
              borderRadius: (size * 1.52) / 2,
              backgroundColor: haloColor,
            },
            outerHaloStyle,
          ]}
        />
      )}

      {/* 2. Middle Radiant Glow Ring */}
      {isOn && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.middleHalo,
            {
              width: size * 1.22,
              height: size * 1.22,
              borderRadius: (size * 1.22) / 2,
              backgroundColor: innerRingColor,
            },
          ]}
        />
      )}

      {/* 3. Core Bulb Squircle */}
      <View
        style={[
          styles.squircle,
          {
            width: size,
            height: size,
            borderRadius: squircleRadius,
            backgroundColor: bgColor,
            borderColor,
            shadowColor: isOn ? '#F59E0B' : 'transparent',
            shadowOpacity: isOn ? 0.35 : 0,
            shadowRadius: isOn ? 10 : 0,
            elevation: isOn ? 5 : 1,
          },
        ]}>
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons
            name={isOn ? 'bulb' : 'bulb-outline'}
            size={iconSize}
            color={iconColor}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outerHalo: {
    position: 'absolute',
    zIndex: 0,
  },
  middleHalo: {
    position: 'absolute',
    zIndex: 1,
  },
  squircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 2,
    shadowOffset: { width: 0, height: 2 },
  },
});
