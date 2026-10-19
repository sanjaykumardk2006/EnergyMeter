import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryHover: string;
  primaryTint: string;
  primaryBorder: string;
  segmentBg: string;
  inputBg: string;
  inputBorder: string;
  divider: string;
  success: string;
  warning: string;
  danger: string;
  glowAura: string;
}

export const lightColors: ThemeColors = {
  background: '#F8FAF9',
  card: '#FFFFFF',
  cardBorder: '#E6EFEA',
  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  primary: '#059669',
  primaryHover: '#047857',
  primaryTint: '#ECFDF5',
  primaryBorder: '#A7F3D0',
  segmentBg: '#E2E8F0',
  inputBg: '#F8FAFC',
  inputBorder: '#CBD5E1',
  divider: '#F1F5F9',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  glowAura: 'rgba(250, 204, 21, 0.55)',
};

export const darkColors: ThemeColors = {
  background: '#09110D',
  card: '#111E17',
  cardBorder: '#1A2E23',
  text: '#F8FAF9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#10B981',
  primaryHover: '#34D399',
  primaryTint: 'rgba(16, 185, 129, 0.16)',
  primaryBorder: 'rgba(16, 185, 129, 0.35)',
  segmentBg: '#1A2820',
  inputBg: '#16241C',
  inputBorder: '#284032',
  divider: '#192C22',
  success: '#10B981',
  warning: '#FBBF24',
  danger: '#F87171',
  glowAura: 'rgba(250, 204, 21, 0.4)',
};

interface ThemeContextType {
  theme: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  isDark: false,
  colors: lightColors,
  setTheme: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
