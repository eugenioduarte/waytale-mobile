import placeRows from '@waytale/mockoon-config/data/rest/places.json';
import routeRows from '@waytale/mockoon-config/data/rest/routes.json';
import stopRows from '@waytale/mockoon-config/data/rest/stops.json';
import storyRows from '@waytale/mockoon-config/data/rest/stories.json';
import storyAudioRows from '@waytale/mockoon-config/data/rest/story_audio.json';

import type { Database } from './client';
import { places, routes, stops, stories, storyAudio } from './schema';

/**
 * Demo seed for dev and Storybook: the demo catalog (one Lisbon route, two stops), so the app has
 * offline content to render. The rows are the mock data the Mockoon mock serves on
 * `/rest/v1/<table>` (`tooling/mockoon/data/rest/`), so seeded and synced demo content are the same
 * rows. Idempotent (`onConflictDoNothing`), so re-running is a no-op. Ids are fixed UUIDs (the
 * `5a1e…` prefix marks demo data), like every synced id.
 *
 * Only runs in development (`initializeDatabase` gates it behind `__DEV__`).
 */
export async function seedDemo(db: Database): Promise<void> {
  await db
    .insert(routes)
    .values(
      routeRows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        theme: row.theme,
        city: row.city,
        durationMinutes: row.duration_minutes,
        distanceMeters: row.distance_meters,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(places)
    .values(
      placeRows.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        city: row.city,
        latitude: row.latitude,
        longitude: row.longitude,
        imageUrl: row.image_url,
        createdAt: row.created_at,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(stops)
    .values(
      stopRows.map((row) => ({
        id: row.id,
        routeId: row.route_id,
        placeId: row.place_id,
        name: row.name,
        position: row.position,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(stories)
    .values(
      storyRows.map((row) => ({
        id: row.id,
        stopId: row.stop_id,
        title: row.title,
        body: row.body,
        // `jsonb` on the server, JSON text locally (see `lib/sync/tables.ts`).
        sources: JSON.stringify(row.sources),
        createdAt: row.created_at,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(storyAudio)
    .values(
      storyAudioRows.map((row) => ({
        id: row.id,
        storyId: row.story_id,
        voiceId: row.voice_id,
        language: row.language,
        audioKey: row.audio_key,
        durationMs: row.duration_ms,
      })),
    )
    .onConflictDoNothing();
}
