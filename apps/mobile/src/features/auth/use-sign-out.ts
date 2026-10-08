import { useCallback } from 'react';

import { unregisterThisDevice } from '@/features/push/device';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { flushSync } from '@/lib/sync/runtime';
import { useSessionActions } from '@/stores/session.store';

import { authApi } from './api';

/**
 * Signs out everywhere it matters: Supabase (revokes the refresh token, clears the encrypted
 * session) and the session store (flips the route guard back to `(auth)`). Clearing only the
 * store would let the next token refresh sign the user straight back in.
 *
 * Signing out removes this user's data from the device (`useSync`), so pending writes get one
 * last push first — bounded, so an offline sign-out still happens. This device stops receiving the
 * user's notifications first too (while the session can still delete its token).
 */
export function useSignOut(): () => Promise<void> {
  const { signOut } = useSessionActions();
  return useCallback(async () => {
    if (isSupabaseConfigured) {
      await flushSync();
      await unregisterThisDevice();
      await authApi.signOut();
    }
    signOut();
  }, [signOut]);
}
