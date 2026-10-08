import { nowIso } from '@/lib/date';
import { enqueue, newId } from '@/lib/sync/outbox';
import type { SqlExecutor } from '@/lib/sync/sql';

export type SavedItemType = 'route' | 'place';

export type SavedItem = {
  id: string;
  user_id: string;
  item_type: SavedItemType;
  item_id: string;
  created_at: string;
};

/**
 * Saved routes and places. Writes go to SQLite and the outbox in one transaction (offline-first);
 * the sync layer takes them to Supabase. Callers then ask for a sync (`requestSync`).
 */
export function createSavedRepository(db: SqlExecutor) {
  return {
    /** Saves an item; saving it again is a no-op (one save per item per user). */
    async save(userId: string, itemType: SavedItemType, itemId: string): Promise<void> {
      await db.transaction(async (tx) => {
        const existing = await tx.all(
          'SELECT 1 FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?',
          [userId, itemType, itemId],
        );
        if (existing.length > 0) return;
        const row = {
          id: newId(),
          user_id: userId,
          item_type: itemType,
          item_id: itemId,
          created_at: nowIso(),
        };
        await tx.run(
          'INSERT INTO saved_items (id, user_id, item_type, item_id, created_at) VALUES (?, ?, ?, ?, ?)',
          [row.id, row.user_id, row.item_type, row.item_id, row.created_at],
        );
        await enqueue(tx, {
          userId,
          operation: 'insert',
          table: 'saved_items',
          entityId: row.id,
          payload: row,
        });
      });
    },

    /** Removes a saved item; removing one that isn't saved is a no-op. */
    async remove(userId: string, itemType: SavedItemType, itemId: string): Promise<void> {
      await db.transaction(async (tx) => {
        const [existing] = await tx.all<{ id: string }>(
          'SELECT id FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?',
          [userId, itemType, itemId],
        );
        if (!existing) return;
        await tx.run('DELETE FROM saved_items WHERE id = ?', [existing.id]);
        await enqueue(tx, {
          userId,
          operation: 'delete',
          table: 'saved_items',
          entityId: existing.id,
          // Matched by natural key on the server: another device may know it by another id.
          payload: { user_id: userId, item_type: itemType, item_id: itemId },
        });
      });
    },

    list(userId: string): Promise<SavedItem[]> {
      return db.all<SavedItem>(
        'SELECT id, user_id, item_type, item_id, created_at FROM saved_items WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
      );
    },
  };
}
