import { describe, expect, it } from '@jest/globals';

import {
  getPushToken,
  hasPushPermission,
  onPushTokenRefresh,
  requestPushPermission,
  setDataCollectionEnabled,
  track,
} from '@/lib/firebase';

// No mocks on purpose: Jest, like Expo Go, has no React Native Firebase native modules.
describe('without Firebase in the build', () => {
  it('every call is a harmless no-op', async () => {
    await expect(setDataCollectionEnabled(true)).resolves.toBeUndefined();
    await expect(track('route_started', { route_id: 'r1' })).resolves.toBeUndefined();
    await expect(requestPushPermission()).resolves.toBe(false);
    await expect(hasPushPermission()).resolves.toBe(false);
    await expect(getPushToken()).resolves.toBeNull();
    const unsubscribe = await onPushTokenRefresh(() => {});
    expect(() => unsubscribe()).not.toThrow();
  });
});
