import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react-native';

import { buildUser } from '@tests/factories';
import { renderApp } from '@tests/render';

// A device whose language can change while the app runs, like `expo-localization` does on a
// phone: `useLocales` re-renders its subscribers when the locale changes.
jest.mock('expo-localization', () => {
  const { useSyncExternalStore } = jest.requireActual<typeof import('react')>('react');
  let locales = [{ languageCode: 'en' }];
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  return {
    getLocales: () => locales,
    useLocales: () => useSyncExternalStore(subscribe, () => locales),
    setDeviceLanguage: (languageCode: string) => {
      locales = [{ languageCode }];
      listeners.forEach((listener) => listener());
    },
  };
});
const { setDeviceLanguage } = jest.requireMock<{
  setDeviceLanguage: (languageCode: string) => void;
}>('expo-localization');

// The root layout's side effects, replaced locally (as in auth.flow.integration.test.tsx).
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/db/client', () => ({ useDatabaseReady: () => true }));
jest.mock('@/lib/sync/use-sync', () => ({ useSync: () => undefined }));
jest.mock('@/lib/sync/runtime', () => ({ flushSync: jest.fn(async () => undefined) }));
jest.mock('@/features/auth/use-supabase-auth-sync', () => ({
  useSupabaseAuthSync: () => undefined,
}));
jest.mock('@/lib/supabase/client', () => ({
  getSupabase: jest.fn(),
  isSupabaseConfigured: false,
}));

async function openProfile() {
  renderApp('/profile', {
    stores: { session: { isAuthenticated: true, hasCompletedOnboarding: true, user: buildUser() } },
  });
  return screen.findByTestId('screen-profile');
}

describe('app language (01.9 acceptance)', () => {
  it('changing the device language re-renders the app in it, without a restart', async () => {
    act(() => setDeviceLanguage('en'));
    const profile = await openProfile();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();

    act(() => setDeviceLanguage('pt'));

    expect(screen.getByRole('button', { name: 'Terminar sessão' })).toBeTruthy();
    expect(screen.getByText('Percursos')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sign out' })).toBeNull();
    // Same screen instance: re-rendered in place, not remounted.
    expect(screen.getByTestId('screen-profile')).toBe(profile);
  });

  it('a device language we do not ship falls back to English', async () => {
    act(() => setDeviceLanguage('fr'));
    await openProfile();

    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  });

  it('the choice in Profile overrides the device until set back to "device language"', async () => {
    act(() => setDeviceLanguage('pt'));
    await openProfile();

    fireEvent.press(screen.getByTestId('profile-language-es'));
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();

    act(() => setDeviceLanguage('en'));
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeTruthy();

    fireEvent.press(screen.getByTestId('profile-language-system'));
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeTruthy();
  });
});
