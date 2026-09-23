import { isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * The provisional auth screens (placeholders until the auth UI story imports the design) can fake
 * a session. That shortcut exists only in development or before Supabase is configured — a
 * release build with Supabase must go through real phone auth.
 */
export const canUsePreviewAuth = __DEV__ || !isSupabaseConfigured;
