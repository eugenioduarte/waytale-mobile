-- Waytale — initial Postgres schema.
--
-- Mirrors the local SQLite schema (apps/mobile/src/db/schema.ts) column for column, so the sync
-- layer (01.6) maps rows 1:1: uuid ids, snake_case columns, timestamptz.
--
-- Access model:
-- - Content (routes, places, stops, stories, story_audio) is a catalog: signed-in users read it,
--   only the service role (curation, Edge Functions) writes it.
-- - User data (saved_items, journeys, journey_events, downloads) belongs to `auth.uid()`: each user
--   reads and writes only their own rows.
-- - Grants are explicit. From 2026-10-30 new public tables are no longer exposed to the Data API
--   by default, and `anon` never gets access to anything here.

-- ---------------------------------------------------------------------------------------------
-- Content catalog
-- ---------------------------------------------------------------------------------------------

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  theme text,
  city text,
  duration_minutes integer check (duration_minutes > 0),
  distance_meters double precision check (distance_meters >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  city text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  image_url text,
  created_at timestamptz not null default now()
);

create table public.stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes (id) on delete cascade,
  place_id uuid references public.places (id) on delete set null,
  name text not null,
  position integer not null check (position >= 0),
  unique (route_id, position)
);

create index stops_route_idx on public.stops (route_id);
create index stops_place_idx on public.stops (place_id);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  stop_id uuid not null references public.stops (id) on delete cascade,
  title text not null,
  body text not null,
  -- Trust in the stories: every narrative cites at least one source.
  sources jsonb not null check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) > 0),
  created_at timestamptz not null default now()
);

create index stories_stop_idx on public.stories (stop_id);

create table public.story_audio (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  voice_id text,
  language text not null,
  -- Object key in the private `audio` bucket; clients resolve it to a signed URL.
  audio_key text,
  duration_ms integer check (duration_ms > 0)
);

create index story_audio_story_idx on public.story_audio (story_id);

-- ---------------------------------------------------------------------------------------------
-- User data
-- ---------------------------------------------------------------------------------------------

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('route', 'place')),
  item_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table public.journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  route_id uuid references public.routes (id) on delete set null,
  status text not null check (status in ('active', 'completed', 'abandoned')),
  started_at timestamptz not null,
  ended_at timestamptz,
  check (ended_at is null or ended_at >= started_at)
);

create index journeys_user_idx on public.journeys (user_id);

-- Append-only history: no update/delete policies below.
create table public.journey_events (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys (id) on delete cascade,
  type text not null check (char_length(type) <= 64),
  stop_id uuid,
  occurred_at timestamptz not null,
  -- Bounded so a client can't bloat its own history without limit.
  payload jsonb check (pg_column_size(payload) <= 8192)
);

create index journey_events_journey_idx on public.journey_events (journey_id);

create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('route', 'place')),
  item_id uuid not null,
  status text not null check (status in ('pending', 'done', 'failed')),
  downloaded_at timestamptz,
  unique (user_id, item_type, item_id)
);

-- ---------------------------------------------------------------------------------------------
-- Row Level Security — enabled on every table in the exposed schema
-- ---------------------------------------------------------------------------------------------

alter table public.routes enable row level security;
alter table public.places enable row level security;
alter table public.stops enable row level security;
alter table public.stories enable row level security;
alter table public.story_audio enable row level security;
alter table public.saved_items enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_events enable row level security;
alter table public.downloads enable row level security;

-- Content: read-only for signed-in users.
create policy "Signed-in users can read routes" on public.routes
  for select to authenticated using (true);
create policy "Signed-in users can read places" on public.places
  for select to authenticated using (true);
create policy "Signed-in users can read stops" on public.stops
  for select to authenticated using (true);
create policy "Signed-in users can read stories" on public.stories
  for select to authenticated using (true);
create policy "Signed-in users can read story audio" on public.story_audio
  for select to authenticated using (true);

-- saved_items: owner only. `(select auth.uid())` is evaluated once per statement, not per row.
create policy "Users read their saved items" on public.saved_items
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users save items for themselves" on public.saved_items
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their saved items" on public.saved_items
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their saved items" on public.saved_items
  for delete to authenticated using ((select auth.uid()) = user_id);

-- journeys: owner only.
create policy "Users read their journeys" on public.journeys
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users start journeys for themselves" on public.journeys
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their journeys" on public.journeys
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their journeys" on public.journeys
  for delete to authenticated using ((select auth.uid()) = user_id);

-- journey_events: owned through the parent journey; append-only.
create policy "Users read events of their journeys" on public.journey_events
  for select to authenticated using (
    exists (
      select 1 from public.journeys j
      where j.id = journey_id and j.user_id = (select auth.uid())
    )
  );
create policy "Users log events on their journeys" on public.journey_events
  for insert to authenticated with check (
    exists (
      select 1 from public.journeys j
      where j.id = journey_id and j.user_id = (select auth.uid())
    )
  );

-- downloads: owner only.
create policy "Users read their downloads" on public.downloads
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users record their downloads" on public.downloads
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users update their downloads" on public.downloads
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Users delete their downloads" on public.downloads
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------------------------
-- Data API grants — explicit, least privilege
-- ---------------------------------------------------------------------------------------------

revoke all on
  public.routes, public.places, public.stops, public.stories, public.story_audio,
  public.saved_items, public.journeys, public.journey_events, public.downloads
from anon, authenticated;

grant select on
  public.routes, public.places, public.stops, public.stories, public.story_audio
to authenticated;

grant select, insert, update, delete on
  public.saved_items, public.journeys, public.downloads
to authenticated;

grant select, insert on public.journey_events to authenticated;

-- The service role (curation, Edge Functions) writes the catalog. `bypassrls` skips policies, not
-- privileges, and with auto-exposure off it gets no grants unless they're explicit.
grant all on
  public.routes, public.places, public.stops, public.stories, public.story_audio,
  public.saved_items, public.journeys, public.journey_events, public.downloads
to service_role;
