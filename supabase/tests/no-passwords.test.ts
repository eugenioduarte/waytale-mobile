import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import type { PGlite } from '@electric-sql/pglite';

import { createDatabase } from './helpers/database.ts';

const USER = '00000000-0000-4000-8000-0000000000c1';
const BCRYPT_HASH = '$2a$10$abcdefghijklmnopqrstuuJ4b1k7n1o2p3q4r5s6t7u8v9w0x1y2z3';

let db: PGlite;

async function storedPassword(id: string): Promise<string | null> {
  const { rows } = await db.query<{ encrypted_password: string | null }>(
    'select encrypted_password from auth.users where id = $1',
    [id],
  );
  return rows[0]!.encrypted_password;
}

before(async () => {
  db = await createDatabase();
});

after(async () => {
  await db.close();
});

describe('no passwords — sign-in is by emailed code only', () => {
  it('discards the password of a sign-up (`signUp({ email, password })`)', async () => {
    await db.query('insert into auth.users (id, encrypted_password) values ($1, $2)', [
      USER,
      BCRYPT_HASH,
    ]);
    assert.equal(await storedPassword(USER), '');
  });

  it('discards a password set later (`updateUser({ password })`, admin API)', async () => {
    await db.query('update auth.users set encrypted_password = $2 where id = $1', [
      USER,
      BCRYPT_HASH,
    ]);
    assert.equal(await storedPassword(USER), '');
  });

  it('stores a code-only user the way Supabase Auth does (empty, not null)', async () => {
    const id = '00000000-0000-4000-8000-0000000000c2';
    await db.query('insert into auth.users (id) values ($1)', [id]);
    assert.equal(await storedPassword(id), '');
  });

  it('keeps the trigger function out of reach of the API roles', async () => {
    const { rows } = await db.query<{ role: string; allowed: boolean }>(
      `select role, has_function_privilege(role, 'private.discard_password()', 'execute') as allowed
         from unnest(array['anon', 'authenticated']) as role`,
    );
    assert.deepEqual(
      rows.map((row) => row.allowed),
      [false, false],
    );
  });
});
