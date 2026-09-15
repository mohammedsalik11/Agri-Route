import { NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';

export async function GET() {
  const result = await requireAnyRole();
  if (result.error) return result.error;
  return NextResponse.json({ ok: true, data: result.user });
}
