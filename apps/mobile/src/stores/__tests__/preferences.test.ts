import { describe, expect, it, jest } from '@jest/globals';

import { migratePreferences } from '@/stores/preferences.store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('migratePreferences (persisted v0 → v1)', () => {
  it("v0's untouchable 'pt' default follows the device from now on", () => {
    expect(migratePreferences({ language: 'pt', interests: ['arte'] }, 0)).toEqual({
      language: 'system',
      interests: ['arte'],
    });
  });

  it('keeps a valid choice from a later version', () => {
    expect(migratePreferences({ language: 'es' }, 1)).toEqual({ language: 'es' });
  });

  it('an unknown or corrupt value falls back to the device', () => {
    expect(migratePreferences({ language: 'fr' }, 1)).toEqual({ language: 'system' });
    expect(migratePreferences(null, 1)).toEqual({});
  });
});
