---
name: translations
description: Add or review React Native user-facing copy through the project's i18n system. Use for new text, edited labels, errors, accessibility copy, placeholders, pluralization, or locale formatting; not for internal logs or developer-only messages.
---

# Translations

1. Reuse a key only when meaning and context match exactly.
2. Add copy to every locale in `apps/mobile/src/i18n/` (`pt.json`, `en.json`, `es.json`), keyed
   by feature (`auth.login`); `pt.json` is the source the keys are typed from. Never inline
   user-visible strings — `waytale/no-literal-ui-string` fails lint on them.
3. Render copy with `t()` from `useTranslation`, imported from `@/lib/i18n` (not
   `react-i18next`), inside the component — never resolve copy into module-level constants, or it
   won't follow a language change.
4. Preserve tone, terminology, placeholders, interpolation, and plural semantics.
5. Include accessibility labels and error states in the same review.
6. Run typecheck and tests for the changed surface (`src/lib/i18n/__tests__/locales.test.ts` checks
   every locale has the source keys and placeholders).
