import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite, type Transaction } from '@electric-sql/pglite';

const migrationsDir = join(import.meta.dirname, '..', '..', 'migrations');

/**
 * The slice of Supabase's platform schema the migrations depend on: the API roles, `auth.users`,
 * `auth.uid()` (same claim lookup as Supabase's) and `storage.buckets`/`storage.objects` with RLS
 * on. The real ones are managed by the platform, so migrations must not create them.
 */
const platformStub = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
    )::uuid
  $$;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null,
    owner uuid
  );
  alter table storage.objects enable row level security;

  grant usage on schema public, auth, storage to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  grant select, insert, update, delete on storage.objects to anon, authenticated;
`;

/** A fresh in-memory Postgres with the platform stub and every migration applied, in order. */
export async function createDatabase(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(platformStub);
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();
  for (const file of files) {
    await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
  return db;
}

export async function createUser(db: PGlite, id: string): Promise<string> {
  await db.query('insert into auth.users (id) values ($1)', [id]);
  return id;
}

/** Runs `fn` as the `authenticated` role with `sub = userId`, like a request with that JWT. */
export async function asUser<T>(
  db: PGlite,
  userId: string,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated;');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
    return fn(tx);
  });
}

/** Runs `fn` as the `anon` role (a request with only the publishable key). */
export async function asAnon<T>(db: PGlite, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.exec('set local role anon;');
    return fn(tx);
  });
}
