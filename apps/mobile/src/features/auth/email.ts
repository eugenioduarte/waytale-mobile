/**
 * Normalizes an email for Supabase Auth: trimmed and lower-cased, so `Ana@Mail.pt ` and
 * `ana@mail.pt` are the same account. Returns `null` when it can't be an email address — the
 * check is deliberately loose (one `@`, a dot in the domain, no spaces); the code sent by email is
 * the real proof that the address exists.
 */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? email : null;
}

/** Email OTPs are 6 digits (`[auth.email] otp_length` in supabase/config.toml). */
export function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
