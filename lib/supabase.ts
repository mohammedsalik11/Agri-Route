/**
 * Supabase client for storage operations only.
 * Firestore data stays on Firebase Admin.
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Server-side client with service role (full access to storage)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

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
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — skipping upload');
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
