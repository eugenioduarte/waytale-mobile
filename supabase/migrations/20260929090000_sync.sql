-- Waytale — sync support (01.6, see .agents_local/sdd/sync.md).
--
-- - `updated_at` on every synced table, always set by the server clock (a trigger overrides
--   whatever the client sends), so it can be the cursor of the incremental pull.
-- - `deleted_at` tombstones on the user tables clients can remove rows from: a pull by
--   `updated_at` never sees a hard-deleted row, so clients mark rows deleted instead.
-- - Keyset indexes for `where updated_at > $cursor order by updated_at, id`.

create schema if not exists private;

create function private.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;

-- `routes` already has `updated_at`; the other tables get it now. Existing rows take the time of
-- this migration, so the first pull after it sees them all.
alter table public.places add column updated_at timestamptz not null default now();
alter table public.stops add column updated_at timestamptz not null default now();
alter table public.stories add column updated_at timestamptz not null default now();
alter table public.story_audio add column updated_at timestamptz not null default now();
alter table public.saved_items add column updated_at timestamptz not null default now();
alter table public.journeys add column updated_at timestamptz not null default now();
alter table public.journey_events add column updated_at timestamptz not null default now();
alter table public.downloads add column updated_at timestamptz not null default now();

alter table public.saved_items add column deleted_at timestamptz;
alter table public.journeys add column deleted_at timestamptz;
alter table public.downloads add column deleted_at timestamptz;

create trigger set_updated_at before insert or update on public.routes
  for each row execute function private.set_updated_at();
create trigger set_updated_at before insert or update on public.places
  for each row execute function private.set_updated_at();
create trigger set_updated_at before insert or update on public.stops
  for each row execute function private.set_updated_at();
create trigger set_updated_at before insert or update on public.stories
  for each row execute function private.set_updated_at();
create trigger set_updated_at before insert or update on public.story_audio
  for each row execute function private.set_updated_at();
create trigger set_updated_at before insert or update on public.saved_items
  for each row execute function private.set_updated_at();
create trigger set_updated_at before insert or update on public.journeys
  for each row execute function private.set_updated_at();
create trigger set_updated_at before insert or update on public.journey_events
  for each row execute function private.set_updated_at();
create trigger set_updated_at before insert or update on public.downloads
  for each row execute function private.set_updated_at();

-- Catalog: everyone signed in pulls the same rows.
create index routes_sync_idx on public.routes (updated_at, id);
create index places_sync_idx on public.places (updated_at, id);
create index stops_sync_idx on public.stops (updated_at, id);
create index stories_sync_idx on public.stories (updated_at, id);
create index story_audio_sync_idx on public.story_audio (updated_at, id);

-- User data: RLS narrows to one user first.
create index saved_items_sync_idx on public.saved_items (user_id, updated_at, id);
create index journeys_sync_idx on public.journeys (user_id, updated_at, id);
create index downloads_sync_idx on public.downloads (user_id, updated_at, id);
-- Owned through the parent journey (see its RLS policy).
create index journey_events_sync_idx on public.journey_events (updated_at, id);
