import { StyleSheet, Text } from 'react-native';

import { Palette } from '@/constants/palette';
import copy from '@/locales/pt.json';
import { type SyncStatus, useSyncStatus, useSyncStore } from '@/stores/sync.store';

const MESSAGES: Record<SyncStatus, string> = copy.sync;

/**
 * One line with the sync state, for the Profile screen. Provisional look until the design
 * system (EPIC-02); the wording is what matters.
 */
export function SyncStatusLine() {
  const status = useSyncStatus();
  return (
    <Text accessibilityRole="text" accessibilityLiveRegion="polite" style={styles.line}>
      {MESSAGES[status]}
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
