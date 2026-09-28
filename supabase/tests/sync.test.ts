import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import type { PGlite } from '@electric-sql/pglite';

import { asUser, createDatabase, createUser } from './helpers/database.ts';

// The statements below are what the app's sync push sends through PostgREST (01.6).

const ALICE = '00000000-0000-4000-8000-00000000000a';
const ROUTE = '00000000-0000-4000-8000-000000000001';
const PLACE = '00000000-0000-4000-8000-000000000101';
const SAVED_ON_PHONE = '00000000-0000-4000-8000-0000000001a1';
const SAVED_ON_TABLET = '00000000-0000-4000-8000-0000000001b1';
const JOURNEY = '00000000-0000-4000-8000-0000000002a1';
const EVENT = '00000000-0000-4000-8000-0000000003a1';

let db: PGlite;

/** Upsert keyed on the natural key, as `upsert(rows, { onConflict: 'user_id,item_type,item_id' })`. */
const upsertSaved = `
  insert into public.saved_items (id, user_id, item_type, item_id, created_at, deleted_at)
  values ($1, $2, 'place', $3, $4, null)
  on conflict (user_id, item_type, item_id)
  do update set id = excluded.id, created_at = excluded.created_at, deleted_at = excluded.deleted_at`;

before(async () => {
  db = await createDatabase();
  await createUser(db, ALICE);
  await db.query("insert into public.routes (id, title) values ($1, 'Baixa de Lisboa')", [ROUTE]);
});

after(async () => {
  await db.close();
});

describe('sync — updated_at is the server clock', () => {
  it('ignores an updated_at sent by the client', async () => {
    const { rows } = await db.query<{ stale: boolean }>(
      `insert into public.places (id, name, updated_at) values ($1, 'Chiado', '2000-01-01')
       returning updated_at > '2020-01-01' as stale`,
      [PLACE],
    );
    assert.equal(rows[0]!.stale, true);
  });

  it('moves forward on every update', async () => {
    const before = await db.query<{ updated_at: Date }>(
      'select updated_at from public.places where id = $1',
      [PLACE],
    );
    // `now()` is the transaction start: a new statement outside a transaction is a new time.
    await new Promise((resolve) => setTimeout(resolve, 5));
    const after = await db.query<{ updated_at: Date }>(
      "update public.places set name = 'Chiado (Largo)' where id = $1 returning updated_at",
      [PLACE],
    );
    assert.ok(after.rows[0]!.updated_at > before.rows[0]!.updated_at);
  });
});

describe('sync — saved_items push', () => {
  it('the same place saved on two devices is one row (natural-key upsert)', async () => {
    await asUser(db, ALICE, (tx) =>
      tx.query(upsertSaved, [SAVED_ON_PHONE, ALICE, PLACE, '2026-09-29T10:00:00Z']),
    );
    await asUser(db, ALICE, (tx) =>
      tx.query(upsertSaved, [SAVED_ON_TABLET, ALICE, PLACE, '2026-09-29T10:05:00Z']),
    );

    const { rows } = await db.query<{ id: string }>(
      'select id from public.saved_items where user_id = $1',
      [ALICE],
    );
    assert.deepEqual(
      rows.map((row) => row.id),
      [SAVED_ON_TABLET],
    );
  });

  it('replaying the same push changes nothing', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await asUser(db, ALICE, (tx) =>
        tx.query(upsertSaved, [SAVED_ON_TABLET, ALICE, PLACE, '2026-09-29T10:05:00Z']),
      );
    }
    const { rows } = await db.query('select 1 from public.saved_items where user_id = $1', [ALICE]);
    assert.equal(rows.length, 1);
  });

  it('removing is a tombstone the owner can write, and saving again revives it', async () => {
    await asUser(db, ALICE, (tx) =>
      tx.query('update public.saved_items set deleted_at = now() where id = $1', [SAVED_ON_TABLET]),
    );
    let row = await db.query<{ deleted_at: Date | null }>(
      'select deleted_at from public.saved_items where id = $1',
      [SAVED_ON_TABLET],
    );
    assert.notEqual(row.rows[0]!.deleted_at, null);

    await asUser(db, ALICE, (tx) =>
      tx.query(upsertSaved, [SAVED_ON_PHONE, ALICE, PLACE, '2026-09-29T11:00:00Z']),
    );
    row = await db.query('select deleted_at from public.saved_items where id = $1', [
      SAVED_ON_PHONE,
    ]);
    assert.equal(row.rows[0]!.deleted_at, null);
  });
});

describe('sync — journeys', () => {
  it('a field patch leaves the other fields alone', async () => {
    await asUser(db, ALICE, (tx) =>
      tx.query(
        `insert into public.journeys (id, user_id, route_id, status, started_at)
         values ($1, $2, $3, 'active', '2026-09-29T09:00:00Z')`,
        [JOURNEY, ALICE, ROUTE],
      ),
    );
    await asUser(db, ALICE, (tx) =>
      tx.query("update public.journeys set status = 'completed' where id = $1", [JOURNEY]),
    );
    await asUser(db, ALICE, (tx) =>
      tx.query("update public.journeys set ended_at = '2026-09-29T10:00:00Z' where id = $1", [
        JOURNEY,
      ]),
    );

    const { rows } = await db.query<{ status: string; ended_at: Date }>(
      'select status, ended_at from public.journeys where id = $1',
      [JOURNEY],
    );
    assert.equal(rows[0]!.status, 'completed');
    assert.equal(rows[0]!.ended_at.toISOString(), '2026-09-29T10:00:00.000Z');
  });

  it('journey events are append-only and idempotent (`on conflict do nothing`)', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await asUser(db, ALICE, (tx) =>
        tx.query(
          `insert into public.journey_events (id, journey_id, type, occurred_at)
           values ($1, $2, 'stop_visited', '2026-09-29T09:30:00Z')
           on conflict (id) do nothing`,
          [EVENT, JOURNEY],
        ),
      );
    }
    const { rows } = await db.query('select 1 from public.journey_events where journey_id = $1', [
      JOURNEY,
    ]);
    assert.equal(rows.length, 1);
  });
});

describe('sync — pull', () => {
  it('reads a user’s rows changed after a cursor, oldest first', async () => {
    const { rows } = await asUser(db, ALICE, (tx) =>
      tx.query<{ id: string }>(
        `select id from public.saved_items
         where updated_at > '2000-01-01' order by updated_at, id limit 500`,
      ),
    );
    assert.equal(rows.length, 1);
  });
});
