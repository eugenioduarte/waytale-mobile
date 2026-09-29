import { isAfterIso, shiftIso } from '@/lib/date';

import { hasPendingWrites } from './outbox';
import { NIL_ID, type PullAfter, type RemoteRow, type SyncRemote } from './remote';
import type { SqlExecutor, SqlValue } from './sql';
import { SYNC_TABLES, type SyncTable } from './tables';

/**
 * `updated_at` is the server's `now()`, the start of the writing transaction: a slow transaction
 * can commit rows stamped before a cursor already read. Every pull re-reads this window; applying
 * a row twice is harmless.
 */
export const PULL_OVERLAP_MS = 5 * 60_000;
export const PULL_PAGE_SIZE = 500;

const cursorKey = (table: string) => `sync.cursor.${table}`;

export async function readCursor(db: SqlExecutor, table: string): Promise<string | null> {
  const [row] = await db.all<{ value: string }>('SELECT value FROM meta WHERE key = ?', [
    cursorKey(table),
  ]);
  return row?.value ?? null;
}

function writeCursor(db: SqlExecutor, table: string, value: string): Promise<void> {
  return db.run(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [cursorKey(table), value],
  );
}

/** Forgets where the user tables were pulled up to (their rows were just cleared). */
export async function resetUserCursors(db: SqlExecutor): Promise<void> {
  for (const table of SYNC_TABLES.filter((candidate) => candidate.userData)) {
    await db.run('DELETE FROM meta WHERE key = ?', [cursorKey(table.name)]);
  }
}

function toLocal(table: SyncTable, row: RemoteRow): SqlValue[] {
  return table.columns.map((column) => {
    const value = row[column];
    if (value === undefined || value === null) return null;
    if (table.jsonColumns?.includes(column)) return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 1 : 0;
    return value as SqlValue;
  });
}

/**
 * By message, not `instanceof`: expo-sqlite wraps the SQLite error ("… Error code 19: FOREIGN KEY
 * constraint failed"), and errors from other realms fail `instanceof Error`.
 */
function isForeignKeyError(error: unknown): boolean {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && /FOREIGN KEY/i.test(message);
}

/** Local rows sharing `row`'s natural key under another id (the same item saved elsewhere). */
async function sameKeyIds(db: SqlExecutor, table: SyncTable, row: RemoteRow): Promise<string[]> {
  const key = table.conflictKey!;
  const found = await db.all<{ id: string }>(
    `SELECT id FROM ${table.name} WHERE ${key.map((column) => `${column} = ?`).join(' AND ')} AND id <> ?`,
    [...key.map((column) => row[column] as SqlValue), row.id as string],
  );
  return found.map((local) => local.id);
}

/** Applies one server row locally. Returns false when it was skipped. */
async function applyRow(db: SqlExecutor, table: SyncTable, row: RemoteRow): Promise<boolean> {
  const id = row.id as string;
  // Local writes not yet pushed win for now: they go out next and come back on a later pull.
  if (table.userData && (await hasPendingWrites(db, table.name, id))) return false;

  if (table.conflictKey) {
    const others = await sameKeyIds(db, table, row);
    for (const other of others) {
      if (await hasPendingWrites(db, table.name, other)) return false;
    }
    for (const other of others) await db.run(`DELETE FROM ${table.name} WHERE id = ?`, [other]);
  }

  if (row.deleted_at) {
    await db.run(`DELETE FROM ${table.name} WHERE id = ?`, [id]);
    return true;
  }

  const columns = table.columns;
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = excluded.${column}`);
  try {
    await db.run(
      `INSERT INTO ${table.name} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})
       ON CONFLICT(id) DO UPDATE SET ${updates.join(', ')}`,
      toLocal(table, row),
    );
    return true;
  } catch (error) {
    // Parent missing locally (e.g. an event of a removed journey): skip the row. A parent that
    // arrives within the overlap window brings its children back on the next pull.
    if (isForeignKeyError(error)) return false;
    throw error;
  }
}

/**
 * Pulls every synced table in parent-first order, page by page, and moves each table's cursor
 * to the last row applied. Each page is one local transaction.
 */
export async function pullAll(db: SqlExecutor, remote: SyncRemote): Promise<number> {
  let applied = 0;
  for (const table of SYNC_TABLES) {
    const cursor = await readCursor(db, table.name);
    let after: PullAfter | null = cursor
      ? { updatedAt: shiftIso(cursor, -PULL_OVERLAP_MS), id: NIL_ID }
      : null;

    for (;;) {
      const rows = await remote.pull(table.name, after, PULL_PAGE_SIZE);
      if (rows.length === 0) break;
      const last = rows[rows.length - 1]!;
      await db.transaction(async (tx) => {
        for (const row of rows) if (await applyRow(tx, table, row)) applied += 1;
        // Never move a cursor back: the overlap re-read ends before the stored cursor.
        const lastAt = last.updated_at as string;
        if (!cursor || isAfterIso(lastAt, cursor)) await writeCursor(tx, table.name, lastAt);
      });
      if (rows.length < PULL_PAGE_SIZE) break;
      after = { updatedAt: last.updated_at as string, id: last.id as string };
    }
  }
  return applied;
}
