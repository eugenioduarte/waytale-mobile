import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Palette } from '@/constants/palette';
import { SessionProvider, useSession } from '@/features/auth/session';

function RootNavigator() {
  const { isAuthenticated, hasCompletedOnboarding } = useSession();

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Palette.background },
        }}
      >
        {/* Anonymous → auth. */}
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* Authenticated but not onboarded → onboarding. */}
        <Stack.Protected guard={isAuthenticated && !hasCompletedOnboarding}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>

        {/* Authenticated + onboarded → main app, the walk flow and its modals. */}
        <Stack.Protected guard={isAuthenticated && hasCompletedOnboarding}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(journey)" />
          <Stack.Screen name="(modals)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}
