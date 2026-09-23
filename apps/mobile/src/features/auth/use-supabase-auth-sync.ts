import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js';
import { useEffect } from 'react';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session.store';

/**
 * A launch reported no session. That is also what supabase-js reports when the access token
 * expired and the refresh failed for lack of network — the refresh token is still stored and will
 * work once online. So ask again, and sign out only on a definite "no session" (no error): an
 * offline launch must keep the traveller signed in (offline-first).
 */
async function signOutIfSessionIsGone(getClient: () => SupabaseClient): Promise<void> {
  const { data, error } = await getClient().auth.getSession();
  if (!data.session && !error) useSessionStore.getState().signOut();
}

/**
 * Mirrors a Supabase auth event into the session store (and so into the route guard).
 *
 * Only the user id crosses over — tokens stay in Supabase's encrypted storage. A revoked or dead
 * refresh token arrives as `SIGNED_OUT`. The navigation preview (no Supabase user) is left alone.
 */
export function applyAuthEvent(
  event: AuthChangeEvent,
  session: Session | null,
  getClient: () => SupabaseClient = getSupabase,
): void {
  const store = useSessionStore.getState();
  if (session?.user) {
    store.setAuthenticatedUser({ id: session.user.id });
    return;
  }
  if (event === 'SIGNED_OUT') {
    store.signOut();
    return;
  }
  if (event === 'INITIAL_SESSION' && store.user !== null) {
    // Deferred: calling Supabase from inside the auth callback would deadlock on its auth lock.
    setTimeout(() => void signOutIfSessionIsGone(getClient), 0);
  }
}

/**
 * Mount once, in the root layout, with `enabled` = the persisted stores have hydrated. Subscribing
 * earlier would let `INITIAL_SESSION` see the store's defaults, and hydration would then restore a
 * user whose session no longer exists. No-op until Supabase is configured (`.env.local`).
 */
export function useSupabaseAuthSync(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;
    // The callback must stay synchronous and must not call other Supabase methods (auth lock).
    const { data } = getSupabase().auth.onAuthStateChange((event, session) =>
      applyAuthEvent(event, session),
    );
    return () => data.subscription.unsubscribe();
  }, [enabled]);
}
