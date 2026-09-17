import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/auth';
import { collections } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAnyRole();
  if (result.error) return result.error;

  const { id: rawId } = await params;

  try {
    const candidateIds = Array.from(new Set([rawId, decodeURIComponent(rawId || '')]));
    let poolDoc = null;
    for (const cid of candidateIds) {
      const doc = await collections.pools.doc(cid).get();
      if (doc.exists) {
        poolDoc = doc;
        break;
      }
    }
    if (!poolDoc) {
      for (const cid of candidateIds) {
        const snap = await collections.pools.where('poolId', '==', cid).limit(1).get();
        if (!snap.empty) {
          poolDoc = snap.docs[0];
          break;
        }
      }
    }

    if (!poolDoc || !poolDoc.exists) {
      return NextResponse.json(
        { ok: false, error: 'NOT_FOUND', message: 'Pool not found' },
        { status: 404 }
      );
    }

    const pool = poolDoc.data()!;

    // Fetch member listings for breakdown
    const listingDocs = await Promise.all(
      (pool.listingIds || []).map((lid: string) => collections.listings.doc(lid).get())
    );
    const members = listingDocs
      .filter(d => d.exists)
      .map(d => {
        const data = d.data()!;
        return {
          listingId: data.listingId,
          farmerName: data.farmerName,
          quantityKg: data.quantityKg,
          askPricePerKg: data.askPricePerKg,
          qualityGrade: data.qualityGrade,
          lat: data.lat,
          lng: data.lng,
        };
      });

    return NextResponse.json({
      ok: true,
      data: { ...pool, members },
    });
  } catch (error: unknown) {
    console.error('Get pool detail error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Failed to fetch pool' },
      { status: 500 }
    );
  }
}
