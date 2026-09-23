import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Palette } from '@/constants/palette';
import { PreviewSessionProvider, usePreviewSession } from '@/features/auth/preview-session';

function RootNavigator() {
  const { isPreviewActive } = usePreviewSession();
  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Palette.background },
        }}
      >
        <Stack.Protected guard={!isPreviewActive}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isPreviewActive}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <PreviewSessionProvider>
      <RootNavigator />
    </PreviewSessionProvider>
  );
}
