// Tailwind layers for NativeWind (01.10); `className` works from here down.
import '@/global.css';

import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { color } from '@/constants/tokens';
import { useDatabaseReady } from '@/db/client';
import { useSupabaseAuthSync } from '@/features/auth/use-supabase-auth-sync';
import { useLanguageSync } from '@/lib/i18n';
import { useSync } from '@/lib/sync/use-sync';
import { useStoresHydrated } from '@/stores/hydration';
import { useHasCompletedOnboarding, useIsAuthenticated } from '@/stores/session.store';

// Keep the splash up until the persisted stores rehydrate (see `stores/hydration.ts`) and the
// local database is migrated (see `db/client.ts`).
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hasHydrated = useStoresHydrated();
  const isDatabaseReady = useDatabaseReady();
  const isReady = hasHydrated && isDatabaseReady;
  // Device language or the Profile choice, live (i18next is initialised on import).
  useLanguageSync();
  useSupabaseAuthSync(hasHydrated);
  // After migration too: sync writes to the local tables.
  useSync(isReady);
  const isAuthenticated = useIsAuthenticated();
  const hasCompletedOnboarding = useHasCompletedOnboarding();

  useEffect(() => {
    if (isReady) void SplashScreen.hideAsync();
  }, [isReady]);

  // Mounting the guard before hydration would treat a signed-in user as anonymous; mounting
  // screens before migration would read tables that don't exist yet.
  if (!isReady) return null;

  return (
    <ThemeProvider value={DefaultTheme}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.surface },
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
