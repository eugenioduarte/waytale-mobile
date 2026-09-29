import type { SupabaseClient } from '@supabase/supabase-js';

import type { PushPlatform } from '@/lib/firebase';
import { getSupabase } from '@/lib/supabase/client';

/**
 * Where the backend finds this device (EPIC-01.12): the FCM token in `public.push_tokens`, owned
 * by the signed-in user. Registering goes through `register_push_token`, which also takes the
 * token over from a previous user of the same phone (see the migration). Network-only on purpose:
 * it's device registration, not data the UI reads, and it's retried on every launch.
 */
export function createPushRegistry(getClient: () => SupabaseClient = getSupabase) {
  return {
    async register(token: string, platform: PushPlatform): Promise<void> {
      const { error } = await getClient().rpc('register_push_token', {
        push_token: token,
        device_platform: platform,
      });
      if (error) throw new Error(`register_push_token: ${error.message}`);
    },

    /** Stops pushes to this device for the current user (before signing out). */
    async unregister(token: string): Promise<void> {
      const { error } = await getClient().from('push_tokens').delete().eq('token', token);
      if (error) throw new Error(`push_tokens delete: ${error.message}`);
    },
  };
}

export type PushRegistry = ReturnType<typeof createPushRegistry>;
