import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { listSavedItems, removeSavedItem, saveItem } from '@/features/saved/saved';
import type { SqlExecutor } from '@/lib/sync/sql';
import { PREVIEW_USER_ID } from '@/lib/sync/user-data';
import { useSessionStore } from '@/stores/session.store';
import { buildUser, uuid } from '@tests/factories';
import { createTestDatabase, hasSqlite } from '@tests/helpers/sync';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));

// The app helpers write through the sync runtime: give them an in-memory SQLite instead of
// expo-sqlite, and watch the sync requests.
const mockRuntime = { db: null as SqlExecutor | null, requestSync: jest.fn() };
jest.mock('@/lib/sync/runtime', () => ({
  getSyncExecutor: () => mockRuntime.db,
  requestSync: () => mockRuntime.requestSync(),
}));

const describeWithSqlite = hasSqlite ? describe : describe.skip;

describeWithSqlite('saved items (app helpers)', () => {
  let raw: ReturnType<typeof createTestDatabase>['raw'];

  beforeEach(() => {
    const created = createTestDatabase();
    mockRuntime.db = created.db;
    raw = created.raw;
    mockRuntime.requestSync.mockClear();
    useSessionStore.setState(useSessionStore.getInitialState(), true);
  });

  const outbox = () => raw.prepare('SELECT operation, user_id FROM outbox ORDER BY rowid').all();

  it('saves for the signed-in traveller and asks for a sync', async () => {
    const user = buildUser();
    useSessionStore.getState().setAuthenticatedUser({ id: user.id });
    const routeId = uuid();

    await saveItem('route', routeId);

    await expect(listSavedItems()).resolves.toEqual([
      expect.objectContaining({ user_id: user.id, item_type: 'route', item_id: routeId }),
    ]);
    expect(outbox()).toEqual([{ operation: 'insert', user_id: user.id }]);
    expect(mockRuntime.requestSync).toHaveBeenCalledTimes(1);
  });

  it('without a Supabase user (preview), saves under the preview user', async () => {
    await saveItem('place', uuid());

    await expect(listSavedItems()).resolves.toEqual([
      expect.objectContaining({ user_id: PREVIEW_USER_ID }),
    ]);
  });

  it('removes the item, queues the delete and asks for a sync', async () => {
    const placeId = uuid();
    await saveItem('place', placeId);

    await removeSavedItem('place', placeId);

    await expect(listSavedItems()).resolves.toEqual([]);
    expect(outbox()).toEqual([
      { operation: 'insert', user_id: PREVIEW_USER_ID },
      { operation: 'delete', user_id: PREVIEW_USER_ID },
    ]);
    expect(mockRuntime.requestSync).toHaveBeenCalledTimes(2);
  });

  it("lists only the current traveller's items", async () => {
    const alice = buildUser();
    const bob = buildUser();
    useSessionStore.getState().setAuthenticatedUser({ id: alice.id });
    await saveItem('route', uuid());
    useSessionStore.getState().setAuthenticatedUser({ id: bob.id });

    await expect(listSavedItems()).resolves.toEqual([]);
  });
});
