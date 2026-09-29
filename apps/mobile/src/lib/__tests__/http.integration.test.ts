import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';

import { createHttpClient, HttpError } from '@/lib/http';
import {
  MOCK_API_KEY,
  type MockRequest,
  type MockServer,
  scenarios,
  startMockServer,
  UNREACHABLE_URL,
} from '@tests/mockoon';

// The app instance (`getHttp`) reads env and the Supabase session; these tests build their own
// client with `createHttpClient`, pointed at the mock.
jest.mock('@/lib/supabase/client', () => ({
  getSupabase: jest.fn(),
  getSupabaseConfig: () => null,
}));

let mock: MockServer;
beforeAll(async () => {
  mock = await startMockServer();
});
afterEach(() => mock.clearRequests());
afterAll(() => mock.stop());

const client = (baseURL: string, token: string | null = null) =>
  createHttpClient({ baseURL, apiKey: MOCK_API_KEY, getAccessToken: async () => token });

/** The first request that reached the mock. */
async function firstRequest(): Promise<MockRequest['request']> {
  const [first] = await mock.requests();
  if (!first) throw new Error('No request reached the mock');
  return first.request;
}

async function failure(request: Promise<unknown>): Promise<HttpError> {
  const error = await request.then(
    () => null,
    (reason: unknown) => reason,
  );
  if (!(error instanceof HttpError)) throw new Error(`Expected an HttpError, got ${String(error)}`);
  return error;
}

describe('HTTP client against the Mockoon mock', () => {
  it('calls an Edge Function with the key and the user token, and returns its data', async () => {
    const http = client(`${mock.url}/functions/v1`, 'user-jwt');

    const { data } = await http.post('/generate-route', {
      origin: { latitude: 38.7078, longitude: -9.1366 },
      interests: ['história'],
      maxMinutes: 60,
      deviationTolerance: 0.5,
    });

    expect(data).toMatchObject({ distanceMeters: 1200, durationMinutes: 25 });
    const request = await firstRequest();
    const header = (key: string) => request.headers.find((h) => h.key === key)?.value;
    expect(header('apikey')).toBe(MOCK_API_KEY);
    expect(header('authorization')).toBe('Bearer user-jwt');
  });

  it('signed out, sends no Authorization header', async () => {
    await client(`${mock.url}/functions/v1`).post('/generate-route', {});

    const request = await firstRequest();
    expect(request.headers.some((h) => h.key === 'authorization')).toBe(false);
  });

  it('an unknown endpoint is a client error, not retryable', async () => {
    const error = await failure(client(`${mock.url}/functions/v1`).post('/unknown', {}));

    expect(error).toMatchObject({ kind: 'client', status: 404, retryable: false });
  });

  it("the server's failure is retryable", async () => {
    const error = await failure(
      client(mock.url).post('/auth/v1/otp', { email: scenarios.auth.email.serverError }),
    );

    expect(error).toMatchObject({ kind: 'server', status: 503, retryable: true });
  });

  it('no network is a retryable network error', async () => {
    const error = await failure(client(UNREACHABLE_URL).get('/anything'));

    expect(error).toMatchObject({ kind: 'network', status: null, retryable: true });
  });
});
