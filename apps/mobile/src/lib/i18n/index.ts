/**
 * i18n for the app (EPIC-01.9). Copy lives in `src/i18n/<locale>.json`, keyed by feature
 * (`auth.login`, `sync.offline`); `pt.json` is the source the keys are typed from.
 *
 * Import `useTranslation` from here, not from `react-i18next`: importing this module is what
 * initialises i18next, so whatever renders copy has it ready (app, tests, Storybook).
 * `useLanguageSync` (root layout) keeps it on the device language or the Profile choice.
 */
export { i18n, resources } from './instance';
export * from './languages';
export { useLanguageSync } from './use-language-sync';
export { useTranslation } from 'react-i18next';
