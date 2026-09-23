import { NextRequest, NextResponse } from 'next/server';
import { requireRole, requireAnyRole } from '@/lib/auth';
import { getOwnerFacilities, createStorageFacility } from '@/lib/services/coldStorageService';

// GET /api/storage/facilities - List facilities owned by the authenticated user
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAnyRole();
    if (authResult.error) return authResult.error;
    const profile = authResult.user;

    const facilities = await getOwnerFacilities(profile.clerkUserId);
    return NextResponse.json({ success: true, facilities });
  } catch (error: any) {
    console.error('GET /api/storage/facilities error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch facilities' }, { status: 500 });
  }
}

// POST /api/storage/facilities - Create/Register a new cold storage facility
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole('storage_owner');
    if (authResult.error) return authResult.error;
    const profile = authResult.user;

    const body = await req.json();

    const {
      name,
      operator,
      district,
      state,
      totalCapacityKg,
      pricePerKgPerDay,
      contactPhone,
      licenseNumber,
      suitableCrops,
      tempMin,
      tempMax,
      address,
      features,
    } = body;

    if (!name || !district || !totalCapacityKg || !pricePerKgPerDay || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required facility fields (name, district, totalCapacityKg, pricePerKgPerDay, contactPhone)' },
        { status: 400 }
      );
    }

    const facility = await createStorageFacility({
      name,
      operator: operator || profile.name,
      district,
      state: state || 'Karnataka',
      totalCapacityKg: Number(totalCapacityKg),
      availableCapacityKg: Number(totalCapacityKg),
      pricePerKgPerDay: Number(pricePerKgPerDay),
      contactPhone,
      ownerId: profile.clerkUserId,
      licenseNumber: licenseNumber || profile.licenseNumber,
      suitableCrops: Array.isArray(suitableCrops) && suitableCrops.length > 0 ? suitableCrops : ['tomato', 'potato', 'onion', 'vegetables', 'fruits'],
      tempRangeC: [Number(tempMin) || 2, Number(tempMax) || 8],
      address: address || profile.facilityAddress || `${district} APMC Cold Storage Terminal`,
      features: Array.isArray(features) ? features : ['24/7 Power Backup', 'WDRA Certified', 'AIF Subsidy Eligible'],
    });

    return NextResponse.json({ success: true, facility }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/storage/facilities error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create storage facility' }, { status: 400 });
  }
}
