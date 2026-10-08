/**
 * The tables the sync layer moves between SQLite and Supabase, in pull order (parents before
 * children, so local foreign keys hold). Column names are the shared snake_case ones: the local
 * schema mirrors Postgres (01.4/01.5), and Postgres-only columns (`updated_at` where SQLite has
 * none, `deleted_at`) are left out of `columns`.
 */
export type SyncTable = {
  name: string;
  /** Local columns, all of which also exist on the server. */
  columns: readonly string[];
  /** Text holding JSON locally, `jsonb` on the server. */
  jsonColumns?: readonly string[];
  /** Rows belong to a user: pushed from this device, cleared on sign-out / user switch. */
  userData: boolean;
  /** Insert conflict target on the server; defaults to `id`. */
  conflictKey?: readonly string[];
  /** Removal is a `deleted_at` tombstone on the server (never a hard delete). */
  tombstone?: boolean;
  /** Insert-only (no updates, no removals); replayed inserts are ignored. */
  appendOnly?: boolean;
};

export const SYNC_TABLES: readonly SyncTable[] = [
  {
    name: 'routes',
    columns: [
      'id',
      'title',
      'description',
      'theme',
      'city',
      'duration_minutes',
      'distance_meters',
      'created_at',
      'updated_at',
    ],
    userData: false,
  },
  {
    name: 'places',
    columns: [
      'id',
      'name',
      'description',
      'city',
      'latitude',
      'longitude',
      'image_url',
      'created_at',
    ],
    userData: false,
  },
  { name: 'stops', columns: ['id', 'route_id', 'place_id', 'name', 'position'], userData: false },
  {
    name: 'stories',
    columns: ['id', 'stop_id', 'title', 'body', 'sources', 'created_at'],
    jsonColumns: ['sources'],
    userData: false,
  },
  {
    name: 'story_audio',
    columns: ['id', 'story_id', 'voice_id', 'language', 'audio_key', 'duration_ms'],
    userData: false,
  },
  {
    name: 'journeys',
    columns: ['id', 'user_id', 'route_id', 'status', 'started_at', 'ended_at'],
    userData: true,
    tombstone: true,
  },
  {
    name: 'journey_events',
    columns: ['id', 'journey_id', 'type', 'stop_id', 'occurred_at', 'payload'],
    jsonColumns: ['payload'],
    userData: true,
    appendOnly: true,
  },
  {
    name: 'saved_items',
    columns: ['id', 'user_id', 'item_type', 'item_id', 'created_at'],
    userData: true,
    conflictKey: ['user_id', 'item_type', 'item_id'],
    tombstone: true,
  },
  {
    name: 'downloads',
    columns: ['id', 'user_id', 'item_type', 'item_id', 'status', 'downloaded_at'],
    userData: true,
    conflictKey: ['user_id', 'item_type', 'item_id'],
    tombstone: true,
  },
];

export function getSyncTable(name: string): SyncTable {
  const table = SYNC_TABLES.find((candidate) => candidate.name === name);
  if (!table) throw new Error(`Not a synced table: ${name}`);
  return table;
}
