-- Waytale — push tokens (01.12): the FCM token of each device a user is signed in on, so the
-- backend (Edge Functions, service role) can reach them — safety alerts, a route suggested for
-- the moment.
--
-- A token identifies a device, not a person: when someone else signs in on the same phone, the
-- token changes owner. A plain upsert can't do that under RLS (the row belongs to the previous
-- user), so registering goes through `register_push_token`, which always gives the token to the
-- caller. Reading and removing stay owner-only.

create table public.push_tokens (
  token text primary key check (char_length(token) between 1 and 4096),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  platform text not null check (platform in ('android', 'ios')),
  updated_at timestamptz not null default now()
);

create index push_tokens_user_idx on public.push_tokens (user_id);

alter table public.push_tokens enable row level security;

create policy "Users read their push tokens" on public.push_tokens
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users remove their push tokens" on public.push_tokens
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.push_tokens from anon, authenticated;
grant select, delete on public.push_tokens to authenticated;
-- The service role sends the pushes.
grant all on public.push_tokens to service_role;

-- Registers (or refreshes) this device's token for the signed-in user, taking it over from
-- whoever had it before on this device.
create function public.register_push_token(push_token text, device_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  insert into public.push_tokens (token, user_id, platform, updated_at)
  values (push_token, (select auth.uid()), device_platform, now())
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end;
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
