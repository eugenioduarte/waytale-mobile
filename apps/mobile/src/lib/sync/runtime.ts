import { getSqlite } from '@/db/client';

import type { SyncEngine } from './engine';
import { createExpoExecutor, type SqlExecutor } from './sql';

/**
 * The app's single sync engine and SQL executor. `useSync` (root layout) starts and stops the
 * engine; features only call `requestSync` after a local write.
 */

let executor: SqlExecutor | null = null;
let engine: SyncEngine | null = null;

export function getSyncExecutor(): SqlExecutor {
  executor ??= createExpoExecutor(getSqlite());
  return executor;
}

export function setSyncEngine(next: SyncEngine | null): void {
  engine = next;
}

/** After a local write: sync soon. A no-op while sync isn't running (offline preview, tests). */
export function requestSync(): void {
  engine?.requestSync();
}

/**
 * Tries to push what's pending before the session goes away (sign-out clears this user's local
 * data, unsynced writes included). Gives up after `timeoutMs`, so sign-out never hangs offline.
 */
export async function flushSync(timeoutMs = 5_000): Promise<void> {
  if (!engine) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    engine.syncNow(),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeoutMs);
    }),
  ]);
  clearTimeout(timer);
}
