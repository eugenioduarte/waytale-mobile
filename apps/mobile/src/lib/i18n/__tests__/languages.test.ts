import { describe, expect, it } from '@jest/globals';

import { isLanguagePreference, resolveLanguage } from '@/lib/i18n/languages';

const device = (...codes: (string | null)[]) => codes.map((languageCode) => ({ languageCode }));

describe('resolveLanguage', () => {
  it('follows the device when the preference is "system"', () => {
    expect(resolveLanguage('system', device('es'))).toBe('es');
  });

  it('maps a regional device locale to its language', () => {
    expect(resolveLanguage('system', device('PT'))).toBe('pt');
  });

  it("takes the device's first supported language, in its order of preference", () => {
    expect(resolveLanguage('system', device('fr', null, 'pt', 'en'))).toBe('pt');
  });

  it('falls back to English when the device speaks none of ours', () => {
    expect(resolveLanguage('system', device('fr', 'de'))).toBe('en');
    expect(resolveLanguage('system', [])).toBe('en');
  });

  it('a manual choice wins over the device', () => {
    expect(resolveLanguage('es', device('pt'))).toBe('es');
  });
});

describe('isLanguagePreference', () => {
  it('accepts the supported languages and "system" only', () => {
    expect(['system', 'pt', 'en', 'es'].every(isLanguagePreference)).toBe(true);
    expect([undefined, null, 'fr', 'pt-PT', 1].some(isLanguagePreference)).toBe(false);
  });
});
