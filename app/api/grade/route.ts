import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { gradeProduceFromPhoto } from '@/lib/services/gradingService';

export async function POST(request: NextRequest) {
  const result = await requireRole('farmer');
  if (result.error) return result.error;

  try {
    const body = await request.json();
    const { photoBase64, mimeType } = body;

    if (!photoBase64) {
      return NextResponse.json(
        { ok: false, error: 'MISSING_PHOTO', message: 'photoBase64 is required' },
        { status: 400 }
      );
    }

    const gradeResult = await gradeProduceFromPhoto(photoBase64, mimeType || 'image/jpeg');
    return NextResponse.json({ ok: true, data: gradeResult });
  } catch (error: unknown) {
    console.error('Grading error:', error);
    return NextResponse.json(
      { ok: false, error: 'GRADING_FAILED', message: 'Failed to grade produce' },
      { status: 500 }
    );
  }
}
