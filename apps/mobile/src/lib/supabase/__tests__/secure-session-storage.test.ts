import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Keychain/Keystore stand-in.
jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    __clear: () => values.clear(),
  };
});

// expo-crypto's AES API is native; this stand-in does real AES-256-GCM with Node's crypto.
jest.mock('expo-crypto', () => {
  const crypto = jest.requireActual<typeof import('node:crypto')>('node:crypto');
  const IV = 12;
  const TAG = 16;

  class AESEncryptionKey {
    raw: Buffer;
    constructor(raw: Buffer) {
      this.raw = raw;
    }
    static async generate() {
      return new AESEncryptionKey(crypto.randomBytes(32));
    }
    static async import(encoded: string, encoding: 'hex') {
      return new AESEncryptionKey(Buffer.from(encoded, encoding));
    }
    async encoded(encoding: 'hex') {
      return this.raw.toString(encoding);
    }
  }

  class AESSealedData {
    bytes: Buffer;
    constructor(bytes: Buffer) {
      this.bytes = bytes;
    }
    static fromCombined(base64: string) {
      return new AESSealedData(Buffer.from(base64, 'base64'));
    }
    async combined(encoding: 'base64') {
      return this.bytes.toString(encoding);
    }
  }

  return {
    AESKeySize: { AES256: 256 },
    AESEncryptionKey,
    AESSealedData,
    aesEncryptAsync: async (
      plaintext: Uint8Array,
      key: AESEncryptionKey,
      options: { additionalData: Uint8Array },
    ) => {
      const iv = crypto.randomBytes(IV);
      const cipher = crypto.createCipheriv('aes-256-gcm', key.raw, iv);
      cipher.setAAD(options.additionalData);
      const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      return new AESSealedData(Buffer.concat([iv, body, cipher.getAuthTag()]));
    },
    aesDecryptAsync: async (
      sealed: AESSealedData,
      key: AESEncryptionKey,
      options: { additionalData: Uint8Array },
    ) => {
      const { bytes } = sealed;
      const decipher = crypto.createDecipheriv('aes-256-gcm', key.raw, bytes.subarray(0, IV));
      decipher.setAAD(options.additionalData);
      decipher.setAuthTag(bytes.subarray(bytes.length - TAG));
      return new Uint8Array(
        Buffer.concat([decipher.update(bytes.subarray(IV, bytes.length - TAG)), decipher.final()]),
      );
    },
  };
});

type Storage = typeof import('@/lib/supabase/secure-session-storage').secureSessionStorage;

/**
 * A fresh module instance = a fresh app launch (no cached key in memory). The mocked native
 * modules above stay shared across launches because this file imports them at the top level,
 * which puts them in the main registry that `isolateModules` falls back to — like a real device,
 * where the Keychain and AsyncStorage outlive the JS runtime.
 */
function launchApp(): Storage {
  let storage: Storage | undefined;
  jest.isolateModules(() => {
    storage = jest.requireActual<typeof import('@/lib/supabase/secure-session-storage')>(
      '@/lib/supabase/secure-session-storage',
    ).secureSessionStorage;
  });
  return storage!;
}

const SESSION = JSON.stringify({
  access_token: 'eyJhbGciOiJIUzI1NiJ9.secret-access',
  refresh_token: 'secret-refresh',
  user: { id: 'user-a', user_metadata: { name: 'Inês Conceição' } },
});
const KEY = 'sb-iqmnbzgsqmmalqzdyxjg-auth-token';

beforeEach(async () => {
  await AsyncStorage.clear();
  (SecureStore as unknown as { __clear: () => void }).__clear();
  jest.mocked(SecureStore.setItemAsync).mockClear();
});

describe('secureSessionStorage', () => {
  it('round-trips a session, including non-ASCII text', async () => {
    const storage = launchApp();
    await storage.setItem(KEY, SESSION);

    await expect(storage.getItem(KEY)).resolves.toBe(SESSION);
  });

  it('never writes the tokens to AsyncStorage in plaintext', async () => {
    await launchApp().setItem(KEY, SESSION);

    const everything = JSON.stringify(await AsyncStorage.multiGet(await AsyncStorage.getAllKeys()));
    expect(everything).not.toContain('secret-refresh');
    expect(everything).not.toContain('secret-access');
  });

  it('keeps the key in SecureStore, device-only, and reuses it on the next launch', async () => {
    await launchApp().setItem(KEY, SESSION);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
    expect(jest.mocked(SecureStore.setItemAsync).mock.calls[0]![2]).toEqual({
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });

    await expect(launchApp().getItem(KEY)).resolves.toBe(SESSION);
    expect(SecureStore.setItemAsync).toHaveBeenCalledTimes(1);
  });

  it('drops a blob moved under another entry name (bound as additional data)', async () => {
    const storage = launchApp();
    await storage.setItem(KEY, SESSION);
    const sealed = await AsyncStorage.getItem(`waytale.secure.${KEY}`);
    await AsyncStorage.setItem('waytale.secure.other-entry', sealed!);

    await expect(storage.getItem('other-entry')).resolves.toBeNull();
    await expect(AsyncStorage.getItem('waytale.secure.other-entry')).resolves.toBeNull();
  });

  it('drops a session it can no longer decrypt (key lost on reinstall) instead of crashing', async () => {
    await launchApp().setItem(KEY, SESSION);
    (SecureStore as unknown as { __clear: () => void }).__clear();

    await expect(launchApp().getItem(KEY)).resolves.toBeNull();
  });

  it('keeps the session when the key is temporarily unreadable (e.g. before first unlock)', async () => {
    await launchApp().setItem(KEY, SESSION);
    jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('keychain locked'));

    await expect(launchApp().getItem(KEY)).rejects.toThrow('keychain locked');
    await expect(launchApp().getItem(KEY)).resolves.toBe(SESSION);
  });

  it('removes a session', async () => {
    const storage = launchApp();
    await storage.setItem(KEY, SESSION);
    await storage.removeItem(KEY);

    await expect(storage.getItem(KEY)).resolves.toBeNull();
  });
});
