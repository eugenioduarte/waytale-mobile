import { nowIso } from '@/lib/date';

import { markAttempt, markFailed, markSynced, type OutboxEntry, pendingEntries } from './outbox';
import { type RemoteRow, type SyncRemote, SyncRemoteError } from './remote';
import { getSyncTable, type SyncTable } from './tables';

export type PushResult = {
  pushed: number;
  failed: number;
  /** Set when a transient error stopped the push; the rest waits for the next attempt. */
  retryError: SyncRemoteError | null;
};

/** Local JSON text → jsonb value, for the columns stored as text in SQLite. */
function toRemote(table: SyncTable, values: RemoteRow): RemoteRow {
  const row = { ...values };
  for (const column of table.jsonColumns ?? []) {
    if (typeof row[column] === 'string') row[column] = JSON.parse(row[column]);
  }
  return row;
}

function pick(values: RemoteRow, keys: readonly string[]): RemoteRow {
  return Object.fromEntries(keys.map((key) => [key, values[key]]));
}

function omit(values: RemoteRow, keys: readonly string[]): RemoteRow {
  return Object.fromEntries(Object.entries(values).filter(([key]) => !keys.includes(key)));
}

/** Rejects entries the server could never accept, without a round trip. */
function invalid(message: string): SyncRemoteError {
  return new SyncRemoteError(message, false);
}

/** Replays one outbox entry. Idempotent: pushing it again leaves the server as it is. */
async function pushEntry(remote: SyncRemote, entry: OutboxEntry): Promise<void> {
  const table = getSyncTable(entry.entity_type);
  if (!table.userData) throw invalid(`${table.name} is read-only for clients`);
  const payload = JSON.parse(entry.payload) as RemoteRow;
  const key = table.conflictKey;
  // Rows with a natural key are matched by it: another device may have given the same item a
  // different id, and the server keeps one row per key.
  const match = key ? pick(payload, key) : { id: entry.entity_id };

  switch (entry.operation) {
    case 'insert': {
      const row = toRemote(table, { ...payload, id: entry.entity_id });
      if (table.appendOnly) {
        await remote.upsert(table.name, [row], { onConflict: 'id', ignoreDuplicates: true });
        return;
      }
      // Saving again what was removed revives the tombstone.
      if (table.tombstone) row.deleted_at = null;
      await remote.upsert(table.name, [row], { onConflict: (key ?? ['id']).join(',') });
      return;
    }
    case 'update': {
      if (table.appendOnly) throw invalid(`${table.name} is append-only`);
      const patch = toRemote(table, omit(payload, key ?? ['id']));
      if (Object.keys(patch).length === 0) return;
      await remote.update(table.name, match, patch);
      return;
    }
    case 'delete': {
      if (!table.tombstone) throw invalid(`${table.name} rows can't be removed`);
      await remote.update(table.name, match, { deleted_at: nowIso() });
      return;
    }
    default:
      throw invalid(`unknown operation ${String(entry.operation)}`);
  }
}

function describe(error: unknown): SyncRemoteError {
  if (error instanceof SyncRemoteError) return error;
  // A malformed payload (bad JSON, unknown table) is a local bug; retrying won't fix it.
  return invalid(error instanceof Error ? error.message : String(error));
}

/**
 * Pushes `userId`'s pending outbox entries in order. A transient error stops the push (later
 * entries may depend on the one that failed, e.g. events of a journey not yet inserted); a
 * permanent one parks the entry as failed and moves on.
 */
export async function pushOutbox(
  db: Parameters<typeof pendingEntries>[0],
  remote: SyncRemote,
  userId: string,
): Promise<PushResult> {
  const result: PushResult = { pushed: 0, failed: 0, retryError: null };
  for (const entry of await pendingEntries(db, userId)) {
    try {
      await pushEntry(remote, entry);
      await markSynced(db, entry.id);
      result.pushed += 1;
    } catch (caught) {
      const error = describe(caught);
      if (error.retryable) {
        await markAttempt(db, entry.id, error.message);
        result.retryError = error;
        return result;
      }
      await markFailed(db, entry.id, error.message);
      result.failed += 1;
    }
  }
  return result;
}
