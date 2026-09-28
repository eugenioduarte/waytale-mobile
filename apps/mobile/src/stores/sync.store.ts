import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/**
 * Sync store — connectivity and sync progress (runtime-only view), fed by the sync engine
 * (`lib/sync/`, 01.6). The durable queue is the SQLite outbox; this store only mirrors the live
 * state, so it is intentionally NOT persisted.
 */

type SyncState = {
  isOnline: boolean;
  isSyncing: boolean;
  /** Local writes not yet on the server. */
  pendingCount: number;
  /** Local writes the server refused for good (not retried). */
  failedCount: number;
  lastSyncedAt: string | null; // ISO-8601
  /** Why the last cycle failed (it is being retried with backoff), or null. */
  lastError: string | null;
};

type SyncActions = {
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (pendingCount: number) => void;
  setFailedCount: (failedCount: number) => void;
  setLastSyncedAt: (lastSyncedAt: string) => void;
  setLastError: (lastError: string | null) => void;
};

type SyncStore = SyncState & SyncActions;

export const useSyncStore = create<SyncStore>()((set) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  lastSyncedAt: null,
  lastError: null,
  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setFailedCount: (failedCount) => set({ failedCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setLastError: (lastError) => set({ lastError }),
}));

/** One word for the global indicator, most urgent first. */
export type SyncStatus = 'offline' | 'syncing' | 'error' | 'pending' | 'synced';

export function deriveSyncStatus(state: SyncState): SyncStatus {
  if (!state.isOnline) return 'offline';
  if (state.isSyncing) return 'syncing';
  if (state.failedCount > 0 || (state.lastError && state.pendingCount > 0)) return 'error';
  if (state.pendingCount > 0) return 'pending';
  return 'synced';
}

export function useSyncStatus(): SyncStatus {
  return useSyncStore(deriveSyncStatus);
}

export function useIsOnline() {
  return useSyncStore((state) => state.isOnline);
}

export function useIsSyncing() {
  return useSyncStore((state) => state.isSyncing);
}

export function usePendingCount() {
  return useSyncStore((state) => state.pendingCount);
}

export function useSyncActions() {
  return useSyncStore(
    useShallow((state) => ({
      setOnline: state.setOnline,
      setSyncing: state.setSyncing,
      setPendingCount: state.setPendingCount,
      setFailedCount: state.setFailedCount,
      setLastSyncedAt: state.setLastSyncedAt,
      setLastError: state.setLastError,
    })),
  );
}
