import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/**
 * Sync store — connectivity and sync progress (runtime-only view).
 * The durable outbox/queue lives in SQLite (01.4/01.6); this store only mirrors the live state,
 * so it is intentionally NOT persisted.
 */

type SyncState = {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null; // ISO-8601
};

type SyncActions = {
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setPendingCount: (pendingCount: number) => void;
  setLastSyncedAt: (lastSyncedAt: string) => void;
};

type SyncStore = SyncState & SyncActions;

export const useSyncStore = create<SyncStore>()((set) => ({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));

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
      setLastSyncedAt: state.setLastSyncedAt,
    })),
  );
}
