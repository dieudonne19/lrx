import '@/global.css';

import { useLrxStore } from '@/lib/lrx-store';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { Uniwind, useUniwind } from 'uniwind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { theme } = useUniwind();
  const themePreference = useLrxStore((state) => state.settings.theme);

  React.useEffect(() => {
    Uniwind.setTheme(themePreference);
  }, [themePreference]);

  return (
    <ThemeProvider value={NAV_THEME[theme ?? 'light']}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      <PortalHost />
    </ThemeProvider>
  );
}
