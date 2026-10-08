import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import routeRows from '@waytale/mockoon-config/data/rest/routes.json';
import storyRows from '@waytale/mockoon-config/data/rest/stories.json';

import { pullAll } from '@/lib/sync/pull';
import { createSupabaseRemote } from '@/lib/sync/remote';
import { createTestDatabase, hasSqlite } from '@tests/helpers/sync';
import { MOCK_API_KEY, mockFetch, type MockServer, startMockServer } from '@tests/mockoon';

jest.mock('expo-crypto', () => ({
  randomUUID: () => jest.requireActual<typeof import('node:crypto')>('node:crypto').randomUUID(),
}));

const describeWithSqlite = hasSqlite ? describe : describe.skip;

let mock: MockServer;
beforeAll(async () => {
  mock = await startMockServer();
}, 30_000);
afterAll(() => mock?.stop());

describeWithSqlite('pull through supabase-js against the Mockoon mock', () => {
  it('brings the demo catalog (tooling/mockoon/data/rest) into SQLite', async () => {
    const { db, raw } = createTestDatabase();
    const client = createClient(mock.url, MOCK_API_KEY, {
      global: { fetch: mockFetch },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    await pullAll(
      db,
      createSupabaseRemote(() => client),
    );

    const count = (table: string) =>
      (raw.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;
    expect(count('routes')).toBe(routeRows.length);
    expect(count('stops')).toBe(2);
    expect(count('story_audio')).toBe(2);
    // `jsonb` on the server, JSON text locally.
    const story = raw.prepare('SELECT sources FROM stories WHERE id = ?').get(storyRows[0]!.id) as {
      sources: string;
    };
    expect(JSON.parse(story.sources)).toEqual(storyRows[0]!.sources);
  });
});
