import { describe, expect, it, jest } from '@jest/globals';
import { act, fireEvent, screen } from '@testing-library/react-native';

import { useSessionStore } from '@/stores/session.store';
import { buildUser } from '@tests/factories';
import { renderApp } from '@tests/render';

// The root layout's side effects, replaced locally: no database to migrate, no sync engine, no
// Supabase listener. Supabase is "not configured", so the preview auth shortcuts are on.
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
// Mirrors Metro's empty Storybook module when the preview flag is disabled.
jest.mock('../../../../.rnstorybook', () => ({ __esModule: true, default: undefined }));

describe('route guards (root layout)', () => {
  it('an anonymous traveller lands on login', async () => {
    renderApp('/');

    expect(await screen.findByTestId('screen-login')).toBeTruthy();
  });

  it('a signed-in, onboarded traveller opens straight on the tabs', async () => {
    renderApp('/', {
      stores: {
        session: { isAuthenticated: true, hasCompletedOnboarding: true, user: buildUser() },
      },
    });

    expect(await screen.findByTestId('screen-explore')).toBeTruthy();
  });

  it('a signed-in traveller who has not onboarded lands on onboarding', async () => {
    renderApp('/', { stores: { session: { isAuthenticated: true, user: buildUser() } } });

    expect(await screen.findByTestId('screen-interests')).toBeTruthy();
  });

  it('a deep link into the app while anonymous stays behind login', async () => {
    renderApp('/walk');

    expect(await screen.findByTestId('screen-login')).toBeTruthy();
    expect(screen.queryByTestId('screen-walk')).toBeNull();
  });
});

describe('sign-in → onboarding → app (preview auth)', () => {
  it('walks the whole first-run flow', async () => {
    renderApp('/');

    fireEvent.press(await screen.findByTestId('login-continue'));
    fireEvent.press(await screen.findByTestId('verify-submit'));

    fireEvent.press(await screen.findByTestId('interests-continue'));
    fireEvent.press(await screen.findByTestId('deviations-continue'));
    fireEvent.press(await screen.findByTestId('voice-continue'));
    fireEvent.press(await screen.findByTestId('permissions-continue'));

    expect(await screen.findByTestId('screen-explore')).toBeTruthy();
    expect(useSessionStore.getState()).toMatchObject({
      isAuthenticated: true,
      hasCompletedOnboarding: true,
    });
  });

  it('the demo shortcut skips straight to the app', async () => {
    renderApp('/');

    fireEvent.press(await screen.findByTestId('login-preview'));

    expect(await screen.findByTestId('screen-explore')).toBeTruthy();
  });
});

describe('sign-out', () => {
  it('from the profile tab returns to login', async () => {
    renderApp('/profile', {
      stores: {
        session: { isAuthenticated: true, hasCompletedOnboarding: true, user: buildUser() },
      },
    });

    await act(async () => {
      fireEvent.press(await screen.findByTestId('profile-sign-out'));
    });

    expect(await screen.findByTestId('screen-login')).toBeTruthy();
    expect(useSessionStore.getState()).toMatchObject({ isAuthenticated: false, user: null });
  });
});

describe('secondary routes and back navigation', () => {
  const signedIn = {
    session: { isAuthenticated: true, hasCompletedOnboarding: true, user: buildUser() },
  };

  it('can leave registration and recovery without creating a session', async () => {
    renderApp('/');
    fireEvent.press(await screen.findByTestId('login-register'));
    expect(await screen.findByTestId('screen-register')).toBeTruthy();
    fireEvent.press(await screen.findByTestId('register-back'));
    fireEvent.press(await screen.findByTestId('login-recover'));
    expect(await screen.findByTestId('screen-recover-account')).toBeTruthy();
    fireEvent.press(await screen.findByTestId('recover-account-back'));
    expect(await screen.findByTestId('screen-login')).toBeTruthy();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });

  it('registration preview starts onboarding', async () => {
    renderApp('/register');
    fireEvent.press(await screen.findByTestId('register-submit'));
    expect(await screen.findByTestId('screen-interests')).toBeTruthy();
  });

  it('leaving verification returns to login without authenticating', async () => {
    renderApp('/');
    fireEvent.press(await screen.findByTestId('login-continue'));
    fireEvent.press(await screen.findByTestId('verify-back'));
    expect(await screen.findByTestId('screen-login')).toBeTruthy();
    expect(useSessionStore.getState().isAuthenticated).toBe(false);
  });

  it('finishes a walk, shows its summary and returns to Explore', async () => {
    renderApp('/walk', { stores: signedIn });
    fireEvent.press(await screen.findByTestId('walk-finish'));
    expect(await screen.findByTestId('screen-summary')).toBeTruthy();
    fireEvent.press(await screen.findByTestId('summary-done'));
    expect(await screen.findByTestId('screen-explore')).toBeTruthy();
  });

  it('redirects a Storybook deep link when the preview flag is disabled', async () => {
    renderApp('/storybook', { stores: signedIn });
    expect(await screen.findByTestId('screen-explore')).toBeTruthy();
  });

  it.each([
    ['/route/demo-route', 'screen-route'],
    ['/place/demo-place', 'screen-place'],
    ['/saved', 'screen-saved'],
    ['/journeys', 'screen-journeys'],
  ])('opens the authenticated deep link %s', async (url, testID) => {
    renderApp(url, { stores: signedIn });
    expect(await screen.findByTestId(testID)).toBeTruthy();
  });
});
