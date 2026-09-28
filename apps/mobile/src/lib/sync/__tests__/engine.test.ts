import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createSavedRepository } from '@/features/saved/repository';
import {
  BACKOFF_MAX_MS,
  backoffDelay,
  createSyncEngine,
  DEBOUNCE_MS,
  type SyncStatusSink,
} from '@/lib/sync/engine';

import { createTestDatabase, FakeRemote, hasSqlite } from '../../../../tests/helpers/sync';

jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));

const describeWithSqlite = hasSqlite ? describe : describe.skip;

const ALICE = '00000000-0000-4000-8000-00000000000a';
const PLACE = '00000000-0000-4000-8000-000000000101';

describe('backoffDelay', () => {
  it('doubles from 2 s, with 50–100 % jitter, capped at 5 min', () => {
    expect(backoffDelay(0, () => 1)).toBe(2_000);
    expect(backoffDelay(1, () => 1)).toBe(4_000);
    expect(backoffDelay(3, () => 0)).toBe(8_000);
    expect(backoffDelay(30, () => 1)).toBe(BACKOFF_MAX_MS);
  });
});

/** Timers the test fires by hand, so retries and debounces are deterministic. */
function manualTimers() {
  let nextId = 0;
  const pending = new Map<number, { callback: () => void; ms: number }>();
  return {
    setTimer: (callback: () => void, ms: number) => {
      nextId += 1;
      pending.set(nextId, { callback, ms });
      return nextId;
    },
    clearTimer: (timer: unknown) => {
      pending.delete(timer as number);
    },
    delays: () => [...pending.values()].map((timer) => timer.ms),
    /** Fires every pending timer once. */
    fire: () => {
      const due = [...pending.entries()];
      pending.clear();
      for (const [, timer] of due) timer.callback();
    },
  };
}

function recordingStatus() {
  const state = {
    syncing: [] as boolean[],
    pendingCount: -1,
    failedCount: -1,
    lastSyncedAt: null as string | null,
    lastError: null as string | null,
  };
  const sink: SyncStatusSink = {
    setSyncing: (value) => state.syncing.push(value),
    setPendingCount: (value) => {
      state.pendingCount = value;
    },
    setFailedCount: (value) => {
      state.failedCount = value;
    },
    setLastSyncedAt: (value) => {
      state.lastSyncedAt = value;
    },
    setLastError: (value) => {
      state.lastError = value;
    },
  };
  return { state, sink };
}

let remote: FakeRemote;

beforeEach(() => {
  remote = new FakeRemote();
});

function setup({ userId = ALICE as string | null, online = true } = {}) {
  const { db } = createTestDatabase();
  const timers = manualTimers();
  const status = recordingStatus();
  let isOnline = online;
  const engine = createSyncEngine({
    db,
    remote,
    getUserId: () => userId,
    isOnline: () => isOnline,
    status: status.sink,
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    random: () => 1,
  });
  return {
    engine,
    timers,
    status: status.state,
    saved: createSavedRepository(db),
    goOnline: () => {
      isOnline = true;
    },
  };
}

/** Lets pending promise callbacks (a timer-started sync) run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describeWithSqlite('sync engine', () => {
  it('reports progress: syncing, then counts and the time of the last sync', async () => {
    const { engine, saved, status } = setup();
    await saved.save(ALICE, 'place', PLACE);
    await engine.syncNow();

    expect(status.syncing).toEqual([true, false]);
    expect(status.pendingCount).toBe(0);
    expect(status.failedCount).toBe(0);
    expect(status.lastSyncedAt).not.toBeNull();
    expect(status.lastError).toBeNull();
  });

  it('does nothing without a signed-in user or offline', async () => {
    for (const options of [{ userId: null }, { online: false }]) {
      const { engine } = setup(options);
      await engine.syncNow();
    }
    expect(remote.calls).toBe(0);
  });

  it('retries a transient failure with growing backoff, and resets once it works', async () => {
    const { engine, saved, timers, status } = setup();
    await saved.save(ALICE, 'place', PLACE);
    remote.offline = true;

    await engine.syncNow();
    expect(status.lastError).toMatch(/Network request failed/);
    expect(timers.delays()).toEqual([2_000]);

    timers.fire();
    await settle();
    expect(timers.delays()).toEqual([4_000]);

    remote.offline = false;
    timers.fire();
    await settle();
    expect(remote.live('saved_items')).toHaveLength(1);
    expect(status.lastError).toBeNull();
    expect(timers.delays()).toEqual([]);
  });

  it('connectivity back cancels the backoff and syncs at once', async () => {
    const { engine, saved, timers } = setup();
    await saved.save(ALICE, 'place', PLACE);
    remote.offline = true;
    await engine.syncNow();
    expect(timers.delays()).toEqual([2_000]);

    remote.offline = false;
    engine.onOnline();
    await settle();
    await engine.syncNow();
    expect(timers.delays()).toEqual([]);
    expect(remote.live('saved_items')).toHaveLength(1);
  });

  it('debounces requests after local writes', async () => {
    const { engine, timers } = setup();
    engine.requestSync();
    engine.requestSync();
    engine.requestSync();
    expect(timers.delays()).toEqual([DEBOUNCE_MS]);
  });

  it('runs one cycle at a time, plus one more for requests made during it', async () => {
    const { engine, saved } = setup();
    await saved.save(ALICE, 'place', PLACE);
    const pulls = jest.spyOn(remote, 'pull');

    const first = engine.syncNow();
    const second = engine.syncNow();
    const third = engine.syncNow();
    await Promise.all([first, second, third]);

    // Two cycles (the running one + one follow-up), each pulling the 9 tables once.
    expect(pulls).toHaveBeenCalledTimes(18);
  });

  it('stops scheduling after dispose', async () => {
    const { engine, timers } = setup();
    engine.requestSync();
    engine.dispose();
    expect(timers.delays()).toEqual([]);
    await engine.syncNow();
    expect(remote.calls).toBe(0);
  });
});
