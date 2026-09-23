import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import type { PGlite } from '@electric-sql/pglite';

import { asAnon, asUser, createDatabase, createUser } from './helpers/database.ts';

const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';
const ROUTE = '00000000-0000-4000-8000-000000000001';

let db: PGlite;
let aliceJourney: string;

before(async () => {
  db = await createDatabase();
  await createUser(db, ALICE);
  await createUser(db, BOB);

  await db.query("insert into public.routes (id, title) values ($1, 'Baixa de Lisboa')", [ROUTE]);

  await asUser(db, ALICE, async (tx) => {
    await tx.query("insert into public.saved_items (item_type, item_id) values ('route', $1)", [
      ROUTE,
    ]);
    await tx.query(
      "insert into public.downloads (item_type, item_id, status) values ('route', $1, 'done')",
      [ROUTE],
    );
    const journey = await tx.query<{ id: string }>(
      "insert into public.journeys (route_id, status, started_at) values ($1, 'active', now()) returning id",
      [ROUTE],
    );
    aliceJourney = journey.rows[0]!.id;
    await tx.query(
      "insert into public.journey_events (journey_id, type, occurred_at) values ($1, 'stop_visited', now())",
      [aliceJourney],
    );
  });
});

after(async () => {
  await db.close();
});

describe('01.5 acceptance — user A cannot read user B data', () => {
  for (const table of ['saved_items', 'journeys', 'journey_events', 'downloads']) {
    it(`Bob sees none of Alice's ${table}`, async () => {
      const rows = await asUser(db, BOB, (tx) => tx.query(`select * from public.${table}`));
      assert.equal(rows.rows.length, 0);
    });

    it(`Alice sees her own ${table}`, async () => {
      const rows = await asUser(db, ALICE, (tx) => tx.query(`select * from public.${table}`));
      assert.equal(rows.rows.length, 1);
    });
  }
});

describe('user data — writes are owner-only', () => {
  it('Bob cannot insert a row owned by Alice', async () => {
    await assert.rejects(
      asUser(db, BOB, (tx) =>
        tx.query(
          "insert into public.saved_items (user_id, item_type, item_id) values ($1, 'place', gen_random_uuid())",
          [ALICE],
        ),
      ),
      /row-level security/,
    );
  });

  it("Bob's update and delete on Alice's rows touch nothing", async () => {
    const result = await asUser(db, BOB, async (tx) => {
      const updated = await tx.query(
        "update public.journeys set status = 'abandoned' where user_id = $1",
        [ALICE],
      );
      const deleted = await tx.query('delete from public.saved_items where user_id = $1', [ALICE]);
      return { updated: updated.affectedRows, deleted: deleted.affectedRows };
    });
    assert.deepEqual(result, { updated: 0, deleted: 0 });
  });

  it('Alice cannot hand her row over to Bob (UPDATE ... WITH CHECK)', async () => {
    await assert.rejects(
      asUser(db, ALICE, (tx) =>
        tx.query('update public.downloads set user_id = $1 where user_id = $2', [BOB, ALICE]),
      ),
      /row-level security/,
    );
  });

  it("Bob cannot log an event on Alice's journey", async () => {
    await assert.rejects(
      asUser(db, BOB, (tx) =>
        tx.query(
          "insert into public.journey_events (journey_id, type, occurred_at) values ($1, 'stop_visited', now())",
          [aliceJourney],
        ),
      ),
      /row-level security/,
    );
  });

  it('journey history is append-only, even for its owner', async () => {
    await assert.rejects(
      asUser(db, ALICE, (tx) => tx.query('delete from public.journey_events')),
      /permission denied/,
    );
  });

  it('saving the same item twice is rejected', async () => {
    await assert.rejects(
      asUser(db, ALICE, (tx) =>
        tx.query("insert into public.saved_items (item_type, item_id) values ('route', $1)", [
          ROUTE,
        ]),
      ),
      /duplicate key/,
    );
  });

  it('rejects an oversized journey event payload', async () => {
    const huge = JSON.stringify({ note: 'x'.repeat(20_000) });
    await assert.rejects(
      asUser(db, ALICE, (tx) =>
        tx.query(
          "insert into public.journey_events (journey_id, type, occurred_at, payload) values ($1, 'note', now(), $2::jsonb)",
          [aliceJourney, huge],
        ),
      ),
      /check constraint/,
    );
  });
});

describe('service role (curation, Edge Functions)', () => {
  it('can write the catalog through the migration grants alone', async () => {
    const inserted = await db.transaction(async (tx) => {
      await tx.exec('set local role service_role;');
      const result = await tx.query<{ id: string }>(
        "insert into public.places (name) values ('Miradouro') returning id",
      );
      return result.rows.length;
    });
    assert.equal(inserted, 1);
  });
});

describe('content catalog', () => {
  it('signed-in users can read it', async () => {
    const rows = await asUser(db, BOB, (tx) => tx.query('select id from public.routes'));
    assert.equal(rows.rows.length, 1);
  });

  it('signed-in users cannot write it', async () => {
    await assert.rejects(
      asUser(db, BOB, (tx) => tx.query("insert into public.routes (title) values ('Fake')")),
      /permission denied/,
    );
  });

  it('rejects a story without sources', async () => {
    const stop = await db.query<{ id: string }>(
      "insert into public.stops (route_id, name, position) values ($1, 'Comércio', 0) returning id",
      [ROUTE],
    );
    await assert.rejects(
      db.query(
        "insert into public.stories (stop_id, title, body, sources) values ($1, 't', 'b', '[]')",
        [stop.rows[0]!.id],
      ),
      /check constraint/,
    );
  });
});

describe('anonymous requests (publishable key only)', () => {
  for (const table of ['routes', 'saved_items', 'journeys', 'journey_events', 'downloads']) {
    it(`cannot read ${table}`, async () => {
      await assert.rejects(
        asAnon(db, (tx) => tx.query(`select * from public.${table}`)),
        /permission denied/,
      );
    });
  }
});

describe('every public table has RLS enabled', () => {
  it('no table in the exposed schema is left without RLS', async () => {
    const rows = await db.query<{ relname: string }>(
      "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity",
    );
    assert.deepEqual(rows.rows, []);
  });
});

describe('storage — private audio and images buckets', () => {
  before(async () => {
    await db.query(
      "insert into storage.objects (bucket_id, name) values ('audio', 'stories/comercio-pt.mp3')",
    );
  });

  it('both buckets exist and are private', async () => {
    const rows = await db.query<{ id: string; public: boolean }>(
      'select id, public from storage.buckets order by id',
    );
    assert.deepEqual(rows.rows, [
      { id: 'audio', public: false },
      { id: 'images', public: false },
    ]);
  });

  it('signed-in users can read objects (what createSignedUrl needs)', async () => {
    const rows = await asUser(db, BOB, (tx) => tx.query('select name from storage.objects'));
    assert.equal(rows.rows.length, 1);
  });

  it('anonymous requests see no objects', async () => {
    const rows = await asAnon(db, (tx) => tx.query('select name from storage.objects'));
    assert.equal(rows.rows.length, 0);
  });

  it('signed-in users cannot upload', async () => {
    await assert.rejects(
      asUser(db, BOB, (tx) =>
        tx.query("insert into storage.objects (bucket_id, name) values ('audio', 'evil.mp3')"),
      ),
      /row-level security/,
    );
  });
});
