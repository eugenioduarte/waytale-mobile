import type { Decorator } from '@storybook/react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useLanguageSync } from '@/lib/i18n';
import { usePreferencesStore } from '@/stores/preferences.store';
import { useSessionStore } from '@/stores/session.store';
import { useSyncStore } from '@/stores/sync.store';

/**
 * Global decorators shared by the on-device Storybook (`.rnstorybook`) and the web build
 * (`.storybook`), so a component looks the same in both.
 */

/** Per-story store state: `parameters: { stores: { sync: { isOnline: false } } }`. */
export type StoreMocks = {
  sync?: Partial<ReturnType<typeof useSyncStore.getState>>;
  session?: Partial<ReturnType<typeof useSessionStore.getState>>;
  preferences?: Partial<ReturnType<typeof usePreferencesStore.getState>>;
};

/**
 * Resets the stores to their initial state, then applies the story's overrides — so one story's
 * state never leaks into the next. Applied once per mount, before the story subscribes.
 */
function StoreMocksProvider({
  stores,
  children,
}: {
  stores: StoreMocks | undefined;
  children: React.ReactNode;
}) {
  useState(() => {
    useSyncStore.setState({ ...useSyncStore.getInitialState(), ...stores?.sync }, true);
    useSessionStore.setState({ ...useSessionStore.getInitialState(), ...stores?.session }, true);
    usePreferencesStore.setState(
      { ...usePreferencesStore.getInitialState(), ...stores?.preferences },
      true,
    );
    return true;
  });
  return children;
}

const withStoreMocks: Decorator = (Story, { parameters, id }) => (
  // Keyed by story, so switching stories remounts and re-applies the mocks.
  <StoreMocksProvider key={id} stores={parameters.stores as StoreMocks | undefined}>
    <Story />
  </StoreMocksProvider>
);

/** Fixed insets, so layouts that read the safe area render the same on web and on a device. */
const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const withSafeArea: Decorator = (Story) => (
  <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
    <Story />
  </SafeAreaProvider>
);

/** The app background and spacing tokens around every story (`layout: 'fullscreen'` opts out). */
const withTokens: Decorator = (Story, { parameters }) =>
  parameters.layout === 'fullscreen' ? (
    <Story />
  ) : (
    <View className="flex-1 bg-surface p-6">
      <Story />
    </View>
  );

/** Copy follows the device language, or `parameters.stores.preferences.language`, as in the app. */
function LanguageSync({ children }: { children: React.ReactNode }) {
  useLanguageSync();
  return children;
}

const withLanguage: Decorator = (Story) => (
  <LanguageSync>
    <Story />
  </LanguageSync>
);

// Outermost last: safe area wraps everything, store mocks apply before the story mounts and
// before the language follows them.
export const decorators: Decorator[] = [withTokens, withLanguage, withStoreMocks, withSafeArea];
