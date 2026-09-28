import type { Database } from './client';
import { places, routes, stops, stories, storyAudio } from './schema';

const now = () => new Date().toISOString();

/**
 * Demo seed for dev and Storybook: one Lisbon route with two stops, so the app has offline
 * content to render. Idempotent (`onConflictDoNothing`), so re-running is a no-op. Ids are fixed
 * UUIDs (the `5a1e…` prefix marks demo data), like every synced id.
 *
 * Only runs in development (`initializeDatabase` gates it behind `__DEV__`).
 */
export async function seedDemo(db: Database): Promise<void> {
  const timestamp = now();

  await db
    .insert(routes)
    .values([
      {
        id: '5a1e0000-0000-4000-8000-000000000001',
        title: 'Baixa de Lisboa',
        description: 'Um passeio curto pela história do centro, da Praça do Comércio ao Chiado.',
        theme: 'história',
        city: 'Lisboa',
        durationMinutes: 40,
        distanceMeters: 2200,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(places)
    .values([
      {
        id: '5a1e0000-0000-4000-8000-000000000101',
        name: 'Praça do Comércio',
        description: 'A praça que recebia quem chegava a Lisboa pelo Tejo.',
        city: 'Lisboa',
        latitude: 38.7078,
        longitude: -9.1366,
        createdAt: timestamp,
      },
      {
        id: '5a1e0000-0000-4000-8000-000000000102',
        name: 'Chiado',
        description: 'O bairro dos cafés e das livrarias.',
        city: 'Lisboa',
        latitude: 38.7109,
        longitude: -9.1409,
        createdAt: timestamp,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(stops)
    .values([
      {
        id: '5a1e0000-0000-4000-8000-000000000201',
        routeId: '5a1e0000-0000-4000-8000-000000000001',
        placeId: '5a1e0000-0000-4000-8000-000000000101',
        name: 'Praça do Comércio',
        position: 0,
      },
      {
        id: '5a1e0000-0000-4000-8000-000000000202',
        routeId: '5a1e0000-0000-4000-8000-000000000001',
        placeId: '5a1e0000-0000-4000-8000-000000000102',
        name: 'Chiado',
        position: 1,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(stories)
    .values([
      {
        id: '5a1e0000-0000-4000-8000-000000000301',
        stopId: '5a1e0000-0000-4000-8000-000000000201',
        title: 'O terreiro que era um porto',
        body: 'Antes de ser praça, este terreiro recebia os barcos que chegavam do mar.',
        sources: '["Arquivo Municipal de Lisboa"]',
        createdAt: timestamp,
      },
      {
        id: '5a1e0000-0000-4000-8000-000000000302',
        stopId: '5a1e0000-0000-4000-8000-000000000202',
        title: 'Cafés e poetas',
        body: 'No Chiado, os cafés foram, durante décadas, o ponto de encontro de escritores.',
        sources: '["História do Chiado, ed. municipal"]',
        createdAt: timestamp,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(storyAudio)
    .values([
      {
        id: '5a1e0000-0000-4000-8000-000000000401',
        storyId: '5a1e0000-0000-4000-8000-000000000301',
        language: 'pt',
        durationMs: 42000,
      },
      {
        id: '5a1e0000-0000-4000-8000-000000000402',
        storyId: '5a1e0000-0000-4000-8000-000000000302',
        language: 'pt',
        durationMs: 36000,
      },
    ])
    .onConflictDoNothing();
}
