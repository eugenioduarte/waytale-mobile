import { StyleSheet, Text } from 'react-native';

import { Palette } from '@/constants/palette';
import { useTranslation } from '@/lib/i18n';
import { type SyncStatus, useSyncStatus, useSyncStore } from '@/stores/sync.store';

/** i18n key per state; a new `SyncStatus` without copy fails typecheck here. */
const MESSAGE_KEYS = {
  offline: 'sync.offline',
  syncing: 'sync.syncing',
  pending: 'sync.pending',
  error: 'sync.error',
  synced: 'sync.synced',
} as const satisfies Record<SyncStatus, string>;

/**
 * One line with the sync state, for the Profile screen. Provisional look until the design
 * system (EPIC-02); the wording is what matters.
 */
export function SyncStatusLine() {
  const { t } = useTranslation();
  const status = useSyncStatus();
  return (
    <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={styles.line}>
      {t(MESSAGE_KEYS[status])}
    </Text>
  );
}

/**
 * Tab badge for the global indicator: only when something needs attention (writes waiting or
 * refused), never for "all synced" or a plain offline state — no noise.
 */
export function useSyncBadge(): string | number | undefined {
  const status = useSyncStatus();
  const pendingCount = useSyncStore((state) => state.pendingCount);
  if (status === 'error') return '!';
  if (pendingCount > 0) return pendingCount;
  return undefined;
}

const styles = StyleSheet.create({
  line: { fontSize: 14, lineHeight: 22, color: Palette.secondary },
});
