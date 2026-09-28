import { randomUUID } from 'expo-crypto';

import type { SqlExecutor } from './sql';

/**
 * The outbox: every local write to a synced user table records what to replay on the server, in
 * the same SQLite transaction as the write itself — so a row never exists locally without its
 * outbox entry, or the other way round.
 *
 * Payloads (JSON): `insert` = the full local row; `update` = only the changed columns (the
 * "last to sync wins, per field" rule of the SDD); `delete` = `{}`, or the natural key for tables
 * that have one (`saved_items`, `downloads`), which is also required on `update` there.
 */

export type OutboxOperation = 'insert' | 'update' | 'delete';

export type OutboxEntry = {
  id: string;
  user_id: string | null;
  operation: OutboxOperation;
  entity_type: string;
  entity_id: string;
  payload: string;
  created_at: string;
  attempts: number;
};

export const newId = (): string => randomUUID();

export async function enqueue(
  tx: SqlExecutor,
  entry: {
    userId: string;
    operation: OutboxOperation;
    table: string;
    entityId: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  await tx.run(
    `INSERT INTO outbox (id, user_id, operation, entity_type, entity_id, payload, created_at, attempts)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      newId(),
      entry.userId,
      entry.operation,
      entry.table,
      entry.entityId,
      JSON.stringify(entry.payload),
      new Date().toISOString(),
    ],
  );
}

const PENDING = 'synced_at IS NULL AND failed_at IS NULL AND user_id = ?';

/** Entries still to push for `userId`, oldest first (rowid breaks same-millisecond ties). */
export function pendingEntries(db: SqlExecutor, userId: string): Promise<OutboxEntry[]> {
  return db.all<OutboxEntry>(
    `SELECT id, user_id, operation, entity_type, entity_id, payload, created_at, attempts
     FROM outbox WHERE ${PENDING} ORDER BY created_at, rowid`,
    [userId],
  );
}

export async function countPending(db: SqlExecutor, userId: string): Promise<number> {
  const [row] = await db.all<{ n: number }>(`SELECT COUNT(*) AS n FROM outbox WHERE ${PENDING}`, [
    userId,
  ]);
  return row?.n ?? 0;
}

/** Entries the server rejected for good (dead letters). */
export async function countFailed(db: SqlExecutor, userId: string): Promise<number> {
  const [row] = await db.all<{ n: number }>(
    'SELECT COUNT(*) AS n FROM outbox WHERE failed_at IS NOT NULL AND user_id = ?',
    [userId],
  );
  return row?.n ?? 0;
}

export function markSynced(db: SqlExecutor, id: string): Promise<void> {
  return db.run('UPDATE outbox SET synced_at = ?, last_error = NULL WHERE id = ?', [
    new Date().toISOString(),
    id,
  ]);
}

/** A transient failure: counted, kept pending, retried with backoff. */
export function markAttempt(db: SqlExecutor, id: string, error: string): Promise<void> {
  return db.run('UPDATE outbox SET attempts = attempts + 1, last_error = ? WHERE id = ?', [
    error,
    id,
  ]);
}

/** A permanent rejection: no more retries, so the entries behind it can go. */
export function markFailed(db: SqlExecutor, id: string, error: string): Promise<void> {
  return db.run(
    'UPDATE outbox SET attempts = attempts + 1, last_error = ?, failed_at = ? WHERE id = ?',
    [error, new Date().toISOString(), id],
  );
}

/**
 * Whether a local row has writes still on their way to the server (a pull must not overwrite
 * it). Refused writes don't count: they will never arrive, so the server's version wins.
 */
export async function hasPendingWrites(
  db: SqlExecutor,
  table: string,
  entityId: string,
): Promise<boolean> {
  const rows = await db.all(
    `SELECT 1 FROM outbox WHERE entity_type = ? AND entity_id = ?
     AND synced_at IS NULL AND failed_at IS NULL LIMIT 1`,
    [table, entityId],
  );
  return rows.length > 0;
}
