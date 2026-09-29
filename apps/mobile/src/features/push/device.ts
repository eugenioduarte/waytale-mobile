import { getPushToken, hasPushPermission, recordError } from '@/lib/firebase';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/session.store';

import { createPushRegistry, type PushRegistry } from './registry';

type Dependencies = {
  registry: PushRegistry;
  /** Only a real Supabase user can own a token — not the navigation preview. */
  canRegister: () => boolean;
};

const defaults = (): Dependencies => ({
  registry: createPushRegistry(),
  canRegister: () => isSupabaseConfigured && useSessionStore.getState().user !== null,
});

/**
 * Registers this device for pushes if notifications are allowed. Safe to call any time (launch,
 * sign-in, right after the permission prompt): it never throws, and a failure is only reported
 * to Crashlytics — the next launch tries again.
 */
export async function registerThisDevice(deps: Dependencies = defaults()): Promise<void> {
  if (!(await hasPushPermission())) return;
  const device = await getPushToken();
  if (!device) return;
  // Paste it in the Firebase console › Messaging › "Send test message".
  if (__DEV__) console.info('[push] FCM token:', device.token);
  if (!deps.canRegister()) return;
  try {
    await deps.registry.register(device.token, device.platform);
  } catch (error) {
    void recordError(error, 'push: register');
  }
}

/** Stops pushes to this device for the user signing out. Best effort: never blocks sign-out. */
export async function unregisterThisDevice(deps: Dependencies = defaults()): Promise<void> {
  if (!deps.canRegister()) return;
  const device = await getPushToken();
  if (!device) return;
  try {
    await deps.registry.unregister(device.token);
  } catch (error) {
    void recordError(error, 'push: unregister');
  }
}
