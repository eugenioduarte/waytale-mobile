import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import type { PGlite } from '@electric-sql/pglite';

import { asAnon, asUser, createDatabase, createUser } from './helpers/database.ts';

const ALICE = '00000000-0000-4000-8000-00000000000a';
const BOB = '00000000-0000-4000-8000-00000000000b';

let db: PGlite;

const register = (token: string, platform = 'android') =>
  `select public.register_push_token('${token}', '${platform}')`;

async function ownerOf(token: string): Promise<string | undefined> {
  const { rows } = await db.query<{ user_id: string }>(
    'select user_id from public.push_tokens where token = $1',
    [token],
  );
  return rows[0]?.user_id;
}

before(async () => {
  db = await createDatabase();
  await createUser(db, ALICE);
  await createUser(db, BOB);
});

after(async () => {
  await db.close();
});

describe('push tokens (01.12)', () => {
  it('registers the device token for the signed-in user', async () => {
    await asUser(db, ALICE, (tx) => tx.query(register('token-phone-1')));

    assert.equal(await ownerOf('token-phone-1'), ALICE);
  });

  it('registering again only refreshes it', async () => {
    await asUser(db, ALICE, (tx) => tx.query(register('token-phone-1')));

    const { rows } = await db.query('select * from public.push_tokens where token = $1', [
      'token-phone-1',
    ]);
    assert.equal(rows.length, 1);
  });

  it("each user sees only their own devices' tokens", async () => {
    const bobs = await asUser(db, BOB, (tx) => tx.query('select * from public.push_tokens'));
    const alices = await asUser(db, ALICE, (tx) => tx.query('select * from public.push_tokens'));

    assert.equal(bobs.rows.length, 0);
    assert.equal(alices.rows.length, 1);
  });

  it('cannot write tokens directly, only through register_push_token', async () => {
    await assert.rejects(
      asUser(db, BOB, (tx) =>
        tx.query(
          "insert into public.push_tokens (token, platform) values ('token-forged', 'android')",
        ),
      ),
      /permission denied/,
    );
  });

  it('someone else signing in on the same phone takes the token over', async () => {
    await asUser(db, BOB, (tx) => tx.query(register('token-phone-1', 'ios')));

    assert.equal(await ownerOf('token-phone-1'), BOB);
  });

  it("a user can remove their own token but not someone else's", async () => {
    await asUser(db, ALICE, (tx) => tx.query(register('token-phone-2')));

    await asUser(db, BOB, (tx) =>
      tx.query("delete from public.push_tokens where token = 'token-phone-2'"),
    );
    assert.equal(await ownerOf('token-phone-2'), ALICE);

    await asUser(db, ALICE, (tx) =>
      tx.query("delete from public.push_tokens where token = 'token-phone-2'"),
    );
    assert.equal(await ownerOf('token-phone-2'), undefined);
  });

  it('signed out, cannot register', async () => {
    await assert.rejects(
      asAnon(db, (tx) => tx.query(register('token-anon'))),
      /permission denied/,
    );
  });
});
