import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { gradeProduceFromPhoto } from '@/lib/services/gradingService';
import { uploadProducePhoto } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;

  try {
    const body = await request.json();
    const { photoBase64, mimeType, crop } = body as {
      photoBase64?: string;
      mimeType?: string;
      crop?: string;
    };

    if (!photoBase64) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_PHOTO', message: 'photoBase64 is required' },
        { status: 400 }
      );
    }

    const mime = mimeType || 'image/jpeg';

    // 1. Grade the produce with Gemini Vision (or mock fallback)
    const gradeResult = await gradeProduceFromPhoto(photoBase64, mime);

    // 2. Upload photo to Supabase Storage (non-blocking — don't fail grading if upload fails)
    const ext = mime.split('/')[1] || 'jpg';
    const userId = result.user?.clerkUserId || 'unknown';
    const fileName = `${userId}/${crop || 'produce'}-${randomUUID()}.${ext}`;
    const photoUrl = await uploadProducePhoto(photoBase64, mime, fileName);

    return NextResponse.json({
      ok: true,
      data: {
        ...gradeResult,
        photoUrl, // null if Supabase not configured
      },
    });
  } catch (error: unknown) {
    console.error('Grading error:', error);
    return NextResponse.json(
      { ok: false, error: 'GRADING_FAILED', message: 'Failed to grade produce' },
      { status: 500 }
    );
  }
}
