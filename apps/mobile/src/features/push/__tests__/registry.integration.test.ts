import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

import { createPushRegistry } from '@/features/push/registry';
import {
  MOCK_API_KEY,
  mockFetch,
  type MockRequest,
  type MockServer,
  startMockServer,
  UNREACHABLE_URL,
} from '@tests/mockoon';

// The app's client reads env and encrypted storage; this builds a real one pointed at the mock.
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));

let mock: MockServer;
beforeAll(async () => {
  mock = await startMockServer();
});
afterEach(() => mock.clearRequests());
afterAll(() => mock.stop());

/** The first request that reached the mock. */
async function firstRequest(): Promise<MockRequest['request']> {
  const [first] = await mock.requests();
  if (!first) throw new Error('No request reached the mock');
  return first.request;
}

const registryAt = (url: string) =>
  createPushRegistry(() =>
    createClient(url, MOCK_API_KEY, {
      global: { fetch: mockFetch },
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  );

describe('push token registry against Supabase (Mockoon)', () => {
  it('registers the token through register_push_token', async () => {
    await registryAt(mock.url).register('fcm-token-1', 'android');

    const request = await firstRequest();
    expect(request.urlPath).toBe('/rest/v1/rpc/register_push_token');
    expect(JSON.parse(request.body)).toEqual({
      push_token: 'fcm-token-1',
      device_platform: 'android',
    });
  });

  it("removes only this device's token", async () => {
    await registryAt(mock.url).unregister('fcm-token-1');

    const request = await firstRequest();
    expect(`${request.method} ${request.urlPath}`).toBe('delete /rest/v1/push_tokens');
  });

  it('fails loudly offline, so the caller can report it', async () => {
    await expect(registryAt(UNREACHABLE_URL).register('fcm-token-1', 'android')).rejects.toThrow(
      /register_push_token/,
    );
  });
});
