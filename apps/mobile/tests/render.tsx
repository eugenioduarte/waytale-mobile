import path from 'node:path';

import { render, type RenderOptions } from '@testing-library/react-native';
import { renderRouter, type RenderRouterOptions } from 'expo-router/testing-library';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useJourneyStore } from '@/stores/journey.store';
import { usePlayerStore } from '@/stores/player.store';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useSessionStore } from '@/stores/session.store';
import { useSyncStore } from '@/stores/sync.store';

/**
 * Render helpers for component and screen tests (EPIC-01.8).
 *
 * The persisted stores use AsyncStorage: a test that renders through here mocks it locally, as the
 * test rules ask (`jest.mock('@react-native-async-storage/async-storage', ...)`).
 */

const stores = {
  session: useSessionStore,
  preferences: usePreferencesStore,
  journey: useJourneyStore,
  player: usePlayerStore,
  sync: useSyncStore,
};

type Stores = typeof stores;

/** Initial state per store, e.g. `{ session: { isAuthenticated: true } }`. */
export type StoreOverrides = {
  [Name in keyof Stores]?: Partial<ReturnType<Stores[Name]['getState']>>;
};

/** Every store back to its initial state, then the overrides — no state leaks between tests. */
export function resetStores(overrides: StoreOverrides = {}): void {
  for (const name of Object.keys(stores) as (keyof Stores)[]) {
    const store = stores[name] as unknown as {
      getInitialState(): object;
      setState(state: object, replace: true): void;
    };
    store.setState({ ...store.getInitialState(), ...overrides[name] }, true);
  }
}

/** Same fixed insets as the Storybook decorators, so safe-area layouts render deterministically. */
const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function Providers({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={INITIAL_METRICS}>{children}</SafeAreaProvider>;
}

/** Renders a component with the app's providers and the stores reset (plus `stores` overrides). */
export function renderWithProviders(
  ui: ReactElement,
  { stores: overrides, ...options }: RenderOptions & { stores?: StoreOverrides } = {},
) {
  resetStores(overrides);
  return render(ui, { wrapper: Providers, ...options });
}

const APP_DIRECTORY = path.resolve(__dirname, '../src/app');

/**
 * Renders the real app — root layout, route guards and screens from `src/app` — at `initialUrl`.
 * The root layout waits for the database and starts sync and the Supabase listener: mock
 * `@/db/client`, `@/lib/sync/use-sync` and `@/features/auth/use-supabase-auth-sync` in the test.
 */
export function renderApp(
  initialUrl = '/',
  { stores: overrides, ...options }: RenderRouterOptions & { stores?: StoreOverrides } = {},
) {
  resetStores(overrides);
  return renderRouter(APP_DIRECTORY, { initialUrl, ...options });
}
