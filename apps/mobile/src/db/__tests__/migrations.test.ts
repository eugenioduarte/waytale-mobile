import { describe, expect, it, jest } from '@jest/globals';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

import type { Database } from '../client';
import migrations from '../migrations';
import * as schema from '../schema';
import { seedDemo } from '../seed';

// `node:sqlite` ships with Node 22.5+; expo-sqlite is native and can't run under Jest.
type SqliteModule = typeof import('node:sqlite');
let sqlite: SqliteModule | null = null;
try {
  sqlite = jest.requireActual<SqliteModule>('node:sqlite');
} catch {
  sqlite = null;
}
const describeWithSqlite = sqlite ? describe : describe.skip;

function migratedDatabase() {
  const db = new sqlite!.DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  // Same lookup and split as `drizzle-orm/expo-sqlite/migrator`.
  for (const entry of migrations.journal.entries) {
    const key = `m${String(entry.idx).padStart(4, '0')}` as keyof typeof migrations.migrations;
    for (const statement of migrations.migrations[key].split('--> statement-breakpoint')) {
      db.exec(statement);
    }
  }
  return db;
}

function count(db: InstanceType<SqliteModule['DatabaseSync']>, table: string) {
  return (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;
}

describe('bundled migrations', () => {
  it('keys every journal entry the way the expo-sqlite migrator looks it up', () => {
    for (const entry of migrations.journal.entries) {
      const key = `m${String(entry.idx).padStart(4, '0')}`;
      expect(migrations.migrations).toHaveProperty(key);
    }
  });
});

describeWithSqlite('schema + seed on a real SQLite', () => {
  it('creates all 11 tables', () => {
    const db = migratedDatabase();
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      )
      .all()
      .map((row) => (row as { name: string }).name);

    expect(tables).toEqual([
      'downloads',
      'journey_events',
      'journeys',
      'meta',
      'outbox',
      'places',
      'routes',
      'saved_items',
      'stops',
      'stories',
      'story_audio',
    ]);
  });

  it('seeds the demo route with foreign keys enforced, and re-seeding is a no-op', async () => {
    const db = migratedDatabase();
    const orm = drizzle(
      async (sql, params) => {
        db.prepare(sql).run(...(params as never[]));
        return { rows: [] };
      },
      { schema },
    ) as unknown as Database;

    await seedDemo(orm);
    await seedDemo(orm);

    expect(count(db, 'routes')).toBe(1);
    expect(count(db, 'stops')).toBe(2);
    expect(count(db, 'stories')).toBe(2);
    expect(count(db, 'story_audio')).toBe(2);
  });

  it('rejects a duplicate saved item for the same user', () => {
    const db = migratedDatabase();
    const insert = db.prepare(
      "INSERT INTO saved_items (id, user_id, item_type, item_id, created_at) VALUES (?, 'u1', 'route', 'r1', '2026-09-24T00:00:00Z')",
    );
    insert.run('a');

    expect(() => insert.run('b')).toThrow(/UNIQUE/);
  });
});
