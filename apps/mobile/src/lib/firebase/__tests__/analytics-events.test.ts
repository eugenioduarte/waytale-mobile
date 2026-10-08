import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { saveItem } from '@/features/saved/saved';
import { parseIso } from '@/lib/date';
import { track } from '@/lib/firebase';
import { useJourneyStore } from '@/stores/journey.store';
import { usePlayerStore } from '@/stores/player.store';
import { createTestDatabase, hasSqlite } from '@tests/helpers/sync';

// The four product events (01.12), fired where each action happens. Firebase itself is replaced.
jest.mock('@/lib/firebase', () => ({ track: jest.fn(async () => {}) }));
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));
const mockDatabase = { current: null as ReturnType<typeof createTestDatabase> | null };
jest.mock('@/lib/sync/runtime', () => ({
  getSyncExecutor: () => mockDatabase.current!.db,
  requestSync: () => {},
}));

const tracked = jest.mocked(track);

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers().setSystemTime(parseIso('2026-01-01T10:45:00.000Z'));
  useJourneyStore.setState(useJourneyStore.getInitialState(), true);
});
afterEach(() => {
  jest.useRealTimers();
});

describe('journey', () => {
  it('starting a walk is route_started', () => {
    useJourneyStore.getState().startJourney({
      journeyId: 'j1',
      routeId: 'r1',
      currentStopIndex: 0,
      startedAt: '2026-01-01T10:00:00.000Z',
    });

    expect(tracked).toHaveBeenCalledWith('route_started', { route_id: 'r1' });
  });

  it('finishing it is journey_completed, with how long it took', () => {
    useJourneyStore.getState().startJourney({
      journeyId: 'j1',
      routeId: 'r1',
      currentStopIndex: 2,
      startedAt: '2026-01-01T10:00:00.000Z',
    });

    useJourneyStore.getState().finishJourney();

    expect(tracked).toHaveBeenLastCalledWith('journey_completed', {
      journey_id: 'j1',
      route_id: 'r1',
      duration_minutes: 45,
    });
  });

  it('finishing with no walk in progress tracks nothing', () => {
    useJourneyStore.getState().finishJourney();

    expect(tracked).not.toHaveBeenCalled();
  });
});

describe('player', () => {
  it('playing a story is story_played', () => {
    usePlayerStore.getState().playAudio('audio-7');

    expect(tracked).toHaveBeenCalledWith('story_played', { audio_id: 'audio-7' });
  });
});

(hasSqlite ? describe : describe.skip)('saved', () => {
  beforeEach(() => {
    mockDatabase.current = createTestDatabase();
  });

  it('saving a place is place_saved', async () => {
    await saveItem('place', '00000000-0000-4000-8000-000000000101');

    expect(tracked).toHaveBeenCalledWith('place_saved', {
      place_id: '00000000-0000-4000-8000-000000000101',
    });
  });

  it('saving a route is not a place_saved', async () => {
    await saveItem('route', '00000000-0000-4000-8000-000000000001');

    expect(tracked).not.toHaveBeenCalled();
  });
});
