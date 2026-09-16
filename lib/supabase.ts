/**
 * Supabase client for storage operations only.
 * Firestore data stays on Firebase Admin.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const isConfigured =
  Boolean(supabaseUrl) &&
  Boolean(supabaseServiceKey) &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseServiceKey.includes('your-service-role-key');

// Server-side client with service role (full access to storage)
// Initialized safely so module evaluation never throws if env vars are missing during build
export const supabaseAdmin: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : null;

export const STORAGE_BUCKET = 'produce-photos';

/**
 * Upload a base64 image to Supabase Storage.
 * Returns the public URL or null on failure.
 */
export async function uploadProducePhoto(
  base64Data: string,
  mimeType: string,
  fileName: string
): Promise<string | null> {
  if (!supabaseAdmin) {
    console.warn('[Supabase] Missing or unconfigured SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — skipping photo upload');
    return null;
  }

  try {
    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    const { error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[Supabase] Upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (err) {
    console.error('[Supabase] Upload exception:', err);
    return null;
  }
}
