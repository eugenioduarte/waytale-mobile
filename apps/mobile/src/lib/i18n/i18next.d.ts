import 'i18next';

import type pt from '@/i18n/pt.json';

// `t('auth.login')` is checked against the source locale: a missing or misspelled key fails
// typecheck. `src/lib/i18n/__tests__/locales.test.ts` keeps the other locales in step with it.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: typeof pt };
  }
}
