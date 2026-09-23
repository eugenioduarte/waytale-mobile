import { getSupabase } from './client';

/** Private Storage buckets (see supabase/migrations/*_storage_buckets.sql). */
export type MediaBucket = 'audio' | 'images';

const DEFAULT_EXPIRY_SECONDS = 60 * 60;

/**
 * Resolves an object key (e.g. `story_audio.audio_key`) to a time-limited signed URL. The buckets
 * are private, so this is the only way the app reaches story audio and images.
 */
export async function getSignedMediaUrl(
  bucket: MediaBucket,
  key: string,
  expiresInSeconds = DEFAULT_EXPIRY_SECONDS,
): Promise<string> {
  const { data, error } = await getSupabase()
    .storage.from(bucket)
    .createSignedUrl(key, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}
