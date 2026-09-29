import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { useDataCollectionConsent } from '@/stores/preferences.store';
import { useSessionStore } from '@/stores/session.store';

import { setAnalyticsUser, setDataCollectionEnabled, trackScreen } from './index';

/**
 * Applies the traveller's choices to Firebase (EPIC-01.12). Mount once, in the root layout.
 *
 * - Analytics and Crashlytics collect only with consent (Profile › data sharing); in development
 *   they're always on, so a forced crash and test events reach the console.
 * - With consent, events carry the pseudonymous Supabase user id — never email or name.
 * - Screen views are logged per expo-router path (Firebase's automatic ones would only see one
 *   native screen).
 */
export function useFirebase(): void {
  const consent = useDataCollectionConsent();
  const enabled = consent || __DEV__;
  const userId = useSessionStore((state) => state.user?.id ?? null);
  const pathname = usePathname();

  useEffect(() => {
    void setDataCollectionEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    void setAnalyticsUser(enabled ? userId : null);
  }, [enabled, userId]);

  useEffect(() => {
    if (enabled) void trackScreen(pathname);
  }, [enabled, pathname]);
}
