import { describe, expect, it } from '@jest/globals';

import { isValidOtp, normalizePhone } from '@/features/auth/phone';

describe('normalizePhone', () => {
  it.each([
    ['+351 912 345 678', '+351912345678'],
    ['00351 912-345-678', '+351912345678'],
    ['912 345 678', '+351912345678'],
    ['+44 (20) 7946.0958', '+442079460958'],
  ])('normalizes %p to E.164', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('uses the given default country for national numbers', () => {
    expect(normalizePhone('06 12 34 56 78', '33')).toBe('+330612345678');
  });

  it.each(['', 'abc', '+0351912345678', '+35191234567890123', '12'])('rejects %p', (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe('isValidOtp', () => {
  it('accepts exactly six digits', () => {
    expect(isValidOtp(' 123456 ')).toBe(true);
  });

  it.each(['12345', '1234567', '12a456', ''])('rejects %p', (code) => {
    expect(isValidOtp(code)).toBe(false);
  });
});
