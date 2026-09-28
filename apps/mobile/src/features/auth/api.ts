import {
  type AuthError,
  isAuthRetryableFetchError,
  type SupabaseClient,
} from '@supabase/supabase-js';

import { getSupabase } from '@/lib/supabase/client';

import { isValidOtp, normalizeEmail } from './email';

/**
 * Auth service over Supabase Auth: a 6-digit code by email, no passwords — so there is nothing to
 * recover or reset. The first verified code creates the account.
 *
 * Every call resolves to an `AuthResult` instead of throwing, with a small error vocabulary the
 * UI can map to copy. The session itself is not returned: Supabase persists it (encrypted) and
 * `useSupabaseAuthSync` mirrors it into the session store, which drives the route guard.
 */

export type AuthErrorCode =
  | 'invalid_email'
  | 'invalid_code'
  | 'email_unavailable'
  | 'rate_limited'
  | 'captcha_failed'
  | 'network'
  | 'unknown';

export type AuthResult = { ok: true } | { ok: false; error: AuthErrorCode };

function toErrorCode(error: AuthError): AuthErrorCode {
  if (isAuthRetryableFetchError(error)) return 'network';
  switch (error.code) {
    case 'otp_expired':
      return 'invalid_code';
    case 'validation_failed':
    case 'email_address_invalid':
      return 'invalid_email';
    // Email sign-in off, or the SMTP sender refusing/failing (the default Supabase sender only
    // delivers to team members: `email_address_not_authorized`).
    case 'email_provider_disabled':
    case 'otp_disabled':
    case 'signup_disabled':
    case 'email_address_not_authorized':
      return 'email_unavailable';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'rate_limited';
    case 'captcha_failed':
      return 'captcha_failed';
    default:
      return 'unknown';
  }
}

function toResult({ error }: { error: AuthError | null }): AuthResult {
  return error ? { ok: false, error: toErrorCode(error) } : { ok: true };
}

export function createAuthApi(getClient: () => SupabaseClient = getSupabase) {
  return {
    /**
     * Emails a 6-digit code; creates the account on first use. With `[auth.captcha]` on, Supabase
     * rejects requests without a captcha token: the auth UI solves the challenge and passes it
     * here. Without one the request goes out unchanged (captcha still off).
     */
    async requestEmailCode(emailInput: string, captchaToken?: string): Promise<AuthResult> {
      const email = normalizeEmail(emailInput);
      if (!email) return { ok: false, error: 'invalid_email' };
      return toResult(
        await getClient().auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true, ...(captchaToken ? { captchaToken } : {}) },
        }),
      );
    },

    /** Confirms the emailed code from `requestEmailCode`; on success Supabase stores the session. */
    async verifyEmailCode(emailInput: string, code: string): Promise<AuthResult> {
      const email = normalizeEmail(emailInput);
      if (!email) return { ok: false, error: 'invalid_email' };
      if (!isValidOtp(code)) return { ok: false, error: 'invalid_code' };
      return toResult(
        await getClient().auth.verifyOtp({ email, token: code.trim(), type: 'email' }),
      );
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
