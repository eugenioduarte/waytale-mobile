import { getSyncExecutor, requestSync } from '@/lib/sync/runtime';
import { PREVIEW_USER_ID } from '@/lib/sync/user-data';
import { useSessionStore } from '@/stores/session.store';

import { createSavedRepository, type SavedItem, type SavedItemType } from './repository';

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
