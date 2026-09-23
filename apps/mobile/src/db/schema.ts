import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * Local SQLite schema — the single source of truth for every UI read (offline-first).
 *
 * Conventions:
 * - `id` is a UUID as `text` (mirrors Postgres `uuid`, so 01.6 can map rows 1:1).
 * - Timestamps are ISO-8601 strings (also mirrors Postgres `timestamptz` in JSON form).
 * - The user-scoped tables (`saved_items`, `journeys`, `journey_events`, `downloads`, `outbox`)
 *   align with the Postgres schema of 01.5: snake_case columns and `user_id` = `auth.uid()`.
 */

export const routes = sqliteTable('routes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  theme: text('theme'), // collection/theme (história, arte, gastronomia, ...)
  city: text('city'),
  durationMinutes: integer('duration_minutes'),
  distanceMeters: real('distance_meters'),
  createdAt: text('created_at').notNull(), // ISO-8601
  updatedAt: text('updated_at').notNull(),
});

export const places = sqliteTable('places', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  city: text('city'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  imageUrl: text('image_url'),
  createdAt: text('created_at').notNull(),
});

export const stops = sqliteTable(
  'stops',
  {
    id: text('id').primaryKey(),
    routeId: text('route_id')
      .notNull()
      .references(() => routes.id, { onDelete: 'cascade' }),
    placeId: text('place_id').references(() => places.id),
    name: text('name').notNull(),
    position: integer('position').notNull(), // order along the route (0-based)
  },
  (table) => [index('stops_route_idx').on(table.routeId)],
);

export const stories = sqliteTable(
  'stories',
  {
    id: text('id').primaryKey(),
    stopId: text('stop_id')
      .notNull()
      .references(() => stops.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    body: text('body').notNull(),
    sources: text('sources'), // cited sources (JSON string) — provenance is mandatory
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('stories_stop_idx').on(table.stopId)],
);

export const storyAudio = sqliteTable(
  'story_audio',
  {
    id: text('id').primaryKey(),
    storyId: text('story_id')
      .notNull()
      .references(() => stories.id, { onDelete: 'cascade' }),
    voiceId: text('voice_id'),
    language: text('language').notNull(),
    audioKey: text('audio_key'), // Storage object key (signed URL resolved in 01.5)
    durationMs: integer('duration_ms'),
  },
  (table) => [index('story_audio_story_idx').on(table.storyId)],
);

export const savedItems = sqliteTable(
  'saved_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(), // auth.uid() — mirrors Postgres
    itemType: text('item_type').notNull(), // 'route' | 'place'
    itemId: text('item_id').notNull(),
    createdAt: text('created_at').notNull(),
  },
  // One save per item per user — saving twice (or replaying a sync) must not duplicate.
  (table) => [
    uniqueIndex('saved_items_user_item_uq').on(table.userId, table.itemType, table.itemId),
  ],
);

export const journeys = sqliteTable(
  'journeys',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    routeId: text('route_id'),
    status: text('status').notNull(), // 'active' | 'completed' | 'abandoned'
    startedAt: text('started_at').notNull(),
    endedAt: text('ended_at'),
  },
  (table) => [index('journeys_user_idx').on(table.userId)],
);

export const journeyEvents = sqliteTable(
  'journey_events',
  {
    id: text('id').primaryKey(),
    journeyId: text('journey_id')
      .notNull()
      .references(() => journeys.id, { onDelete: 'cascade' }),
    type: text('type').notNull(), // 'stop_visited' | 'story_played' | ...
    stopId: text('stop_id'),
    occurredAt: text('occurred_at').notNull(),
    payload: text('payload'), // JSON string
  },
  (table) => [index('journey_events_journey_idx').on(table.journeyId)],
);

export const downloads = sqliteTable(
  'downloads',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    itemType: text('item_type').notNull(), // 'route' | 'place'
    itemId: text('item_id').notNull(),
    status: text('status').notNull(), // 'pending' | 'done' | 'failed'
    downloadedAt: text('downloaded_at'),
  },
  (table) => [uniqueIndex('downloads_user_item_uq').on(table.userId, table.itemType, table.itemId)],
);

export const outbox = sqliteTable(
  'outbox',
  {
    id: text('id').primaryKey(),
    operation: text('operation').notNull(), // 'insert' | 'update' | 'delete'
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id').notNull(),
    payload: text('payload').notNull(), // JSON string
    createdAt: text('created_at').notNull(),
    syncedAt: text('synced_at'), // null until pushed (01.6)
  },
  (table) => [index('outbox_synced_idx').on(table.syncedAt)],
);

export const meta = sqliteTable('meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
