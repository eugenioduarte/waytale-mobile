import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import migrations from './migrations';
import * as schema from './schema';
import { seedDemo } from './seed';

export type Database = ExpoSQLiteDatabase<typeof schema>;

let sqlite: SQLiteDatabase | null = null;
let database: Database | null = null;
let initialization: Promise<void> | null = null;

/**
 * The raw expo-sqlite connection, opened once. Drizzle wraps it for typed reads; the sync layer
 * (`lib/sync/`) uses it directly for async transactions.
 */
export function getSqlite(): SQLiteDatabase {
  if (!sqlite) {
    sqlite = openDatabaseSync('waytale.db');
    // SQLite leaves foreign keys off per connection; without this the schema's `onDelete: cascade`
    // is ignored. WAL lets reads proceed while sync writes.
    sqlite.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  }
  return sqlite;
}

/**
 * Returns the typed Drizzle database. All UI reads go through this — the network never feeds the
 * UI directly (offline-first).
 */
export function getDatabase(): Database {
  database ??= drizzle(getSqlite(), { schema });
  return database;
}

/** Applies the versioned Drizzle migrations (idempotent). */
export async function migrateDatabase(): Promise<void> {
  await migrate(getDatabase(), migrations);
}

/** Migrates, then seeds the demo route in development. Runs once per app launch. */
export function initializeDatabase(): Promise<void> {
  initialization ??= (async () => {
    await migrateDatabase();
    if (__DEV__) await seedDemo(getDatabase());
  })();
  return initialization;
}

/**
 * `true` once the database is migrated. Screens mount after this, so no read ever hits a missing
 * table. A failure is logged and still counts as settled — keeping the splash up forever would be
 * worse than a screen that reports its own error.
 */
export function useDatabaseReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeDatabase()
      .catch((error: unknown) => console.error('[db] initialization failed', error))
      .finally(() => setIsReady(true));
  }, []);

  return isReady;
}
