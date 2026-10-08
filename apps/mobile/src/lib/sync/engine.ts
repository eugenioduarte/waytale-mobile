import { nowIso } from '@/lib/date';

import { countFailed, countPending } from './outbox';
import { pullAll } from './pull';
import { pushOutbox } from './push';
import { type SyncRemote, SyncRemoteError } from './remote';
import type { SqlExecutor } from './sql';

/** Where the engine reports its state; the app wires this to the sync store. */
export type SyncStatusSink = {
  setSyncing(isSyncing: boolean): void;
  setPendingCount(pendingCount: number): void;
  setFailedCount(failedCount: number): void;
  setLastSyncedAt(lastSyncedAt: string): void;
  setLastError(lastError: string | null): void;
};

export type SyncEngineDeps = {
  db: SqlExecutor;
  remote: SyncRemote;
  getUserId: () => string | null;
  isOnline: () => boolean;
  status: SyncStatusSink;
  setTimer?: (callback: () => void, ms: number) => unknown;
  clearTimer?: (timer: unknown) => void;
  random?: () => number;
};

export const DEBOUNCE_MS = 1_000;
export const BACKOFF_BASE_MS = 2_000;
export const BACKOFF_MAX_MS = 5 * 60_000;

/** Exponential backoff with jitter: 2 s, 4 s, 8 s… up to 5 min, each scaled by 50–100 %. */
export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(BACKOFF_BASE_MS * 2 ** attempt, BACKOFF_MAX_MS);
  return Math.round(base * (0.5 + random() * 0.5));
}

export type SyncEngine = {
  /** Soon (debounced): after a local write, on foreground. */
  requestSync(): void;
  /** Now; resolves when this cycle (and any requested during it) is done. */
  syncNow(): Promise<void>;
  /** Connectivity is back: drop the backoff and sync at once. */
  onOnline(): void;
  /** Refreshes the pending/failed counts without syncing (e.g. offline writes). */
  refreshCounts(): Promise<void>;
  dispose(): void;
};

/**
 * Runs sync cycles one at a time: push the outbox, then (only if the push went through) pull.
 * A transient failure schedules a retry with backoff; a new request during a cycle runs one more
 * cycle right after it.
 */
export function createSyncEngine({
  db,
  remote,
  getUserId,
  isOnline,
  status,
  setTimer = (callback, ms) => setTimeout(callback, ms),
  clearTimer = (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
  random = Math.random,
}: SyncEngineDeps): SyncEngine {
  let running: Promise<void> | null = null;
  let again = false;
  let attempt = 0;
  let debounce: unknown = null;
  let retry: unknown = null;
  let disposed = false;

  async function refreshCounts(): Promise<void> {
    const userId = getUserId();
    status.setPendingCount(userId ? await countPending(db, userId) : 0);
    status.setFailedCount(userId ? await countFailed(db, userId) : 0);
  }

  function scheduleRetry(): void {
    if (disposed || retry !== null) return;
    const delay = backoffDelay(attempt, random);
    attempt += 1;
    retry = setTimer(() => {
      retry = null;
      void syncNow();
    }, delay);
  }

  async function cycle(): Promise<void> {
    const userId = getUserId();
    if (!userId || !isOnline()) {
      // Still count: an offline write must show up as pending right away.
      await refreshCounts();
      return;
    }
    status.setSyncing(true);
    try {
      const push = await pushOutbox(db, remote, userId);
      if (push.retryError) {
        status.setLastError(push.retryError.message);
        scheduleRetry();
        return;
      }
      await pullAll(db, remote);
      attempt = 0;
      status.setLastError(null);
      status.setLastSyncedAt(nowIso());
    } catch (error) {
      status.setLastError(error instanceof Error ? error.message : String(error));
      // A failed pull or a local error: retry later too, unless the server refused for good.
      if (!(error instanceof SyncRemoteError) || error.retryable) scheduleRetry();
    } finally {
      status.setSyncing(false);
      await refreshCounts();
    }
  }

  function syncNow(): Promise<void> {
    if (disposed) return Promise.resolve();
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      do {
        again = false;
        await cycle();
      } while (again && !disposed);
    })().finally(() => {
      running = null;
    });
    return running;
  }

  return {
    requestSync() {
      if (disposed) return;
      if (debounce !== null) clearTimer(debounce);
      debounce = setTimer(() => {
        debounce = null;
        void syncNow();
      }, DEBOUNCE_MS);
    },
    syncNow,
    onOnline() {
      attempt = 0;
      if (retry !== null) {
        clearTimer(retry);
        retry = null;
      }
      void syncNow();
    },
    refreshCounts,
    dispose() {
      disposed = true;
      if (debounce !== null) clearTimer(debounce);
      if (retry !== null) clearTimer(retry);
    },
  };
}
