import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';

import { setAnalyticsUser, setDataCollectionEnabled, trackScreen } from '@/lib/firebase';
import { useFirebase } from '@/lib/firebase/use-firebase';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useSessionStore } from '@/stores/session.store';

jest.mock('@/lib/firebase', () => ({
  setDataCollectionEnabled: jest.fn(async () => {}),
  setAnalyticsUser: jest.fn(async () => {}),
  trackScreen: jest.fn(async () => {}),
}));
jest.mock('expo-router', () => ({ usePathname: () => '/profile' }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const USER = '00000000-0000-4000-8000-00000000000a';
// `__DEV__` is a read-only global in the types; tests flip it to exercise release behaviour.
const globals = globalThis as unknown as { __DEV__: boolean };
const dev = globals.__DEV__;

beforeEach(() => {
  jest.clearAllMocks();
  usePreferencesStore.setState({ dataCollection: false });
  useSessionStore.setState({ user: { id: USER } });
});
afterEach(() => {
  globals.__DEV__ = dev;
});

describe('useFirebase in a release build (GDPR opt-in)', () => {
  beforeEach(() => {
    globals.__DEV__ = false;
  });

  it('collects nothing and ties nothing to the user until the traveller agrees', () => {
    renderHook(() => useFirebase());

    expect(setDataCollectionEnabled).toHaveBeenCalledWith(false);
    expect(setAnalyticsUser).toHaveBeenCalledWith(null);
    expect(trackScreen).not.toHaveBeenCalled();
  });

  it('with consent, collects, identifies by the pseudonymous user id and logs screens', () => {
    usePreferencesStore.setState({ dataCollection: true });

    renderHook(() => useFirebase());

    expect(setDataCollectionEnabled).toHaveBeenCalledWith(true);
    expect(setAnalyticsUser).toHaveBeenCalledWith(USER);
    expect(trackScreen).toHaveBeenCalledWith('/profile');
  });
});

describe('useFirebase in development', () => {
  it('always collects, so a test crash or event reaches the console', () => {
    globals.__DEV__ = true;

    renderHook(() => useFirebase());

    expect(setDataCollectionEnabled).toHaveBeenCalledWith(true);
  });
});
