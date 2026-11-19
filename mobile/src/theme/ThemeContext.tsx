import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import { lightColors, darkColors, ColorTheme } from './colors';
import { typography } from './typography';
import { spacing, radius, heights, iconSizes } from './spacing';

export type ColorSchemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  mode: ColorSchemeMode;
  setMode: (mode: ColorSchemeMode) => Promise<void>;
  isDark: boolean;
  colors: ColorTheme;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  heights: typeof heights;
  iconSizes: typeof iconSizes;
}

const STORAGE_KEY = '@pumpdesk/appearance';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ColorSchemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    }).catch(() => {});
  }, []);

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  const setMode = async (newMode: ColorSchemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // ignore storage write errors
    }
  };

  const value: ThemeContextValue = {
    mode,
    setMode,
    isDark,
    colors,
    typography,
    spacing,
    radius,
    heights,
    iconSizes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
