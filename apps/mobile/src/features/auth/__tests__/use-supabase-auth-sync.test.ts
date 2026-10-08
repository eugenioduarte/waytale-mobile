import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthRetryableFetchError, type Session, type SupabaseClient } from '@supabase/supabase-js';

import { applyAuthEvent } from '@/features/auth/use-supabase-auth-sync';
import { useSessionStore } from '@/stores/session.store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn(), isSupabaseConfigured: false }));

const session = (userId: string) => ({ user: { id: userId } }) as unknown as Session;

/** A client whose `getSession` answers like auth-js does after a launch without a session. */
function clientReporting(result: { session: Session | null; error: Error | null }) {
  const getSession = jest.fn(async () => ({
    data: { session: result.session },
    error: result.error,
  }));
  return { getSession, getClient: () => ({ auth: { getSession } }) as unknown as SupabaseClient };
}

async function flushDeferred() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
}

beforeEach(() => {
  useSessionStore.getState().signOut();
});

describe('applyAuthEvent', () => {
  it('a Supabase session authenticates its user, without any token in the store', () => {
    applyAuthEvent('SIGNED_IN', session('user-a'));

    const state = useSessionStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual({ id: 'user-a' });
    expect(JSON.stringify(state)).not.toMatch(/token/i);
  });

  it('keeps onboarding progress across token refreshes of the same user', () => {
    applyAuthEvent('SIGNED_IN', session('user-a'));
    useSessionStore.getState().completeOnboarding();
    applyAuthEvent('TOKEN_REFRESHED', session('user-a'));

    expect(useSessionStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('a different user starts onboarding again', () => {
    applyAuthEvent('SIGNED_IN', session('user-a'));
    useSessionStore.getState().completeOnboarding();
    applyAuthEvent('SIGNED_IN', session('user-b'));

    expect(useSessionStore.getState().hasCompletedOnboarding).toBe(false);
  });

  it('SIGNED_OUT returns to anonymous', () => {
    applyAuthEvent('SIGNED_IN', session('user-a'));
    applyAuthEvent('SIGNED_OUT', null);

    expect(useSessionStore.getState()).toMatchObject({ isAuthenticated: false, user: null });
  });

  it('a launch whose session is definitely gone signs the user out', async () => {
    applyAuthEvent('SIGNED_IN', session('user-a'));
    const { getClient } = clientReporting({ session: null, error: null });
    applyAuthEvent('INITIAL_SESSION', null, getClient);
    await flushDeferred();

    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });

  it('an offline launch (refresh failed on the network) keeps the user signed in', async () => {
    applyAuthEvent('SIGNED_IN', session('user-a'));
    useSessionStore.getState().completeOnboarding();
    const { getClient } = clientReporting({
      session: null,
      error: new AuthRetryableFetchError('offline', 0),
    });
    applyAuthEvent('INITIAL_SESSION', null, getClient);
    await flushDeferred();

    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: true,
      hasCompletedOnboarding: true,
      user: { id: 'user-a' },
    });
  });

  it('a launch without a session leaves the navigation preview alone', async () => {
    useSessionStore.getState().enterPreview();
    const { getClient, getSession } = clientReporting({ session: null, error: null });
    applyAuthEvent('INITIAL_SESSION', null, getClient);
    await flushDeferred();

    expect(useSessionStore.getState().isAuthenticated).toBe(true);
    expect(getSession).not.toHaveBeenCalled();
  });
});
