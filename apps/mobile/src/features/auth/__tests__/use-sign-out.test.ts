import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useSignOut } from '@/features/auth/use-sign-out';
import { useSessionStore } from '@/stores/session.store';
import { buildUser } from '@tests/factories';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Every collaborator of the hook, recorded in call order.
const mockCalls: string[] = [];
const mockConfig = { supabaseConfigured: true };
jest.mock('@/lib/supabase/client', () => ({
  get isSupabaseConfigured() {
    return mockConfig.supabaseConfigured;
  },
}));
jest.mock('@/lib/sync/runtime', () => ({
  flushSync: async () => void mockCalls.push('flushSync'),
}));
jest.mock('@/features/auth/api', () => ({
  authApi: { signOut: async () => void mockCalls.push('authApi.signOut') },
}));

beforeEach(() => {
  mockCalls.length = 0;
  mockConfig.supabaseConfigured = true;
  useSessionStore.setState(
    { isAuthenticated: true, hasCompletedOnboarding: true, user: { id: buildUser().id } },
    false,
  );
});

async function signOut() {
  const { result } = renderHook(() => useSignOut());
  await act(() => result.current());
}

describe('useSignOut', () => {
  it('pushes pending writes, then revokes the Supabase session, then leaves the app', async () => {
    await signOut();

    expect(mockCalls).toEqual(['flushSync', 'authApi.signOut']);
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      user: null,
    });
  });

  it('without Supabase (preview), only leaves the app', async () => {
    mockConfig.supabaseConfigured = false;

    await signOut();

    expect(mockCalls).toEqual([]);
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });
});
