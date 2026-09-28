import type { Session, User } from '@supabase/supabase-js';

import type { SavedItem } from '@/features/saved/repository';

/**
 * Test data factories (EPIC-01.8): a valid object with sensible defaults, overridden per test with
 * only the fields the scenario is about. Ids come from a counter, so every call gives a new, stable
 * UUID and runs are deterministic.
 */

let sequence = 0;

/** A fresh UUID (v4 layout) that sorts in creation order: `00000000-0000-4000-8000-000000000001`. */
export function uuid(): string {
  sequence += 1;
  return `00000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`;
}

/** Fixed clock for factories: 2026-01-01T10:00:00Z plus `minutes`. */
export function isoAt(minutes = 0): string {
  return new Date(Date.UTC(2026, 0, 1, 10, minutes)).toISOString();
}

export function buildUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? uuid();
  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: `viajante-${id.slice(-4)}@waytale.test`,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    created_at: isoAt(),
    ...overrides,
  };
}

/** A Supabase session as auth-js receives it from `/auth/v1/verify` or `/auth/v1/token`. */
export function buildSession(overrides: Partial<Session> = {}): Session {
  const user = overrides.user ?? buildUser();
  return {
    access_token: `access-${user.id}`,
    refresh_token: `refresh-${user.id}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user,
    ...overrides,
  };
}

export function buildSavedItem(overrides: Partial<SavedItem> = {}): SavedItem {
  return {
    id: uuid(),
    user_id: uuid(),
    item_type: 'route',
    item_id: uuid(),
    created_at: isoAt(),
    ...overrides,
  };
}
