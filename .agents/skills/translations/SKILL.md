---
name: translations
description: Add or review React Native user-facing copy through the project's i18n system. Use for new text, edited labels, errors, accessibility copy, placeholders, pluralization, or locale formatting; not for internal logs or developer-only messages.
---

# Translations

1. Reuse a key only when meaning and context match exactly.
2. Add copy to `apps/mobile/src/locales/pt.json`; do not inline user-visible strings.
3. Preserve tone, terminology, placeholders, interpolation, and plural semantics.
4. Include accessibility labels and error states in the same review.
5. Run typecheck and tests for the changed surface.
