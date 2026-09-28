import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session.store';
import { useSyncStore } from '@/stores/sync.store';

import { createSyncEngine } from './engine';
import { createSupabaseRemote } from './remote';
import { getSyncExecutor, setSyncEngine } from './runtime';
import { clearOtherUsersData } from './user-data';

const currentUserId = () => useSessionStore.getState().user?.id ?? null;

/**
 * Runs the sync engine while the app is up. Mount once in the root layout with `enabled` = stores
 * hydrated and database migrated. No-op without Supabase (`.env.local`), where the app stays in
 * local preview mode.
 *
 * Triggers: start, connectivity back (NetInfo), foreground (AppState), a new signed-in user.
 * A user change first removes the previous user's data from the device.
 */
export function useSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;
    const db = getSyncExecutor();
    const status = useSyncStore.getState();
    let online = true;

    const engine = createSyncEngine({
      db,
      remote: createSupabaseRemote(getSupabase),
      getUserId: currentUserId,
      isOnline: () => online,
      status,
    });
    setSyncEngine(engine);

    let userId = currentUserId();
    const onUser = async (next: string | null) => {
      try {
        await clearOtherUsersData(db, next);
        await engine.refreshCounts();
        if (next) await engine.syncNow();
      } catch (error) {
        console.error('[sync] user change failed', error);
      }
    };
    void onUser(userId);

    const unsubscribeSession = useSessionStore.subscribe((state) => {
      const next = state.user?.id ?? null;
      if (next === userId) return;
      userId = next;
      void onUser(next);
    });

    // Fires once right away with the current state.
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      const next = state.isConnected === true && state.isInternetReachable !== false;
      const cameBack = next && !online;
      online = next;
      status.setOnline(next);
      if (cameBack) engine.onOnline();
    });

    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') engine.requestSync();
    });

    return () => {
      unsubscribeSession();
      unsubscribeNetInfo();
      appState.remove();
      engine.dispose();
      setSyncEngine(null);
    };
  }, [enabled]);
}
