import { resetUserCursors } from './pull';
import type { SqlExecutor } from './sql';

/**
 * Removes every other user's data from this device: their rows, their outbox entries (never
 * pushed with someone else's session) and the user-table pull cursors. The catalog stays.
 *
 * `keepUserId = null` (signed out) removes all user data. Unsynced writes of a removed user are
 * lost, which is why sign-out tries a last push first (`flushSync`).
 */
export async function clearOtherUsersData(
  db: SqlExecutor,
  keepUserId: string | null,
): Promise<boolean> {
  const keep = keepUserId ?? '';
  return db.transaction(async (tx) => {
    const [stale] = await tx.all<{ n: number }>(
      `SELECT
         (SELECT COUNT(*) FROM saved_items WHERE user_id <> ?) +
         (SELECT COUNT(*) FROM journeys WHERE user_id <> ?) +
         (SELECT COUNT(*) FROM downloads WHERE user_id <> ?) +
         (SELECT COUNT(*) FROM outbox WHERE user_id IS NULL OR user_id <> ?) AS n`,
      [keep, keep, keep, keep],
    );
    if (!stale?.n) return false;
    // journey_events go with their journeys (ON DELETE CASCADE).
    await tx.run('DELETE FROM saved_items WHERE user_id <> ?', [keep]);
    await tx.run('DELETE FROM journeys WHERE user_id <> ?', [keep]);
    await tx.run('DELETE FROM downloads WHERE user_id <> ?', [keep]);
    await tx.run('DELETE FROM outbox WHERE user_id IS NULL OR user_id <> ?', [keep]);
    await resetUserCursors(tx);
    return true;
  });
}
