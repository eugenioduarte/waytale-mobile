import { describe, expect, it } from '@jest/globals';

import { isValidOtp, normalizeEmail } from '@/features/auth/email';

describe('normalizeEmail', () => {
  it.each([
    ['ana@mail.pt', 'ana@mail.pt'],
    ['  Ana.Silva@Mail.PT ', 'ana.silva@mail.pt'],
    ['ana+walks@sub.mail.co.uk', 'ana+walks@sub.mail.co.uk'],
  ])('accepts %p as %p', (input, expected) => {
    expect(normalizeEmail(input)).toBe(expected);
  });

  it.each(['', 'ana', 'ana@', '@mail.pt', 'ana@mail', 'ana silva@mail.pt', 'ana@@mail.pt'])(
    'rejects %p',
    (input) => {
      expect(normalizeEmail(input)).toBeNull();
    },
  );

  it('rejects addresses longer than 254 characters', () => {
    expect(normalizeEmail(`${'a'.repeat(250)}@mail.pt`)).toBeNull();
  });
});

describe('isValidOtp', () => {
  it('accepts exactly 6 digits, ignoring surrounding spaces', () => {
    expect(isValidOtp('123456')).toBe(true);
    expect(isValidOtp(' 123456 ')).toBe(true);
  });

  it.each(['12345', '1234567', '12a456', ''])('rejects %p', (code) => {
    expect(isValidOtp(code)).toBe(false);
  });
});
