import { afterEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../secure-session-storage', () => ({ secureSessionStorage: {} }));

describe('Supabase build configuration', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it('disables the backend in preview even when credentials exist', () => {
    process.env.EXPO_PUBLIC_BACKEND_DISABLED = 'true';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    jest.isolateModules(() => {
      const { getSupabaseConfig, getSupabase, isSupabaseConfigured } =
        jest.requireActual<typeof import('../client')>('../client');
      expect(isSupabaseConfigured).toBe(false);
      expect(getSupabaseConfig()).toBeNull();
      expect(() => getSupabase()).toThrow('Supabase is not configured');
    });
  });

  it('keeps configured backend access outside preview', () => {
    process.env.EXPO_PUBLIC_BACKEND_DISABLED = 'false';
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    jest.isolateModules(() => {
      const { getSupabaseConfig, isSupabaseConfigured } =
        jest.requireActual<typeof import('../client')>('../client');
      expect(isSupabaseConfigured).toBe(true);
      expect(getSupabaseConfig()).toEqual({
        url: 'https://example.supabase.co',
        publishableKey: 'sb_publishable_test',
      });
    });
  });
});
