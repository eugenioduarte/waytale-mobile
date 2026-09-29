import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { registerThisDevice, unregisterThisDevice } from '@/features/push/device';
import type { PushRegistry } from '@/features/push/registry';
import { getPushToken, hasPushPermission, recordError } from '@/lib/firebase';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
// The device side of push: Firebase replaced locally (there is no native module in Jest).
jest.mock('@/lib/firebase', () => ({
  hasPushPermission: jest.fn(),
  getPushToken: jest.fn(),
  recordError: jest.fn(),
}));
jest.mock('@/lib/supabase/client', () => ({ isSupabaseConfigured: false, getSupabase: jest.fn() }));

const permission = jest.mocked(hasPushPermission);
const token = jest.mocked(getPushToken);
const reportError = jest.mocked(recordError);

function fakeRegistry() {
  return {
    register: jest.fn<PushRegistry['register']>(async () => {}),
    unregister: jest.fn<PushRegistry['unregister']>(async () => {}),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  permission.mockResolvedValue(true);
  token.mockResolvedValue({ token: 'fcm-token-1', platform: 'android' });
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

describe('registerThisDevice', () => {
  it("registers the device's token for the signed-in user", async () => {
    const registry = fakeRegistry();

    await registerThisDevice({ registry, canRegister: () => true });

    expect(registry.register).toHaveBeenCalledWith('fcm-token-1', 'android');
  });

  it('does nothing without notification permission', async () => {
    permission.mockResolvedValue(false);
    const registry = fakeRegistry();

    await registerThisDevice({ registry, canRegister: () => true });

    expect(token).not.toHaveBeenCalled();
    expect(registry.register).not.toHaveBeenCalled();
  });

  it('in preview (no Supabase user) only gets the token, to test from the Firebase console', async () => {
    const registry = fakeRegistry();

    await registerThisDevice({ registry, canRegister: () => false });

    expect(token).toHaveBeenCalled();
    expect(registry.register).not.toHaveBeenCalled();
  });

  it('a failed registration is reported, never thrown', async () => {
    const registry = fakeRegistry();
    registry.register.mockRejectedValue(new Error('offline'));

    await expect(
      registerThisDevice({ registry, canRegister: () => true }),
    ).resolves.toBeUndefined();

    expect(reportError).toHaveBeenCalledWith(expect.any(Error), 'push: register');
  });
});

describe('unregisterThisDevice', () => {
  it("removes this device's token", async () => {
    const registry = fakeRegistry();

    await unregisterThisDevice({ registry, canRegister: () => true });

    expect(registry.unregister).toHaveBeenCalledWith('fcm-token-1');
  });

  it('never blocks sign-out when the server is unreachable', async () => {
    const registry = fakeRegistry();
    registry.unregister.mockRejectedValue(new Error('offline'));

    await expect(
      unregisterThisDevice({ registry, canRegister: () => true }),
    ).resolves.toBeUndefined();

    expect(reportError).toHaveBeenCalledWith(expect.any(Error), 'push: unregister');
  });

  it('without a Supabase user there is nothing to remove', async () => {
    const registry = fakeRegistry();

    await unregisterThisDevice({ registry, canRegister: () => false });

    expect(registry.unregister).not.toHaveBeenCalled();
  });
});
