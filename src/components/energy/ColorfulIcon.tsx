import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
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

const colorMap: Record<ColorfulVariant, string> = {
  amber: '#D97706',
  emerald: '#059669',
  cyan: '#0284C7',
  violet: '#7C3AED',
  rose: '#E11D48',
  blue: '#2563EB',
  orange: '#EA580C',
  slate: '#475569',
  darkCosmic: '#4F46E5',
};

export function ColorfulIcon({
  library = 'ionicons',
  name,
  variant = 'emerald',
  size = 20,
  containerSize = 40,
  style,
}: Props) {
  const bg = colorMap[variant] || '#059669';

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius: Math.round(containerSize * 0.28),
          backgroundColor: bg,
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
    </View>
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
