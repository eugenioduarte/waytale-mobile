import { describe, expect, it } from '@jest/globals';

import { resources } from '@/lib/i18n/instance';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n/languages';

type Copy = { [key: string]: string | Copy };

/** `{ auth: { login: 'Login' } }` → `[['auth.login', 'Login']]`. */
function entries(copy: Copy, prefix = ''): [string, string][] {
  return Object.entries(copy).flatMap(([key, value]) =>
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : entries(value, `${prefix}${key}.`),
  );
}

const placeholders = (text: string) => text.match(/{{\s*\w+\s*}}/g)?.sort() ?? [];

// `pt.json` is the source: the keys are typed from it, so a key missing elsewhere would only
// show up at runtime, as English fallback copy.
const source = new Map(entries(resources.pt.translation));

describe.each(SUPPORTED_LANGUAGES.map((language) => [language]))('%s', (language) => {
  const copy = new Map(entries(resources[language].translation));

  it('has exactly the keys of the source locale', () => {
    expect([...copy.keys()].sort()).toEqual([...source.keys()].sort());
  });

  it('has no empty copy', () => {
    expect([...copy].filter(([, text]) => text.trim() === '')).toEqual([]);
  });

  it('keeps the source placeholders', () => {
    for (const [key, text] of source) {
      expect([key, placeholders(copy.get(key) ?? '')]).toEqual([key, placeholders(text)]);
    }
  });
});
