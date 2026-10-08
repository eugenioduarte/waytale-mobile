import { jest } from '@jest/globals';

import migrations from '@/db/migrations';
import {
  NIL_ID,
  type PullAfter,
  type RemoteRow,
  type SyncRemote,
  SyncRemoteError,
} from '@/lib/sync/remote';
import type { SqlExecutor, SqlValue } from '@/lib/sync/sql';

// `node:sqlite` ships with Node 22.5+; expo-sqlite is native and can't run under Jest.
type SqliteModule = typeof import('node:sqlite');
let sqlite: SqliteModule | null = null;
try {
  sqlite = jest.requireActual<SqliteModule>('node:sqlite');
} catch {
  sqlite = null;
}
export const hasSqlite = sqlite !== null;

/**
 * A migrated in-memory SQLite (the real bundled migrations, foreign keys on) behind the same
 * `SqlExecutor` the app gets from expo-sqlite. `raw` is there for assertions.
 */
export function createTestDatabase() {
  const raw = new sqlite!.DatabaseSync(':memory:');
  raw.exec('PRAGMA foreign_keys = ON;');
  for (const entry of migrations.journal.entries) {
    const key = `m${String(entry.idx).padStart(4, '0')}` as keyof typeof migrations.migrations;
    for (const statement of migrations.migrations[key].split('--> statement-breakpoint')) {
      raw.exec(statement);
    }
  }

  let inTransaction = false;
  const executor: SqlExecutor = {
    async all<T>(sql: string, params: SqlValue[] = []) {
      return raw.prepare(sql).all(...params) as T[];
    },
    async run(sql, params = []) {
      raw.prepare(sql).run(...params);
    },
    async transaction(task) {
      if (inTransaction) return task(executor);
      inTransaction = true;
      raw.exec('BEGIN');
      try {
        const result = await task(executor);
        raw.exec('COMMIT');
        return result;
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      } finally {
        inTransaction = false;
      }
    },
  };
  return { db: executor, raw };
}

/**
 * In-memory stand-in for the Supabase tables, with the semantics the SQL tests in
 * `supabase/tests/sync.test.ts` pin down: `updated_at` from the server clock on every write,
 * upsert on the given conflict key, keyset pull in `updated_at, id` order.
 */
export class FakeRemote implements SyncRemote {
  readonly tables = new Map<string, RemoteRow[]>();
  offline = false;
  private clock = Date.parse('2026-09-29T08:00:00.000Z');
  private rejections: string[] = [];
  calls = 0;

  /** Server timestamps look like PostgREST's (`+00:00`, not `Z`). */
  private tick(): string {
    this.clock += 1_000;
    return new Date(this.clock).toISOString().replace('Z', '+00:00');
  }

  /** The next write is refused for good (e.g. a constraint), once. */
  rejectNextWrite(message = '23503: violates foreign key constraint'): void {
    this.rejections.push(message);
  }

  rows(table: string): RemoteRow[] {
    return this.tables.get(table) ?? [];
  }

  /** Rows a client would see as present (tombstones excluded). */
  live(table: string): RemoteRow[] {
    return this.rows(table).filter((row) => !row.deleted_at);
  }

  seed(table: string, row: RemoteRow): void {
    this.tables.set(table, [...this.rows(table), { ...row, updated_at: this.tick() }]);
  }

  private guard(write: boolean): void {
    this.calls += 1;
    if (this.offline) throw new SyncRemoteError('TypeError: Network request failed', true, 0);
    if (write && this.rejections.length > 0) {
      throw new SyncRemoteError(this.rejections.shift()!, false, 409);
    }
  }

  async upsert(
    table: string,
    rows: RemoteRow[],
    { onConflict, ignoreDuplicates = false }: { onConflict: string; ignoreDuplicates?: boolean },
  ) {
    this.guard(true);
    const keys = onConflict.split(',');
    const stored = [...this.rows(table)];
    for (const row of rows) {
      const index = stored.findIndex((existing) => keys.every((key) => existing[key] === row[key]));
      if (index === -1) stored.push({ ...row, updated_at: this.tick() });
      else if (!ignoreDuplicates)
        stored[index] = { ...stored[index], ...row, updated_at: this.tick() };
    }
    this.tables.set(table, stored);
  }

  async update(table: string, match: RemoteRow, patch: RemoteRow) {
    this.guard(true);
    this.tables.set(
      table,
      this.rows(table).map((row) =>
        Object.entries(match).every(([key, value]) => row[key] === value)
          ? { ...row, ...patch, updated_at: this.tick() }
          : row,
      ),
    );
  }

  async pull(table: string, after: PullAfter | null, limit: number) {
    this.guard(false);
    const position = (row: RemoteRow) => Date.parse(row.updated_at as string);
    return [...this.rows(table)]
      .sort((a, b) => position(a) - position(b) || String(a.id).localeCompare(String(b.id)))
      .filter((row) => {
        if (!after) return true;
        const at = Date.parse(after.updatedAt);
        return (
          position(row) > at || (position(row) === at && String(row.id) > (after.id || NIL_ID))
        );
      })
      .slice(0, limit);
  }
}
