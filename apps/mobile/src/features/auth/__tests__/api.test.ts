import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthApiError, AuthRetryableFetchError, type SupabaseClient } from '@supabase/supabase-js';

import { createAuthApi } from '@/features/auth/api';

// The real client needs env + native modules; the service only depends on `auth.*`.
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));

type AuthResponse = { data: unknown; error: Error | null };
const ok: AuthResponse = { data: {}, error: null };

function createClient() {
  const auth = {
    signInWithOtp: jest.fn(async (): Promise<AuthResponse> => ok),
    verifyOtp: jest.fn(async (): Promise<AuthResponse> => ok),
    signUp: jest.fn(async (): Promise<AuthResponse> => ok),
    signInWithPassword: jest.fn(async (): Promise<AuthResponse> => ok),
    signOut: jest.fn(async (): Promise<AuthResponse> => ok),
  };
  return { auth, client: { auth } as unknown as SupabaseClient };
}

let auth: ReturnType<typeof createClient>['auth'];
let api: ReturnType<typeof createAuthApi>;

beforeEach(() => {
  const created = createClient();
  auth = created.auth;
  api = createAuthApi(() => created.client);
});

describe('requestOtp', () => {
  it('sends the code to the E.164 number', async () => {
    await expect(api.requestOtp('912 345 678')).resolves.toEqual({ ok: true });
    expect(auth.signInWithOtp).toHaveBeenCalledWith({ phone: '+351912345678' });
  });

  it('rejects an invalid number without calling Supabase', async () => {
    await expect(api.requestOtp('abc')).resolves.toEqual({ ok: false, error: 'invalid_phone' });
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('maps the SMS rate limit', async () => {
    auth.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: new AuthApiError('too many', 429, 'over_sms_send_rate_limit'),
    });
    await expect(api.requestOtp('+351912345678')).resolves.toEqual({
      ok: false,
      error: 'rate_limited',
    });
  });

  it('maps network failures', async () => {
    auth.signInWithOtp.mockResolvedValueOnce({
      data: {},
      error: new AuthRetryableFetchError('offline', 0),
    });
    await expect(api.requestOtp('+351912345678')).resolves.toEqual({ ok: false, error: 'network' });
  });
});

describe('verifyOtp', () => {
  it('verifies an SMS code', async () => {
    await expect(api.verifyOtp('+351912345678', ' 123456 ')).resolves.toEqual({ ok: true });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+351912345678',
      token: '123456',
      type: 'sms',
    });
  });

  it('rejects a malformed code locally', async () => {
    await expect(api.verifyOtp('+351912345678', '12')).resolves.toEqual({
      ok: false,
      error: 'invalid_code',
    });
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('maps an expired code', async () => {
    auth.verifyOtp.mockResolvedValueOnce({
      data: {},
      error: new AuthApiError('expired', 403, 'otp_expired'),
    });
    await expect(api.verifyOtp('+351912345678', '123456')).resolves.toEqual({
      ok: false,
      error: 'invalid_code',
    });
  });
});

describe('phone + password', () => {
  it('signs up with a normalized phone', async () => {
    await expect(api.signUpWithPassword('912345678', 'caminhada42')).resolves.toEqual({ ok: true });
    expect(auth.signUp).toHaveBeenCalledWith({ phone: '+351912345678', password: 'caminhada42' });
  });

  it('rejects a short password before calling Supabase', async () => {
    await expect(api.signUpWithPassword('912345678', 'short')).resolves.toEqual({
      ok: false,
      error: 'weak_password',
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('maps wrong credentials on sign in', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: new AuthApiError('nope', 400, 'invalid_credentials'),
    });
    await expect(api.signInWithPassword('912345678', 'caminhada42')).resolves.toEqual({
      ok: false,
      error: 'invalid_credentials',
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
    ['phone_exists', 'account_exists'],
    ['user_already_exists', 'account_exists'],
    ['sms_send_failed', 'sms_unavailable'],
    ['phone_provider_disabled', 'sms_unavailable'],
    ['otp_disabled', 'sms_unavailable'],
    ['validation_failed', 'invalid_phone'],
    ['same_password', 'weak_password'],
    ['something_new', 'unknown'],
  ])('maps %p to %p', async (code, expected) => {
    auth.signUp.mockResolvedValueOnce({ data: {}, error: new AuthApiError('x', 400, code) });
    await expect(api.signUpWithPassword('912345678', 'caminhada42')).resolves.toEqual({
      ok: false,
      error: expected,
    });
  });
});
