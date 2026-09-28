import { http, HttpResponse } from 'msw';

import { buildSession, buildUser } from '../factories';

/**
 * MSW handlers for the network the app talks to — Supabase Auth for now (EPIC-01.8). The defaults
 * are the happy path; a test overrides one with `server.use(...)` for its scenario.
 */

/** The Supabase URL integration tests point their client at. Nothing real answers here. */
export const SUPABASE_TEST_URL = 'https://waytale-test.supabase.co';
export const SUPABASE_TEST_KEY = 'sb_publishable_test';

export const authUrl = (endpoint: string) => `${SUPABASE_TEST_URL}/auth/v1${endpoint}`;

/** A Supabase Auth error as the API sends it today (error code in `code`, versioned header). */
export function authError(status: number, code: string, message = code) {
  return HttpResponse.json(
    { code, message },
    { status, headers: { 'x-supabase-api-version': '2024-01-01' } },
  );
}

export const handlers = [
  // signInWithOtp: the code is emailed.
  http.post(authUrl('/otp'), () => HttpResponse.json({})),

  // verifyOtp: a valid code opens a session for that email.
  http.post(authUrl('/verify'), async ({ request }) => {
    const { email } = (await request.json()) as { email: string };
    return HttpResponse.json(buildSession({ user: buildUser({ email }) }));
  }),

  // signOut: the refresh token is revoked.
  http.post(authUrl('/logout'), () => new HttpResponse(null, { status: 204 })),
];
