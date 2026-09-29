/**
 * The languages Waytale ships in (EPIC-01.9) and how the one on screen is chosen. No side effects,
 * so stores can import the types without initialising i18next.
 */

export const SUPPORTED_LANGUAGES = ['pt', 'en', 'es'] as const;

export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** What the traveller picked in Profile: a language, or follow the device (the default). */
export type LanguagePreference = AppLanguage | 'system';

/** When the device speaks none of ours: the most likely second language of a traveller. */
export const FALLBACK_LANGUAGE: AppLanguage = 'en';

export function isAppLanguage(value: unknown): value is AppLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language === value);
}

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === 'system' || isAppLanguage(value);
}

/**
 * The language to show: the manual choice, else the first device language we support (in the
 * device's order of preference, `pt-BR` → `pt`), else the fallback.
 */
export function resolveLanguage(
  preference: LanguagePreference,
  deviceLocales: readonly { languageCode: string | null }[],
): AppLanguage {
  if (preference !== 'system') return preference;
  const deviceLanguage = deviceLocales
    .map((locale) => locale.languageCode?.toLowerCase())
    .find(isAppLanguage);
  return deviceLanguage ?? FALLBACK_LANGUAGE;
}
