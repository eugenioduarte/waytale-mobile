import { useSyncExternalStore } from 'react';

import { useJourneyStore } from './journey.store';
import { usePlayerStore } from './player.store';
import { usePreferencesStore } from './preferences.store';
import { useSessionStore } from './session.store';

/**
 * AsyncStorage is async, so persisted stores start with their defaults and rehydrate a tick later.
 * The root layout waits for this before mounting the route guard — otherwise a signed-in cold start
 * renders as anonymous, redirects to `(auth)` and drops the deep link it was opened with.
 */
const persistedStores = [useSessionStore, usePreferencesStore, useJourneyStore, usePlayerStore];

function subscribe(onChange: () => void) {
  const unsubscribes = persistedStores.map((store) => store.persist.onFinishHydration(onChange));
  return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
}

function getSnapshot() {
  return persistedStores.every((store) => store.persist.hasHydrated());
}

export function useStoresHydrated() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
