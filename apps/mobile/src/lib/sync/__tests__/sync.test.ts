import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { createSavedRepository } from '@/features/saved/repository';
import { createSyncEngine, type SyncEngine, type SyncStatusSink } from '@/lib/sync/engine';
import { countFailed, countPending, enqueue } from '@/lib/sync/outbox';
import { PULL_OVERLAP_MS, pullAll, readCursor } from '@/lib/sync/pull';
import { pushOutbox } from '@/lib/sync/push';
import type { SqlExecutor } from '@/lib/sync/sql';
import { clearOtherUsersData } from '@/lib/sync/user-data';

import { createTestDatabase, FakeRemote, hasSqlite } from '../../../../tests/helpers/sync';

jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));

const describeWithSqlite = hasSqlite ? describe : describe.skip;

const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';
const PLACES = [
  '00000000-0000-4000-8000-000000000101',
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000103',
];
const ROUTE = '00000000-0000-4000-8000-000000000001';

function silentStatus(): SyncStatusSink {
  return {
    setSyncing: () => {},
    setPendingCount: () => {},
    setFailedCount: () => {},
    setLastSyncedAt: () => {},
    setLastError: () => {},
  };
}

/** One device: its own SQLite, sharing the server with any other device in the test. */
function device(remote: FakeRemote, userId = ALICE) {
  const { db, raw } = createTestDatabase();
  let online = true;
  const engine: SyncEngine = createSyncEngine({
    db,
    remote,
    getUserId: () => userId,
    isOnline: () => online,
    status: silentStatus(),
    setTimer: () => null, // retries are exercised in engine.test.ts
    clearTimer: () => {},
  });
  return {
    db,
    raw,
    engine,
    saved: createSavedRepository(db),
    setOnline: (value: boolean) => {
      online = value;
    },
  };
}

let remote: FakeRemote;

beforeEach(() => {
  remote = new FakeRemote();
});

describeWithSqlite('01.6 acceptance — offline saves reach the server once', () => {
  it('3 places saved offline → 3 rows on the server, still 3 after a forced resend', async () => {
    const phone = device(remote);
    phone.setOnline(false);
    for (const place of PLACES) await phone.saved.save(ALICE, 'place', place);

    await phone.engine.syncNow();
    expect(remote.rows('saved_items')).toHaveLength(0);
    expect(await countPending(phone.db, ALICE)).toBe(3);

    phone.setOnline(true);
    await phone.engine.syncNow();
    expect(remote.live('saved_items')).toHaveLength(3);
    expect(await countPending(phone.db, ALICE)).toBe(0);

    // Forced resend: every entry back to "not synced", as after a crash before marking them.
    phone.raw.exec('UPDATE outbox SET synced_at = NULL');
    await phone.engine.syncNow();
    expect(remote.rows('saved_items')).toHaveLength(3);
    expect(new Set(remote.rows('saved_items').map((row) => row.item_id))).toEqual(new Set(PLACES));
    expect(await phone.saved.list(ALICE)).toHaveLength(3);
  });

  it('saving the same place twice offline is still one row', async () => {
    const phone = device(remote);
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    await phone.engine.syncNow();
    expect(remote.rows('saved_items')).toHaveLength(1);
  });
});

describeWithSqlite('two devices of the same user', () => {
  it('the same place saved on both ends up as one row, with one id everywhere', async () => {
    const phone = device(remote);
    const tablet = device(remote);
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    await tablet.saved.save(ALICE, 'place', PLACES[0]!);

    await phone.engine.syncNow();
    await tablet.engine.syncNow();
    await phone.engine.syncNow();

    expect(remote.rows('saved_items')).toHaveLength(1);
    const serverId = remote.rows('saved_items')[0]!.id;
    expect((await phone.saved.list(ALICE)).map((row) => row.id)).toEqual([serverId]);
    expect((await tablet.saved.list(ALICE)).map((row) => row.id)).toEqual([serverId]);
  });

  it('a removal on one device removes it on the other (tombstone)', async () => {
    const phone = device(remote);
    const tablet = device(remote);
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    await phone.engine.syncNow();
    await tablet.engine.syncNow();
    expect(await tablet.saved.list(ALICE)).toHaveLength(1);

    await phone.saved.remove(ALICE, 'place', PLACES[0]!);
    await phone.engine.syncNow();
    await tablet.engine.syncNow();

    expect(remote.live('saved_items')).toHaveLength(0);
    expect(await tablet.saved.list(ALICE)).toHaveLength(0);
  });

  it('saving again after a removal revives the item', async () => {
    const phone = device(remote);
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    await phone.engine.syncNow();
    await phone.saved.remove(ALICE, 'place', PLACES[0]!);
    await phone.engine.syncNow();
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    await phone.engine.syncNow();

    expect(remote.live('saved_items')).toHaveLength(1);
    expect(remote.rows('saved_items')).toHaveLength(1);
  });
});

