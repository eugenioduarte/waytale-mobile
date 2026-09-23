import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useJourneyStore } from '@/stores/journey.store';
import { usePlayerStore } from '@/stores/player.store';
import { useSessionStore } from '@/stores/session.store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

async function persisted(key: string) {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw).state : null;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('journey + player persistence (01.3 acceptance: kill and reopen mid-walk)', () => {
  it('restores the current stop and audio position after a cold start', async () => {
    useJourneyStore.getState().startJourney({
      journeyId: 'j1',
      routeId: 'r1',
      currentStopIndex: 0,
      startedAt: '2026-09-23T10:00:00.000Z',
    });
    useJourneyStore.getState().advanceToStop(3);
    usePlayerStore.getState().playAudio('story-7');
    usePlayerStore.getState().seekTo(42_000);

    // Simulate the kill: wipe in-memory state (persist writes that through, so put the snapshot
    // taken before the kill back on disk), then rehydrate from storage.
    const onDisk = await AsyncStorage.multiGet(['waytale-journey', 'waytale-player']);
    useJourneyStore.setState({ activeJourney: null });
    usePlayerStore.setState({ currentAudioId: null, positionMs: 0, isPlaying: false });
    await AsyncStorage.multiSet(onDisk.map(([key, value]) => [key, value ?? '']));
    expect(useJourneyStore.getState().activeJourney).toBeNull();

    await useJourneyStore.persist.rehydrate();
    await usePlayerStore.persist.rehydrate();

    expect(useJourneyStore.getState().activeJourney?.currentStopIndex).toBe(3);
    expect(usePlayerStore.getState().currentAudioId).toBe('story-7');
    expect(usePlayerStore.getState().positionMs).toBe(42_000);
  });

  it('never resumes playback on its own', async () => {
    usePlayerStore.getState().playAudio('story-7');

    expect(await persisted('waytale-player')).not.toHaveProperty('isPlaying');
  });
});

describe('session persistence', () => {
  it('persists only the whitelisted fields, never tokens', async () => {
    // A field outside the whitelist (like a future token) must not reach storage.
    useSessionStore.setState({ accessToken: 'secret' } as never);
    useSessionStore.getState().signIn();

    const state = await persisted('waytale-session');
    expect(Object.keys(state).sort()).toEqual([
      'hasCompletedOnboarding',
      'isAuthenticated',
      'user',
    ]);
  });
});
