import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { matchSchemes } from '@/lib/services/schemeMatcher';

export async function GET() {
  const result = await requireRole('farmer');
  if (result.error) return result.error;

  const matched = matchSchemes(result.user);
  return NextResponse.json({ ok: true, data: matched });
}