describeWithSqlite('push', () => {
  async function startJourney(db: SqlExecutor, id: string) {
    const row = {
      id,
      user_id: ALICE,
      route_id: null,
      status: 'active',
      started_at: '2026-09-29T09:00:00.000Z',
      ended_at: null,
    };
    await db.run(
      'INSERT INTO journeys (id, user_id, route_id, status, started_at, ended_at) VALUES (?, ?, ?, ?, ?, ?)',
      Object.values(row),
    );
    await enqueue(db, {
      userId: ALICE,
      operation: 'insert',
      table: 'journeys',
      entityId: id,
      payload: row,
    });
  }

  it('sends only the changed fields, so edits of different fields on two devices merge', async () => {
    const { db } = createTestDatabase();
    const journey = '00000000-0000-4000-8000-0000000002a1';
    await startJourney(db, journey);
    await pushOutbox(db, remote, ALICE);

    await enqueue(db, {
      userId: ALICE,
      operation: 'update',
      table: 'journeys',
      entityId: journey,
      payload: { status: 'completed' },
    });
    // Another device set ended_at meanwhile.
    await remote.update('journeys', { id: journey }, { ended_at: '2026-09-29T10:00:00.000Z' });
    await pushOutbox(db, remote, ALICE);

    expect(remote.rows('journeys')[0]).toMatchObject({
      status: 'completed',
      ended_at: '2026-09-29T10:00:00.000Z',
    });
  });

  it('turns local JSON text into jsonb and replays events without duplicates', async () => {
    const { db } = createTestDatabase();
    const journey = '00000000-0000-4000-8000-0000000002a1';
    await startJourney(db, journey);
    const event = {
      id: '00000000-0000-4000-8000-0000000003a1',
      journey_id: journey,
      type: 'stop_visited',
      stop_id: null,
      occurred_at: '2026-09-29T09:30:00.000Z',
      payload: JSON.stringify({ position: 1 }),
    };
    await enqueue(db, {
      userId: ALICE,
      operation: 'insert',
      table: 'journey_events',
      entityId: event.id,
      payload: event,
    });

    await pushOutbox(db, remote, ALICE);
    await db.run('UPDATE outbox SET synced_at = NULL');
    await pushOutbox(db, remote, ALICE);

    expect(remote.rows('journey_events')).toHaveLength(1);
    expect(remote.rows('journey_events')[0]!.payload).toEqual({ position: 1 });
  });

  it('stops at a transient error and keeps the order for the next attempt', async () => {
    const phone = device(remote);
    for (const place of PLACES) await phone.saved.save(ALICE, 'place', place);
    remote.offline = true;

    const result = await pushOutbox(phone.db, remote, ALICE);
    expect(result.retryError?.retryable).toBe(true);
    expect(result.pushed).toBe(0);
    expect(remote.calls).toBe(1); // didn't hammer the server with the other two
    expect(await countPending(phone.db, ALICE)).toBe(3);
  });

  it('parks a permanently rejected entry and carries on with the rest', async () => {
    const phone = device(remote);
    for (const place of PLACES) await phone.saved.save(ALICE, 'place', place);
    remote.rejectNextWrite();

    const result = await pushOutbox(phone.db, remote, ALICE);
    expect(result).toMatchObject({ pushed: 2, failed: 1, retryError: null });
    expect(await countFailed(phone.db, ALICE)).toBe(1);
    expect(await countPending(phone.db, ALICE)).toBe(0);
  });

  it("never pushes another user's entries", async () => {
    const phone = device(remote);
    await phone.saved.save(BOB, 'place', PLACES[0]!);
    await pushOutbox(phone.db, remote, ALICE);
    expect(remote.rows('saved_items')).toHaveLength(0);
  });
});

