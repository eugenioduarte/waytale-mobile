import type { SupabaseClient } from '@supabase/supabase-js';

export type RemoteRow = Record<string, unknown>;

/** Keyset position: rows strictly after `(updatedAt, id)` in `order by updated_at, id`. */
export type PullAfter = { updatedAt: string; id: string };

/**
 * What the sync layer needs from the server. Implemented over supabase-js (PostgREST, with the
 * user's session, so every call goes through the RLS of 01.5); tests use an in-memory fake.
 */
export type SyncRemote = {
  upsert(
    table: string,
    rows: RemoteRow[],
    options: { onConflict: string; ignoreDuplicates?: boolean },
  ): Promise<void>;
  update(table: string, match: RemoteRow, patch: RemoteRow): Promise<void>;
  /** Up to `limit` rows after `after` (all rows when `null`), in `updated_at, id` order. */
  pull(table: string, after: PullAfter | null, limit: number): Promise<RemoteRow[]>;
};

/**
 * `retryable`: no network, a timeout, the server or rate limit — try the same call again later.
 * Otherwise the server rejected the data itself (constraint, RLS), and retrying can't help.
 */
export class SyncRemoteError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'SyncRemoteError';
  }
}

/** Smallest uuid: `(t, NIL_ID)` as a keyset position means "every row at time t and after". */
export const NIL_ID = '00000000-0000-0000-0000-000000000000';

type Result = { error: { message: string; code?: string } | null; status: number };

function check({ error, status }: Result): void {
  if (!error) return;
  // postgrest-js reports a failed fetch (offline, DNS, TLS) as status 0. 401 is an expired or
  // missing session: supabase-js refreshes it, so the next attempt can succeed.
  const retryable =
    status === 0 || status === 401 || status === 408 || status === 429 || status >= 500;
  throw new SyncRemoteError(
    `${error.code ? `${error.code}: ` : ''}${error.message}`,
    retryable,
    status,
  );
}

export function createSupabaseRemote(getClient: () => SupabaseClient): SyncRemote {
  return {
    async upsert(table, rows, { onConflict, ignoreDuplicates = false }) {
      check(await getClient().from(table).upsert(rows, { onConflict, ignoreDuplicates }));
    },

    async update(table, match, patch) {
      check(await getClient().from(table).update(patch).match(match));
    },

    async pull(table, after, limit) {
      let query = getClient()
        .from(table)
        .select('*')
        .order('updated_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(limit);
      if (after) {
        // Quoted: timestamps carry `:`, `.` and `+`, which PostgREST's filter grammar reserves.
        const at = `"${after.updatedAt}"`;
        query = query.or(`updated_at.gt.${at},and(updated_at.eq.${at},id.gt.${after.id})`);
      }
      const result = await query;
      check(result);
      return (result.data ?? []) as RemoteRow[];
    },
  };
}
