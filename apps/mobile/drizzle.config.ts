import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit config for the local SQLite (expo-sqlite) store.
 * `driver: 'expo'` generates migrations that `drizzle-orm/expo-sqlite/migrator` can apply.
 */
export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
});
