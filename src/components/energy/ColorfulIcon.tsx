import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export type ColorfulVariant =
  | 'amber'
  | 'emerald'
  | 'cyan'
  | 'violet'
  | 'rose'
  | 'blue'
  | 'orange'
  | 'slate'
  | 'darkCosmic';

interface Props {
  library?: 'ionicons' | 'material';
  name: string;
  variant?: ColorfulVariant;
  size?: number; // Icon size (default 20)
  containerSize?: number; // Circle size (default 40)
  style?: ViewStyle;
}

const gradientMap: Record<ColorfulVariant, [string, string]> = {
  amber: ['#F59E0B', '#D97706'],
  emerald: ['#10B981', '#059669'],
  cyan: ['#0EA5E9', '#0284C7'],
  violet: ['#8B5CF6', '#6D28D9'],
  rose: ['#F43F5E', '#E11D48'],
  blue: ['#3B82F6', '#2563EB'],
  orange: ['#F97316', '#EA580C'],
  slate: ['#64748B', '#475569'],
  darkCosmic: ['#6366F1', '#4F46E5'],
};

export function ColorfulIcon({
  library = 'ionicons',
  name,
  variant = 'emerald',
  size = 20,
  containerSize = 40,
  style,
}: Props) {
  const colors = gradientMap[variant];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: Math.round(containerSize * 0.28),
        },
        style,
      ]}>
      {library === 'material' ? (
        <MaterialCommunityIcons
          name={name as any}
          size={size}
          color="#FFFFFF"
        />
      ) : (
        <Ionicons
          name={name as any}
          size={size}
          color="#FFFFFF"
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});
