import {
  type AuthError,
  isAuthRetryableFetchError,
  type SupabaseClient,
} from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase/client';

import { isValidOtp, normalizePhone } from './phone';

/**
 * Phone auth service: OTP (passwordless) and phone + password, over Supabase Auth.
 *
 * Every call resolves to an `AuthResult` instead of throwing, with a small error vocabulary the
 * UI can map to copy. The session itself is not returned: Supabase persists it (encrypted) and
 * `useSupabaseAuthSync` mirrors it into the session store, which drives the route guard.
 */

export type AuthErrorCode =
  | 'invalid_phone'
  | 'invalid_code'
  | 'weak_password'
  | 'invalid_credentials'
  | 'account_exists'
  | 'sms_unavailable'
  | 'rate_limited'
  | 'network'
  | 'unknown';

export type AuthResult = { ok: true } | { ok: false; error: AuthErrorCode };

const MIN_PASSWORD_LENGTH = 8; // matches `minimum_password_length` in supabase/config.toml

function toErrorCode(error: AuthError): AuthErrorCode {
  if (isAuthRetryableFetchError(error)) return 'network';
  switch (error.code) {
    case 'otp_expired':
      return 'invalid_code';
    case 'invalid_credentials':
    case 'phone_not_confirmed':
      return 'invalid_credentials';
    case 'weak_password':
    case 'same_password':
      return 'weak_password';
    case 'validation_failed':
      return 'invalid_phone';
    case 'phone_exists':
    case 'user_already_exists':
      return 'account_exists';
    // SMS provider not configured, disabled, or failing on its side.
    case 'sms_send_failed':
    case 'phone_provider_disabled':
    case 'otp_disabled':
      return 'sms_unavailable';
    case 'over_sms_send_rate_limit':
    case 'over_request_rate_limit':
      return 'rate_limited';
    default:
      return 'unknown';
  }
}

function toResult({ error }: { error: AuthError | null }): AuthResult {
  return error ? { ok: false, error: toErrorCode(error) } : { ok: true };
}

export function createAuthApi(getClient: () => SupabaseClient = getSupabase) {
  return {
    /** Sends a 6-digit code by SMS; creates the account on first use. */
    async requestOtp(phoneInput: string): Promise<AuthResult> {
      const phone = normalizePhone(phoneInput);
      if (!phone) return { ok: false, error: 'invalid_phone' };
      return toResult(await getClient().auth.signInWithOtp({ phone }));
    },

    /** Confirms an SMS code, from `requestOtp` or from `signUpWithPassword`. */
    async verifyOtp(phoneInput: string, code: string): Promise<AuthResult> {
      const phone = normalizePhone(phoneInput);
      if (!phone) return { ok: false, error: 'invalid_phone' };
      if (!isValidOtp(code)) return { ok: false, error: 'invalid_code' };
      return toResult(await getClient().auth.verifyOtp({ phone, token: code.trim(), type: 'sms' }));
    },

    /**
     * Creates a phone + password account. Phone confirmation is required (`[auth.sms]
     * enable_confirmations`), so no session yet: Supabase sends an SMS code for `verifyOtp`.
     */
    async signUpWithPassword(phoneInput: string, password: string): Promise<AuthResult> {
      const phone = normalizePhone(phoneInput);
      if (!phone) return { ok: false, error: 'invalid_phone' };
      if (password.length < MIN_PASSWORD_LENGTH) return { ok: false, error: 'weak_password' };
      return toResult(await getClient().auth.signUp({ phone, password }));
    },

    async signInWithPassword(phoneInput: string, password: string): Promise<AuthResult> {
      const phone = normalizePhone(phoneInput);
      if (!phone) return { ok: false, error: 'invalid_phone' };
      return toResult(await getClient().auth.signInWithPassword({ phone, password }));
    },

    /**
     * Revokes the refresh token server-side and clears the stored session. Offline, supabase-js
     * still clears the local session (and emits `SIGNED_OUT`) but returns a network error; the
     * traveller is signed out on this device, so that counts as success.
     */
    async signOut(): Promise<AuthResult> {
      const { error } = await getClient().auth.signOut();
      if (error && isAuthRetryableFetchError(error)) return { ok: true };
      return toResult({ error });
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;

export const authApi = createAuthApi();
