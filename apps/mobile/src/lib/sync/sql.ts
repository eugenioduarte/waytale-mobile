import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

export type SqlValue = string | number | null;

/**
 * The few SQL operations the sync layer needs, with async transactions. Drizzle's expo-sqlite
 * driver only has synchronous transactions (no `await` inside), and every sync step awaits.
 * Tests back this with `node:sqlite` (`__tests__/helpers.ts`).
 */
export type SqlExecutor = {
  all<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  run(sql: string, params?: SqlValue[]): Promise<void>;
  /** Runs `task` atomically: every statement commits, or none does. */
  transaction<T>(task: (tx: SqlExecutor) => Promise<T>): Promise<T>;
};

function wrap(db: SQLiteDatabase): Omit<SqlExecutor, 'transaction'> {
  return {
    all: (sql, params = []) => db.getAllAsync(sql, params),
    run: async (sql, params = []) => {
      await db.runAsync(sql, params);
    },
  };
}

export function createExpoExecutor(db: SQLiteDatabase): SqlExecutor {
  const executor: SqlExecutor = {
    ...wrap(db),
    async transaction(task) {
      let result: Awaited<ReturnType<typeof task>> | undefined;
      // Exclusive: other queries wait, so a UI write can't interleave with a sync step. Not
      // available on web, where the plain variant is the only one.
      const run = async (tx: SQLiteDatabase) => {
        // A nested `transaction` joins this one (SQLite has no nested BEGIN).
        const inTransaction: SqlExecutor = {
          ...wrap(tx),
          transaction: (inner) => inner(inTransaction),
        };
        result = await task(inTransaction);
      };
      if (Platform.OS === 'web') await db.withTransactionAsync(() => run(db));
      else await db.withExclusiveTransactionAsync(run);
      return result as Awaited<ReturnType<typeof task>>;
    },
  };
  return executor;
}
