-- Waytale — no passwords: sign-in is by emailed code only (01.5).
--
-- The Email provider that serves the codes also serves password sign-up and sign-in, and there is
-- no switch to turn only passwords off. Left open, anyone with the publishable key (it ships in
-- the app) could `signUp({ email, password })` with someone else's email; once the real owner
-- signs in with a code the account is confirmed and the attacker's password still works.
--
-- So every password hash written to `auth.users` is discarded: password sign-in always fails with
-- `invalid_credentials`, and only the emailed code opens a session. The empty string (not null)
-- is what Supabase Auth stores for a user without a password.

create schema if not exists private;
revoke all on schema private from public;

create function private.discard_password() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.encrypted_password := '';
  return new;
end;
$$;

revoke all on function private.discard_password() from public;

create trigger discard_password
before insert or update of encrypted_password on auth.users
for each row execute function private.discard_password();
