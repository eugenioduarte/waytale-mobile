import type { Database } from './client';
import { places, routes, stops, stories, storyAudio } from './schema';

const now = () => new Date().toISOString();

/**
 * Demo seed for dev and Storybook: one Lisbon route with two stops, so the app has offline
 * content to render. Idempotent (`onConflictDoNothing`), so re-running is a no-op.
 *
 * Only runs in development (`initializeDatabase` gates it behind `__DEV__`).
 */
export async function seedDemo(db: Database): Promise<void> {
  const timestamp = now();

  await db
    .insert(routes)
    .values([
      {
        id: 'route-demo-lisboa',
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
        id: 'place-comercio',
        name: 'Praça do Comércio',
        description: 'A praça que recebia quem chegava a Lisboa pelo Tejo.',
        city: 'Lisboa',
        latitude: 38.7078,
        longitude: -9.1366,
        createdAt: timestamp,
      },
      {
        id: 'place-chiado',
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
        id: 'stop-comercio',
        routeId: 'route-demo-lisboa',
        placeId: 'place-comercio',
        name: 'Praça do Comércio',
        position: 0,
      },
      {
        id: 'stop-chiado',
        routeId: 'route-demo-lisboa',
        placeId: 'place-chiado',
        name: 'Chiado',
        position: 1,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(stories)
    .values([
      {
        id: 'story-comercio',
        stopId: 'stop-comercio',
        title: 'O terreiro que era um porto',
        body: 'Antes de ser praça, este terreiro recebia os barcos que chegavam do mar.',
        sources: '["Arquivo Municipal de Lisboa"]',
        createdAt: timestamp,
      },
      {
        id: 'story-chiado',
        stopId: 'stop-chiado',
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
        id: 'audio-comercio-pt',
        storyId: 'story-comercio',
        language: 'pt',
        durationMs: 42000,
      },
      {
        id: 'audio-chiado-pt',
        storyId: 'story-chiado',
        language: 'pt',
        durationMs: 36000,
      },
    ])
    .onConflictDoNothing();
}
