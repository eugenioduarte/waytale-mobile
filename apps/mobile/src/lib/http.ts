import { type AxiosInstance, create, isAxiosError } from 'axios';

import { getSupabase, getSupabaseConfig } from '@/lib/supabase/client';

/**
 * The app's only HTTP client (EPIC-01.11): Axios, for the backend endpoints supabase-js doesn't
 * cover — the Edge Functions. `fetch` and `axios` are lint errors anywhere else.
 *
 * - Base URL `<EXPO_PUBLIC_SUPABASE_URL>/functions/v1`: pointing that env var at Mockoon
 *   (`pnpm mockoon`) moves this client, auth and sync to the mock together.
 * - Auth interceptor: the publishable key plus, when signed in, the user's access token (Edge
 *   Functions with `auth: 'user'` run under the user's RLS).
 * - Error interceptor: every failure becomes an `HttpError` with a `kind` the UI can act on.
 *
 * Responses are external data: validate them (zod or equivalent) before use.
 */

export type HttpErrorKind = 'network' | 'timeout' | 'unauthorized' | 'client' | 'server';

export class HttpError extends Error {
  constructor(
    readonly kind: HttpErrorKind,
    readonly status: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  /** Worth trying again later: offline, slow, or the server's fault. */
  get retryable(): boolean {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }
}

function toHttpError(error: unknown): HttpError {
  if (!isAxiosError(error)) {
    return new HttpError('network', null, error instanceof Error ? error.message : String(error));
  }
  const status = error.response?.status ?? null;
  if (status === null) {
    const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
    return new HttpError(timedOut ? 'timeout' : 'network', null, error.message);
  }
  if (status === 401 || status === 403) return new HttpError('unauthorized', status, error.message);
  if (status >= 500) return new HttpError('server', status, error.message);
  return new HttpError('client', status, error.message);
}

export type HttpClientOptions = {
  baseURL: string;
  /** Sent as `apikey` — the Supabase gateway wants it on every request. */
  apiKey: string;
  /** The signed-in user's JWT, or null when signed out. */
  getAccessToken: () => Promise<string | null>;
  timeoutMs?: number;
};

export function createHttpClient({
  baseURL,
  apiKey,
  getAccessToken,
  timeoutMs = 15_000,
}: HttpClientOptions): AxiosInstance {
  const instance = create({
    baseURL,
    timeout: timeoutMs,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  });

  instance.interceptors.request.use(async (config) => {
    config.headers.set('apikey', apiKey);
    const token = await getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    return config;
  });

  instance.interceptors.response.use(undefined, (error: unknown) =>
    Promise.reject(toHttpError(error)),
  );

  return instance;
}

let client: AxiosInstance | null = null;

/** The app's instance, created on first use from the Supabase env (see `getSupabaseConfig`). */
export function getHttp(): AxiosInstance {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config)
    throw new Error('HTTP client needs EXPO_PUBLIC_SUPABASE_URL and its publishable key');
  client = createHttpClient({
    baseURL: `${config.url}/functions/v1`,
    apiKey: config.publishableKey,
    getAccessToken: async () => {
      const { data } = await getSupabase().auth.getSession();
      return data.session?.access_token ?? null;
    },
  });
  return client;
}
