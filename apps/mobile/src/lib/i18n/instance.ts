import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/i18n/en.json';
import es from '@/i18n/es.json';
import pt from '@/i18n/pt.json';

import { FALLBACK_LANGUAGE, resolveLanguage, SUPPORTED_LANGUAGES } from './languages';

export const resources = {
  pt: { translation: pt },
  en: { translation: en },
  es: { translation: es },
} as const;

/**
 * The app's i18next, initialised on import, synchronously: the resources are bundled, nothing to
 * fetch (offline first). Starts in the device language; `useLanguageSync` takes it from there.
 * `initReactI18next` hands it to every `useTranslation`.
 */
export const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage('system', getLocales()),
  fallbackLng: FALLBACK_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  // React already escapes what it renders.
  interpolation: { escapeValue: false },
  initAsync: false,
});
