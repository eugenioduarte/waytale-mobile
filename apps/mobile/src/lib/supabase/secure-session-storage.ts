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
 * Supabase auth storage: the traveller signs in once and stays signed in, and only the refresh
 * token survives an app restart.
 *
 * - **In memory**, for this app run: the full session, so requests reuse the access token until
 *   it nears expiry instead of refreshing on every call.
 * - **On disk**: only `{ refresh_token, user: { id } }`, encrypted. On the next launch it comes
 *   back as an already-expired session, so supabase-js exchanges the refresh token for a fresh
 *   access token before any request. Offline, that refresh fails as retryable and supabase-js
 *   keeps the stored session, so the traveller stays signed in until the network is back.
 *   Refresh tokens rotate (`enable_refresh_token_rotation`), so each refresh overwrites the
 *   stored one.
 *
 * Encryption: SecureStore caps values at 2048 bytes, so this is Supabase's "LargeSecureStore"
 * pattern, with authenticated encryption:
 * - a random AES-256 key lives in SecureStore (Keychain / Keystore, this device only);
 * - the value is sealed with AES-GCM and the sealed blob goes to AsyncStorage;
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

type StoredSession = { refresh_token: string; user?: { id: string } };

function isSession(value: unknown): value is Record<string, unknown> & StoredSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { refresh_token?: unknown }).refresh_token === 'string'
  );
}

function parse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Session → what goes to disk: the refresh token and the user id, nothing else. */
function toDisk(value: string): string {
  const session = parse(value);
  if (!isSession(session)) return value; // other auth entries (e.g. a PKCE verifier) as-is
  const userId = (session.user as { id?: unknown } | undefined)?.id;
  const stored: StoredSession = {
    refresh_token: session.refresh_token,
    ...(typeof userId === 'string' ? { user: { id: userId } } : {}),
  };
  return JSON.stringify(stored);
}

/**
 * Disk → a session supabase-js accepts: `expires_at` in the past makes it refresh before use;
 * the empty access token is never sent.
 */
function fromDisk(value: string): string {
  const stored = parse(value);
  if (!isSession(stored) || 'access_token' in stored) return value;
  return JSON.stringify({
    access_token: '',
    token_type: 'bearer',
    expires_in: 0,
    expires_at: 1,
    refresh_token: stored.refresh_token,
    ...(stored.user ? { user: stored.user } : {}),
  });
}

/** This app run's values, as supabase-js wrote them. Gone when the app process ends. */
const memory = new Map<string, string>();

async function readDisk(name: string): Promise<string | null> {
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
}

export const secureSessionStorage = {
  async getItem(name: string): Promise<string | null> {
    const current = memory.get(name);
    if (current !== undefined) return current;
    const stored = await readDisk(name);
    return stored === null ? null : fromDisk(stored);
  },

  async setItem(name: string, value: string): Promise<void> {
    const sealed = await aesEncryptAsync(toBytes(toDisk(value)), await getKey(), {
      additionalData: toBytes(name),
    });
    await AsyncStorage.setItem(ENTRY_PREFIX + name, await sealed.combined('base64'));
    memory.set(name, value);
  },

  async removeItem(name: string): Promise<void> {
    memory.delete(name);
    await AsyncStorage.removeItem(ENTRY_PREFIX + name);
  },
};
