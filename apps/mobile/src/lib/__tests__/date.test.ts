import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
  formatDate,
  formatDuration,
  formatRelative,
  isAfterIso,
  nowIso,
  nowMs,
  parseIso,
  shiftIso,
} from '@/lib/date';
import type { AppLanguage } from '@/lib/i18n/languages';

const NOW = '2026-01-03T10:00:00.000Z';

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(parseIso(NOW));
});
afterEach(() => {
  jest.useRealTimers();
});

describe('clock', () => {
  it('is the one the tests fake', () => {
    expect(nowIso()).toBe(NOW);
    expect(nowMs()).toBe(parseIso(NOW).getTime());
  });
});

describe('ISO timestamps', () => {
  it('shifts a timestamp and keeps it ISO', () => {
    expect(shiftIso(NOW, -5 * 60_000)).toBe('2026-01-03T09:55:00.000Z');
  });

  it('compares instants, whatever the offset', () => {
    expect(isAfterIso('2026-01-03T10:00:00.000Z', '2026-01-03T10:30:00+01:00')).toBe(true);
  });

  it('refuses what is not ISO 8601, instead of an Invalid Date', () => {
    expect(() => parseIso('03/01/2026')).toThrow(RangeError);
  });
});

describe('formatDuration', () => {
  it.each<[number, AppLanguage, string]>([
    [40, 'pt', '40 minutos'],
    [65, 'pt', '1 hora 5 minutos'],
    [60, 'en', '1 hour'],
    [95, 'es', '1 hora 35 minutos'],
    [0, 'en', '0 minutes'],
  ])('%i min in %s → %s', (minutes, language, text) => {
    expect(formatDuration(minutes, language)).toBe(text);
  });
});

describe('formatRelative', () => {
  it('says how long ago, in each language', () => {
    const twoDaysAgo = '2026-01-01T10:00:00.000Z';
    expect(formatRelative(twoDaysAgo, 'pt')).toBe('há 2 dias');
    expect(formatRelative(twoDaysAgo, 'en')).toBe('2 days ago');
    expect(formatRelative(twoDaysAgo, 'es')).toBe('hace 2 días');
  });
});

describe('formatDate', () => {
  it('writes the date as each language does', () => {
    expect(formatDate(NOW, 'pt')).toBe('3 de janeiro de 2026');
    expect(formatDate(NOW, 'en')).toBe('3 January 2026');
    expect(formatDate(NOW, 'es')).toBe('3 de enero de 2026');
  });
});
