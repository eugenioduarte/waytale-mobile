import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { type AuthApi, createAuthApi } from '@/features/auth/api';
import {
  MOCK_API_KEY,
  mockFetch,
  type MockServer,
  scenarios,
  startMockServer,
  UNREACHABLE_URL,
} from '@tests/mockoon';

// The app's client reads env and encrypted storage; these tests build their own real client
// pointed at the Mockoon mock, so the whole supabase-js request/response path runs.
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));

const { email, code } = scenarios.auth;

/** In-memory session storage, like the app's but without SecureStore. */
function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: async (key: string) => items.get(key) ?? null,
    setItem: async (key: string, value: string) => void items.set(key, value),
    removeItem: async (key: string) => void items.delete(key),
  };
}

let mock: MockServer;
let storage: ReturnType<typeof memoryStorage>;
let client: SupabaseClient;
let api: AuthApi;

/** A Supabase client at `url` sharing this test's session storage. */
function clientAt(url: string): SupabaseClient {
  return createClient(url, MOCK_API_KEY, {
    global: { fetch: mockFetch },
    auth: {
      storage,
      storageKey: 'waytale-test-auth',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

beforeAll(async () => {
  mock = await startMockServer();
}, 30_000);
afterEach(() => mock?.clearRequests());
afterAll(() => mock?.stop());

beforeEach(() => {
  storage = memoryStorage();
  client = clientAt(mock.url);
  api = createAuthApi(() => client);
});

/** The requests the mock received on `endpoint`. */
async function requestsTo(endpoint: string) {
  return (await mock.requests()).filter(({ request }) => request.urlPath === endpoint);
}

/** Their JSON bodies. */
async function bodiesSentTo(endpoint: string): Promise<Record<string, unknown>[]> {
  return (await requestsTo(endpoint)).map(
    ({ request }) => JSON.parse(request.body) as Record<string, unknown>,
  );
}

describe('email code sign-in against Supabase Auth (Mockoon)', () => {
  it('requests the code for the normalized email and allows sign-up', async () => {
    await expect(api.requestEmailCode('  Ana@Mail.PT ')).resolves.toEqual({ ok: true });

    expect(await bodiesSentTo('/auth/v1/otp')).toEqual([
      expect.objectContaining({ email: 'ana@mail.pt', create_user: true }),
    ]);
  });

  it('a valid code opens a session for that email', async () => {
    await expect(api.verifyEmailCode('ana@mail.pt', code.valid)).resolves.toEqual({ ok: true });

    const { data } = await client.auth.getSession();
    expect(data.session?.user.email).toBe('ana@mail.pt');
  });

  it('an expired or wrong code is invalid_code, with no session', async () => {
    await expect(api.verifyEmailCode(email.ok, code.expired)).resolves.toEqual({
      ok: false,
      error: 'invalid_code',
    });
    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('the email send rate limit is rate_limited', async () => {
    await expect(api.requestEmailCode(email.rateLimited)).resolves.toEqual({
      ok: false,
      error: 'rate_limited',
    });
  });

  it('a sender that refuses the address is email_unavailable', async () => {
    await expect(api.requestEmailCode(email.notAuthorized)).resolves.toEqual({
      ok: false,
      error: 'email_unavailable',
    });
  });

  it('no network is network', async () => {
    client = clientAt(UNREACHABLE_URL);

    await expect(api.requestEmailCode(email.ok)).resolves.toEqual({
      ok: false,
      error: 'network',
    });
  });

  it('a server error is network (retryable)', async () => {
    await expect(api.requestEmailCode(email.serverError)).resolves.toEqual({
      ok: false,
      error: 'network',
    });
  });
});

describe('sign-out against Supabase Auth (Mockoon)', () => {
  it('revokes the session on the server and clears it locally', async () => {
    await api.verifyEmailCode(email.ok, code.valid);

    await expect(api.signOut()).resolves.toEqual({ ok: true });

    expect(await requestsTo('/auth/v1/logout')).toHaveLength(1);
    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('offline, still signs out on this device', async () => {
    await api.verifyEmailCode(email.ok, code.valid);
    // Same stored session, but the server is out of reach.
    client = clientAt(UNREACHABLE_URL);

    await expect(api.signOut()).resolves.toEqual({ ok: true });

    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });
});
