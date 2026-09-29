import {
  addMilliseconds,
  formatDistanceToNowStrict,
  formatDuration as formatDurationFns,
  hoursToMinutes,
  intlFormat,
  isAfter,
  isValid,
  parseISO,
} from 'date-fns';
import { enGB, es, type Locale, pt } from 'date-fns/locale';

import type { AppLanguage } from '@/lib/i18n/languages';

/**
 * Every date the app reads, writes or shows goes through here (EPIC-01.11): `Date`, `Date.now()`
 * and `Intl` are lint errors anywhere else. One clock to fake in tests, one place that knows the
 * wire format (ISO 8601 UTC, as Postgres `timestamptz` and SQLite text store it) and one place
 * that knows how each language writes dates.
 */

/** An ISO 8601 UTC timestamp, e.g. `2026-01-01T10:00:00.000Z`. */
export type IsoTimestamp = string;

const LOCALES: Record<AppLanguage, Locale> = { pt, en: enGB, es };

/** The current instant. `jest.useFakeTimers().setSystemTime(...)` controls it in tests. */
export function now(): Date {
  return new Date();
}

/** The current instant as stored and synced. */
export function nowIso(): IsoTimestamp {
  return now().toISOString();
}

/** Epoch milliseconds, for durations and ordering. */
export function nowMs(): number {
  return now().getTime();
}

/** Parses a stored timestamp; throws on anything that isn't ISO 8601, so bad data fails loudly. */
export function parseIso(iso: IsoTimestamp): Date {
  const date = parseISO(iso);
  if (!isValid(date)) throw new RangeError(`Not an ISO 8601 timestamp: ${iso}`);
  return date;
}

/** `iso` moved by `ms` (negative goes back), still ISO. */
export function shiftIso(iso: IsoTimestamp, ms: number): IsoTimestamp {
  return addMilliseconds(parseIso(iso), ms).toISOString();
}

/** Whether `a` is later than `b` (compares instants, not strings: offsets may differ). */
export function isAfterIso(a: IsoTimestamp, b: IsoTimestamp): boolean {
  return isAfter(parseIso(a), parseIso(b));
}

/** Route/walk duration in the app's language: `40 minutos`, `1 hora 5 minutos`, `1 hour`. */
export function formatDuration(totalMinutes: number, language: AppLanguage): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const duration = hours > 0 ? { hours, minutes: minutes - hoursToMinutes(hours) } : { minutes };
  // `zero` only so a zero-length walk still reads "0 minutos" instead of an empty string.
  return formatDurationFns(duration, { zero: minutes === 0, locale: LOCALES[language] });
}

/** How long ago / until, from now: `há 2 dias`, `2 days ago`, `hace 2 días`. */
export function formatRelative(iso: IsoTimestamp, language: AppLanguage): string {
  return formatDistanceToNowStrict(parseIso(iso), { addSuffix: true, locale: LOCALES[language] });
}

/** A calendar date as the language writes it: `1 de janeiro de 2026`, `1 January 2026`. */
export function formatDate(iso: IsoTimestamp, language: AppLanguage): string {
  return intlFormat(
    parseIso(iso),
    { day: 'numeric', month: 'long', year: 'numeric' },
    { locale: LOCALES[language].code },
  );
}
