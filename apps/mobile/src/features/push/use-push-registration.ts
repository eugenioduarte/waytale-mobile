import { useEffect } from 'react';

import { onPushTokenRefresh } from '@/lib/firebase';
import { useSessionStore } from '@/stores/session.store';

import { registerThisDevice } from './device';

/**
 * Keeps this device registered for the signed-in user: on launch, on sign-in, and whenever FCM
 * rotates the token. Mount once, in the root layout.
 */
export function usePushRegistration(): void {
  const userId = useSessionStore((state) => state.user?.id ?? null);

  useEffect(() => {
    if (!userId) return;
    let unsubscribe = () => {};
    let active = true;
    void registerThisDevice();
    void onPushTokenRefresh(() => void registerThisDevice()).then((stop) => {
      if (active) unsubscribe = stop;
      else stop();
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);
}
