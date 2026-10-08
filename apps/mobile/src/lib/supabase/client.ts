// supabase-js reads `URL#hostname`, which React Native's built-in URL does not implement.
import 'react-native-url-polyfill/auto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { secureSessionStorage } from './secure-session-storage';

// Read statically so Expo inlines them at build time (see apps/mobile/.env.example).
const isBackendDisabled = process.env.EXPO_PUBLIC_BACKEND_DISABLED === 'true';
const supabaseUrl = isBackendDisabled ? undefined : process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = isBackendDisabled
  ? undefined
  : process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** False until `apps/mobile/.env.local` is filled in — the app then stays in preview mode. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

/**
 * Where the backend lives: Supabase, or the Mockoon mock (`pnpm mockoon`) that answers on the same
 * paths — switching `EXPO_PUBLIC_SUPABASE_URL` moves auth, sync and the HTTP client together.
 */
export function getSupabaseConfig(): { url: string; publishableKey: string } | null {
  return supabaseUrl && supabasePublishableKey
    ? { url: supabaseUrl, publishableKey: supabasePublishableKey }
    : null;
}

let client: SupabaseClient | null = null;

/**
 * The app's single Supabase client, created on first use.
 *
 * - The session is persisted encrypted (`secureSessionStorage`) on iOS/Android; the web build
 *   uses supabase-js's default browser storage, since SecureStore has no web implementation.
 * - Tokens refresh automatically while the app is in the foreground only, as Supabase
 *   recommends for React Native.
 * - Only the publishable key ships in the bundle; never the service role / secret key.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      'Supabase is not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in apps/mobile/.env.local',
    );
  }

  const isNative = Platform.OS !== 'web';
  const created = createClient(supabaseUrl, supabasePublishableKey, {
    auth: {
      ...(isNative ? { storage: secureSessionStorage } : {}),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  if (isNative) {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') void created.auth.startAutoRefresh();
      else void created.auth.stopAutoRefresh();
    });
  }

  client = created;
  return created;
}