describeWithSqlite('pull', () => {
  it('brings the catalog parents-first, with jsonb as local JSON text', async () => {
    remote.seed('routes', {
      id: ROUTE,
      title: 'Baixa de Lisboa',
      created_at: '2026-09-01T00:00:00.000Z',
    });
    const stop = '00000000-0000-4000-8000-000000000201';
    remote.seed('stops', {
      id: stop,
      route_id: ROUTE,
      place_id: null,
      name: 'Comércio',
      position: 0,
    });
    remote.seed('stories', {
      id: '00000000-0000-4000-8000-000000000301',
      stop_id: stop,
      title: 'O terramoto',
      body: '…',
      sources: [{ title: 'Arquivo Municipal' }],
      created_at: '2026-09-01T00:00:00.000Z',
    });
    const { db, raw } = createTestDatabase();

    await pullAll(db, remote);

    expect(raw.prepare('SELECT title FROM routes').all()).toEqual([{ title: 'Baixa de Lisboa' }]);
    const [story] = raw.prepare('SELECT sources FROM stories').all() as { sources: string }[];
    expect(JSON.parse(story!.sources)).toEqual([{ title: 'Arquivo Municipal' }]);
  });

  it('is incremental: the next pull re-reads only the overlap window', async () => {
    const { db } = createTestDatabase();
    remote.seed('routes', { id: ROUTE, title: 'Baixa', created_at: '2026-09-01T00:00:00.000Z' });
    await pullAll(db, remote);
    const cursor = await readCursor(db, 'routes');
    expect(cursor).toBe(remote.rows('routes')[0]!.updated_at);

    const pulls = jest.spyOn(remote, 'pull');
    await pullAll(db, remote);
    const routesCall = pulls.mock.calls.find(([table]) => table === 'routes')!;
    expect(Date.parse(routesCall[1]!.updatedAt)).toBe(Date.parse(cursor!) - PULL_OVERLAP_MS);
  });

  it('pages through more rows than one request returns', async () => {
    const { db, raw } = createTestDatabase();
    for (let index = 0; index < 1_203; index += 1) {
      remote.seed('places', {
        id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
        name: `Local ${index}`,
        created_at: '2026-09-01T00:00:00.000Z',
      });
    }
    await pullAll(db, remote);
    expect((raw.prepare('SELECT COUNT(*) AS n FROM places').get() as { n: number }).n).toBe(1_203);
  });

  it('does not overwrite a local row with writes still to push', async () => {
    const phone = device(remote);
    phone.setOnline(false);
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    const [local] = await phone.saved.list(ALICE);
    remote.seed('saved_items', {
      id: local!.id,
      user_id: ALICE,
      item_type: 'place',
      item_id: PLACES[0],
      created_at: '2000-01-01T00:00:00.000Z',
      deleted_at: '2026-09-29T00:00:00.000Z',
    });

    await pullAll(phone.db, remote);
    expect(await phone.saved.list(ALICE)).toHaveLength(1);
  });

  it("lets the server's version win over a write the server refused", async () => {
    const phone = device(remote);
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    const [local] = await phone.saved.list(ALICE);
    remote.rejectNextWrite();
    await pushOutbox(phone.db, remote, ALICE);
    expect(await countFailed(phone.db, ALICE)).toBe(1);

    remote.seed('saved_items', {
      id: local!.id,
      user_id: ALICE,
      item_type: 'place',
      item_id: PLACES[0],
      created_at: '2000-01-01T00:00:00.000Z',
      deleted_at: '2026-09-29T00:00:00.000Z',
    });
    await pullAll(phone.db, remote);
    expect(await phone.saved.list(ALICE)).toHaveLength(0);
  });

  it('skips a child whose parent is not on the device', async () => {
    const { db, raw } = createTestDatabase();
    remote.seed('journey_events', {
      id: '00000000-0000-4000-8000-0000000003a1',
      journey_id: '00000000-0000-4000-8000-0000000002ff',
      type: 'stop_visited',
      occurred_at: '2026-09-29T09:30:00.000Z',
    });
    await expect(pullAll(db, remote)).resolves.toBe(0);
    expect(raw.prepare('SELECT * FROM journey_events').all()).toEqual([]);
  });
});

describeWithSqlite('user switch and sign-out', () => {
  it("removes the previous user's rows, outbox and cursors, and keeps the catalog", async () => {
    const phone = device(remote);
    remote.seed('routes', { id: ROUTE, title: 'Baixa', created_at: '2026-09-01T00:00:00.000Z' });
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    await phone.engine.syncNow();
    await phone.saved.save(ALICE, 'place', PLACES[1]!); // not synced yet

    expect(await clearOtherUsersData(phone.db, BOB)).toBe(true);

    expect(await phone.saved.list(ALICE)).toHaveLength(0);
    expect(phone.raw.prepare('SELECT * FROM outbox').all()).toEqual([]);
    expect(await readCursor(phone.db, 'saved_items')).toBeNull();
    expect(await readCursor(phone.db, 'routes')).not.toBeNull();
    expect(phone.raw.prepare('SELECT id FROM routes').all()).toHaveLength(1);
  });

  it('is a no-op when only the current user has data', async () => {
    const phone = device(remote);
    await phone.saved.save(ALICE, 'place', PLACES[0]!);
    expect(await clearOtherUsersData(phone.db, ALICE)).toBe(false);
    expect(await phone.saved.list(ALICE)).toHaveLength(1);
  });
});
