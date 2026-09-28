import { getSyncExecutor, requestSync } from '@/lib/sync/runtime';
import { useSessionStore } from '@/stores/session.store';

import { createSavedRepository, type SavedItem, type SavedItemType } from './repository';

/**
 * Local-only owner for the navigation preview (no Supabase user). Its rows never sync (the outbox
 * only pushes the signed-in user's entries) and are removed when a real user signs in.
 */
const PREVIEW_USER_ID = 'preview';

const currentUserId = () => useSessionStore.getState().user?.id ?? PREVIEW_USER_ID;
const repository = () => createSavedRepository(getSyncExecutor());

export async function saveItem(itemType: SavedItemType, itemId: string): Promise<void> {
  await repository().save(currentUserId(), itemType, itemId);
  requestSync();
}

export async function removeSavedItem(itemType: SavedItemType, itemId: string): Promise<void> {
  await repository().remove(currentUserId(), itemType, itemId);
  requestSync();
}

export function listSavedItems(): Promise<SavedItem[]> {
  return repository().list(currentUserId());
}
