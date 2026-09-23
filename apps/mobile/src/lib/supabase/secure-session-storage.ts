import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AESEncryptionKey,
  AESKeySize,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

/**
 * Supabase auth storage that keeps the session (access + refresh tokens) encrypted at rest.
 *
 * SecureStore caps values at 2048 bytes and a session is larger, so this is Supabase's
 * "LargeSecureStore" pattern, with authenticated encryption:
 * - a random AES-256 key lives in SecureStore (Keychain / Keystore, this device only);
 * - the session is sealed with AES-GCM and the sealed blob goes to AsyncStorage;
 * - the entry name is bound as additional data, so a blob can't be replayed under another key.
 *
 * A blob that fails to decrypt (tampered, or the key was lost with a reinstall) is dropped, which
 * signs the user out instead of crashing.
 */

const KEY_ALIAS = 'waytale.session-key';
const ENTRY_PREFIX = 'waytale.secure.';

// AES input must be bytes. Percent-encoding makes any string pure ASCII, so each char is one byte
// and no TextDecoder (missing in Hermes) is needed on the way back.
function toBytes(value: string): Uint8Array {
  const ascii = encodeURIComponent(value);
  const bytes = new Uint8Array(ascii.length);
  for (let index = 0; index < ascii.length; index += 1) bytes[index] = ascii.charCodeAt(index);
  return bytes;
}

function fromBytes(bytes: Uint8Array): string {
  let ascii = '';
  for (const byte of bytes) ascii += String.fromCharCode(byte);
  return decodeURIComponent(ascii);
}

let keyPromise: Promise<AESEncryptionKey> | null = null;

async function loadOrCreateKey(): Promise<AESEncryptionKey> {
  const stored = await SecureStore.getItemAsync(KEY_ALIAS);
  if (stored) return AESEncryptionKey.import(stored, 'hex');

  const key = await AESEncryptionKey.generate(AESKeySize.AES256);
  await SecureStore.setItemAsync(KEY_ALIAS, await key.encoded('hex'), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  });
  return key;
}

function getKey(): Promise<AESEncryptionKey> {
  keyPromise ??= loadOrCreateKey().catch((error: unknown) => {
    keyPromise = null;
    throw error;
  });
  return keyPromise;
}

export const secureSessionStorage = {
  async getItem(name: string): Promise<string | null> {
    const sealed = await AsyncStorage.getItem(ENTRY_PREFIX + name);
    if (sealed === null) return null;
    // Outside the try: a key that can't be read right now (e.g. before first unlock) must not
    // cost the user their session — only a blob that fails to decrypt is dropped.
    const key = await getKey();
    try {
      const plaintext = await aesDecryptAsync(AESSealedData.fromCombined(sealed), key, {
        additionalData: toBytes(name),
      });
      return fromBytes(plaintext);
    } catch {
      await AsyncStorage.removeItem(ENTRY_PREFIX + name);
      return null;
    }
  },

  async setItem(name: string, value: string): Promise<void> {
    const sealed = await aesEncryptAsync(toBytes(value), await getKey(), {
      additionalData: toBytes(name),
    });
    await AsyncStorage.setItem(ENTRY_PREFIX + name, await sealed.combined('base64'));
  },

  async removeItem(name: string): Promise<void> {
    await AsyncStorage.removeItem(ENTRY_PREFIX + name);
  },
};
