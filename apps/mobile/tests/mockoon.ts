import scenarios from '@waytale/mockoon-config/scenarios.json';
import axios from 'axios';

/**
 * The network in tests (EPIC-01.11) is the same Mockoon mock the app runs against in dev
 * (`pnpm mockoon`), started in its own process per test file — one set of mock data for both, in
 * `tooling/mockoon/` (see the `mock-data` skill). A test picks a scenario by its input
 * (`scenarios.auth.email.rateLimited`), never by redefining a response here.
 *
 *   let mock: MockServer;
 *   beforeAll(async () => { mock = await startMockServer(); });
 *   afterEach(() => mock.clearRequests());   // `await mock.requests()` to assert on them
 *   afterAll(() => mock.stop());
 */
export { type MockRequest, type MockServer, startMockServer } from '@waytale/mockoon-config';
export { scenarios };

/** The publishable key tests hand to clients pointed at the mock (it isn't checked). */
export const MOCK_API_KEY = 'sb_publishable_mock';

/** Where nothing listens: the connection is refused, as when the phone is offline. */
export const UNREACHABLE_URL = 'http://127.0.0.1:9';

/** Statuses whose response can't have a body (`new Response(body)` throws for them). */
const NULL_BODY_STATUSES = new Set([101, 204, 205, 304]);

/**
 * A `fetch` that really reaches the mock, for clients that take one
 * (`createClient(mock.url, key, { global: { fetch: mockFetch } })`).
 *
 * jest-expo's global `fetch` is Expo's native-backed one, with no network in Jest, and Node's own
 * fetch can't run inside Jest's context (its streams are polyfilled). This goes through axios's
 * Node build (see `jest.config.js`), which uses Node's `http`. Covers what supabase-js sends:
 * method, headers, a string body; a connection failure rejects with `TypeError`, as fetch does.
 */
export async function mockFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const url = input instanceof Request ? input.url : String(input);
  const headers: Record<string, string> = {};
  new Headers(init.headers).forEach((value, key) => {
    headers[key] = value;
  });

  let response;
  try {
    response = await axios.request<string>({
      url,
      method: init.method ?? 'GET',
      headers,
      data: init.body ?? undefined,
      responseType: 'text',
      transformResponse: (body: string) => body,
      validateStatus: () => true,
    });
  } catch (error) {
    throw new TypeError('fetch failed', { cause: error });
  }

  const responseHeaders = new Headers();
  for (const [key, value] of Object.entries(response.headers)) {
    if (typeof value === 'string') responseHeaders.set(key, value);
  }
  return new Response(NULL_BODY_STATUSES.has(response.status) ? null : response.data, {
    status: response.status,
    headers: responseHeaders,
  });
}
