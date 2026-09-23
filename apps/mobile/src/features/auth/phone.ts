/** Country used when the number is typed without an international prefix (the launch market). */
const DEFAULT_COUNTRY_CODE = '351';

/**
 * Normalizes user input to E.164 (`+<country><number>`), the format Supabase phone auth expects.
 * Accepts spaces, dashes, dots and parentheses, a `+` or `00` international prefix, or a national
 * number (then `DEFAULT_COUNTRY_CODE` is assumed). Returns `null` when it can't be a phone number.
 */
export function normalizePhone(
  input: string,
  defaultCountryCode = DEFAULT_COUNTRY_CODE,
): string | null {
  const compact = input.trim().replace(/[\s().-]/g, '');
  let digits: string;
  if (compact.startsWith('+')) digits = compact.slice(1);
  else if (compact.startsWith('00')) digits = compact.slice(2);
  else digits = defaultCountryCode + compact;

  // E.164: up to 15 digits, no leading zero on the country code.
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

/** Supabase SMS OTPs are 6 digits. */
export function isValidOtp(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
