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
import { http, HttpResponse } from 'msw';

import { type AuthApi, createAuthApi } from '@/features/auth/api';
import { authError, authUrl, SUPABASE_TEST_KEY, SUPABASE_TEST_URL } from '@tests/msw/handlers';
import { server } from '@tests/msw/server';

// The app's client reads env and encrypted storage; these tests build their own real client
// pointed at the MSW handlers, so the whole supabase-js request/response path runs.
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));

/** In-memory session storage, like the app's but without SecureStore. */
function memoryStorage() {
  const items = new Map<string, string>();
  return {
    getItem: async (key: string) => items.get(key) ?? null,
    setItem: async (key: string, value: string) => void items.set(key, value),
    removeItem: async (key: string) => void items.delete(key),
  };
}

let client: SupabaseClient;
let api: AuthApi;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  client = createClient(SUPABASE_TEST_URL, SUPABASE_TEST_KEY, {
    auth: {
      storage: memoryStorage(),
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  api = createAuthApi(() => client);
});

/** Records the JSON body of every request to `endpoint`, answering with the default handler. */
function captureBodies(endpoint: string) {
  const bodies: Record<string, unknown>[] = [];
  server.events.on('request:start', async ({ request }) => {
    if (request.url.startsWith(authUrl(endpoint))) {
      bodies.push((await request.clone().json()) as Record<string, unknown>);
    }
  });
  return bodies;
}

afterEach(() => server.events.removeAllListeners());

describe('email code sign-in against Supabase Auth (MSW)', () => {
  it('requests the code for the normalized email and allows sign-up', async () => {
    const bodies = captureBodies('/otp');

    await expect(api.requestEmailCode('  Ana@Mail.PT ')).resolves.toEqual({ ok: true });

    expect(bodies).toEqual([expect.objectContaining({ email: 'ana@mail.pt', create_user: true })]);
  });

  it('a valid code opens a session for that email', async () => {
    await expect(api.verifyEmailCode('ana@mail.pt', '123456')).resolves.toEqual({ ok: true });

    const { data } = await client.auth.getSession();
    expect(data.session?.user.email).toBe('ana@mail.pt');
  });

  it('an expired or wrong code is invalid_code, with no session', async () => {
    server.use(http.post(authUrl('/verify'), () => authError(403, 'otp_expired')));

    await expect(api.verifyEmailCode('ana@mail.pt', '123456')).resolves.toEqual({
      ok: false,
      error: 'invalid_code',
    });
    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('the email send rate limit is rate_limited', async () => {
    server.use(http.post(authUrl('/otp'), () => authError(429, 'over_email_send_rate_limit')));

    await expect(api.requestEmailCode('ana@mail.pt')).resolves.toEqual({
      ok: false,
      error: 'rate_limited',
    });
  });

  it('a sender that refuses the address is email_unavailable', async () => {
    server.use(http.post(authUrl('/otp'), () => authError(400, 'email_address_not_authorized')));

    await expect(api.requestEmailCode('ana@mail.pt')).resolves.toEqual({
      ok: false,
      error: 'email_unavailable',
    });
  });

  it('no network is network', async () => {
    server.use(http.post(authUrl('/otp'), () => HttpResponse.error()));

    await expect(api.requestEmailCode('ana@mail.pt')).resolves.toEqual({
      ok: false,
      error: 'network',
    });
  });

  it('a server error is network (retryable)', async () => {
    server.use(http.post(authUrl('/otp'), () => authError(503, 'unexpected_failure')));

    await expect(api.requestEmailCode('ana@mail.pt')).resolves.toEqual({
      ok: false,
      error: 'network',
    });
  });
});

describe('sign-out against Supabase Auth (MSW)', () => {
  it('revokes the session on the server and clears it locally', async () => {
    await api.verifyEmailCode('ana@mail.pt', '123456');
    let revoked = false;
    server.use(
      http.post(authUrl('/logout'), () => {
        revoked = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    await expect(api.signOut()).resolves.toEqual({ ok: true });

    expect(revoked).toBe(true);
    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });

  it('offline, still signs out on this device', async () => {
    await api.verifyEmailCode('ana@mail.pt', '123456');
    server.use(http.post(authUrl('/logout'), () => HttpResponse.error()));

    await expect(api.signOut()).resolves.toEqual({ ok: true });

    const { data } = await client.auth.getSession();
    expect(data.session).toBeNull();
  });
});
