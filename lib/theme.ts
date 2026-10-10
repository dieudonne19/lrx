import { DarkTheme, DefaultTheme, type Theme } from 'expo-router/react-navigation';
 
// The colors React Navigation needs. global.css is the source of truth for the UI; theme.test.ts fails when
// these drift from it.
export const THEME = {
  light: {
    background: '#F7F8FB',
    foreground: '#111217',
    card: '#FFFFFF',
    primary: '#7C5CFF',
    destructive: '#F5536D',
    border: '#DDE1EA',
  },
  dark: {
    background: '#08090B',
    foreground: '#F2F3F6',
    card: '#131418',
    primary: '#7C5CFF',
    destructive: '#F5536D',
    border: '#1E2026',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};
