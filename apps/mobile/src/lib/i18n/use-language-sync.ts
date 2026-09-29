import { useLocales } from 'expo-localization';
import { useLayoutEffect } from 'react';

import { useLanguagePreference } from '@/stores/preferences.store';

import { i18n } from './instance';
import { resolveLanguage } from './languages';

/**
 * Keeps i18next on the language the traveller should see, live: `useLocales` re-renders when the
 * device language changes (Android keeps the activity alive for it, see the `expo-localization`
 * plugin; the web listens to `languagechange`), and the preference re-renders when changed in
 * Profile. Every `useTranslation` consumer then re-renders in place — no restart.
 *
 * A layout effect so the first frame after the preferences rehydrate is already in the right
 * language. Mount once, in the root layout.
 */
export function useLanguageSync(): void {
  const deviceLocales = useLocales();
  const preference = useLanguagePreference();
  const language = resolveLanguage(preference, deviceLocales);

  useLayoutEffect(() => {
    if (i18n.language !== language) void i18n.changeLanguage(language);
  }, [language]);
}
