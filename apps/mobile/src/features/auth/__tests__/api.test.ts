import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthApiError, AuthRetryableFetchError, type SupabaseClient } from '@supabase/supabase-js';

import { createAuthApi } from '@/features/auth/api';

// The real client needs env + native modules; the service only depends on `auth.*`.
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));

type AuthResponse = { data: unknown; error: Error | null };
const ok: AuthResponse = { data: {}, error: null };

function createDeps() {
  const auth = {
    signInWithOtp: jest.fn(async (): Promise<AuthResponse> => ok),
    verifyOtp: jest.fn(async (): Promise<AuthResponse> => ok),
    signOut: jest.fn(async (): Promise<AuthResponse> => ok),
  };
  return { auth, client: { auth } as unknown as SupabaseClient };
}

let auth: ReturnType<typeof createDeps>['auth'];
let api: ReturnType<typeof createAuthApi>;

beforeEach(() => {
  const created = createDeps();
  auth = created.auth;
  api = createAuthApi(() => created.client);
});

describe('requestEmailCode', () => {
  it('emails the code to the normalized address, creating the account if needed', async () => {
    await expect(api.requestEmailCode('  Ana@Mail.PT ')).resolves.toEqual({ ok: true });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@mail.pt',
      options: { shouldCreateUser: true },
    });
  });

  it('forwards the captcha token when the UI has one', async () => {
    await api.requestEmailCode('ana@mail.pt', 'captcha-token');
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'ana@mail.pt',
      options: { shouldCreateUser: true, captchaToken: 'captcha-token' },
    });
  });

  it('rejects an invalid address without calling Supabase', async () => {
    await expect(api.requestEmailCode('ana@')).resolves.toEqual({
      ok: false,
      error: 'invalid_email',
    });
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('maps the email rate limit', async () => {
    auth.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: new AuthApiError('too many', 429, 'over_email_send_rate_limit'),
    });
    await expect(api.requestEmailCode('ana@mail.pt')).resolves.toEqual({
      ok: false,
      error: 'rate_limited',
    });
  });

  it('maps network failures', async () => {
    auth.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: new AuthRetryableFetchError('offline', 0),
    });
    await expect(api.requestEmailCode('ana@mail.pt')).resolves.toEqual({
      ok: false,
      error: 'network',
    });
  });
});

describe('verifyEmailCode', () => {
  it('verifies the emailed code', async () => {
    await expect(api.verifyEmailCode('Ana@mail.pt', ' 123456 ')).resolves.toEqual({ ok: true });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'ana@mail.pt',
      token: '123456',
      type: 'email',
    });
  });

  it('rejects a malformed code locally', async () => {
    await expect(api.verifyEmailCode('ana@mail.pt', '12')).resolves.toEqual({
      ok: false,
      error: 'invalid_code',
    });
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('maps an expired or wrong code', async () => {
    auth.verifyOtp.mockResolvedValueOnce({
      data: {},
      error: new AuthApiError('expired', 403, 'otp_expired'),
    });
    await expect(api.verifyEmailCode('ana@mail.pt', '123456')).resolves.toEqual({
      ok: false,
      error: 'invalid_code',
    });
  });
});

describe('signOut', () => {
  it('signs out through Supabase', async () => {
    await expect(api.signOut()).resolves.toEqual({ ok: true });
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('counts an offline sign-out as done (the local session is already cleared)', async () => {
    auth.signOut.mockResolvedValueOnce({
      data: {},
      error: new AuthRetryableFetchError('offline', 0),
    });
    await expect(api.signOut()).resolves.toEqual({ ok: true });
  });
});

describe('error mapping', () => {
  it.each([
    ['email_provider_disabled', 'email_unavailable'],
    ['otp_disabled', 'email_unavailable'],
    ['signup_disabled', 'email_unavailable'],
    ['email_address_not_authorized', 'email_unavailable'],
    ['email_address_invalid', 'invalid_email'],
    ['validation_failed', 'invalid_email'],
    ['over_request_rate_limit', 'rate_limited'],
    ['captcha_failed', 'captcha_failed'],
    ['something_new', 'unknown'],
  ])('maps %p to %p', async (code, expected) => {
    auth.signInWithOtp.mockResolvedValueOnce({ data: {}, error: new AuthApiError('x', 400, code) });
    await expect(api.requestEmailCode('ana@mail.pt')).resolves.toEqual({
      ok: false,
      error: expected,
    });
  });
});
