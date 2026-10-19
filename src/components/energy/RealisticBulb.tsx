import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  isOn: boolean;
  size?: number; // default 38
  type?: string;
}

export function RealisticBulb({ isOn, size = 38 }: Props) {
  const { isDark } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOn) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOn, pulseAnim]);

  const squircleRadius = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.52);

  const bgColors: [string, string] = isOn
    ? isDark
      ? ['#451A03', '#241002']
      : ['#FEF3C7', '#FDE68A']
    : isDark
    ? ['#1E293B', '#0F172A']
    : ['#F8FAFC', '#F1F5F9'];

  const borderColor = isOn
    ? isDark
      ? '#78350F'
      : '#FCD34D'
    : isDark
    ? '#334155'
    : '#E2E8F0';

  const iconColor = isOn
    ? isDark
      ? '#FDE047'
      : '#D97706'
    : isDark
    ? '#94A3B8'
    : '#64748B';

  return (
    <LinearGradient
      colors={bgColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.squircle,
        {
          width: size,
          height: size,
          borderRadius: squircleRadius,
          borderColor,
          shadowColor: isOn ? '#F59E0B' : 'transparent',
          shadowOpacity: isOn ? 0.18 : 0,
        },
      ]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons
          name={isOn ? 'bulb' : 'bulb-outline'}
          size={iconSize}
          color={iconColor}
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  squircle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
});
