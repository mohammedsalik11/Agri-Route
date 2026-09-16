import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { collections } from '@/lib/firebase-admin';
import farmerRegistry from '@/data/farmer-registry.json';
import wholesalerRegistry from '@/data/wholesaler-registry.json';
import driverRegistry from '@/data/driver-registry.json';

const FARMER_ID_REGEX = /^KA-[A-Z]{3}-\d{4}-\d{6}$/;
const WHOLESALER_ID_REGEX = /^WS-KA-\d{4}-\d{4}$/;
const DRIVER_ID_REGEX = /^DRV-KA-\d{4}-\d{4}$/;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'UNAUTHENTICATED', message: 'Sign in required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      role,
      name,
      idNumber,
      district,
      state,
      village,
      landSizeAcres,
      primaryCrops,
      businessName,
      gstin,
      vehicleType,
      vehicleNumber,
      vehicleCapacityKg,
      isRefrigerated,
      language,
    } = body;

    // Validate role
    if (!['farmer', 'wholesaler', 'logistics_driver'].includes(role)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_ROLE', message: 'Role must be farmer, wholesaler, or logistics_driver' },
        { status: 400 }
      );
    }

    // Validate ID format & registry
    if (role === 'farmer') {
      if (!FARMER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Farmer ID format. Expected: KA-XXX-YYYY-NNNNNN (e.g. KA-MAN-2026-004417)' },
          { status: 400 }
        );
      }

      // Check against seeded registry
      const registryMatch = (farmerRegistry as Array<{ farmerId: string }>).find(
        f => f.farmerId === idNumber
      );
      if (!registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'NOT_FOUND', message: 'Farmer ID not found in registry. Please check the ID on your Kisan ID card.' },
          { status: 404 }
        );
      }

      // Check if already claimed
      try {
        const existing = await collections.users
          .where('farmerId', '==', idNumber)
          .get();
        if (!existing.empty) {
          return NextResponse.json(
            { ok: false, error: 'ALREADY_REGISTERED', message: 'This Farmer ID is already registered to another account' },
            { status: 409 }
          );
        }
      } catch (queryErr) {
        console.warn('Duplicate farmer check failed (non-fatal):', queryErr);
      }
    } else if (role === 'wholesaler') {
      if (!WHOLESALER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Wholesaler ID format. Expected: WS-KA-YYYY-XXXX (e.g. WS-KA-2026-1183)' },
          { status: 400 }
        );
      }

      const registryMatch = (wholesalerRegistry as Array<{ wholesalerId: string }>).find(
        w => w.wholesalerId === idNumber
      );
      if (!registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'NOT_FOUND', message: 'Wholesaler ID not found in registry. Please check the ID on your APMC trader licence.' },
          { status: 404 }
        );
      }

      // Check if already claimed
      try {
        const existing = await collections.users
          .where('wholesalerId', '==', idNumber)
          .get();
        if (!existing.empty) {
          return NextResponse.json(
            { ok: false, error: 'ALREADY_REGISTERED', message: 'This Wholesaler ID is already registered to another account' },
            { status: 409 }
          );
        }
      } catch (queryErr) {
        console.warn('Duplicate wholesaler check failed (non-fatal):', queryErr);
      }
    } else if (role === 'logistics_driver') {
      if (!DRIVER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Driver ID format. Expected: DRV-KA-YYYY-XXXX (e.g. DRV-KA-2026-1042)' },
          { status: 400 }
        );
      }

      const registryMatch = (driverRegistry as Array<{ driverId: string }>).find(
        d => d.driverId === idNumber
      );
      if (!registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'NOT_FOUND', message: 'Driver ID not found in registry. Please check your commercial driver badge or transport permit.' },
          { status: 404 }
        );
      }

      // Check if already claimed
      try {
        const existing = await collections.users
          .where('driverId', '==', idNumber)
          .get();
        if (!existing.empty) {
          return NextResponse.json(
            { ok: false, error: 'ALREADY_REGISTERED', message: 'This Driver ID is already registered to another account' },
            { status: 409 }
          );
        }
      } catch (queryErr) {
        console.warn('Duplicate driver check failed (non-fatal):', queryErr);
      }
    }

    // Create user profile
    const userProfile = {
      clerkUserId: userId,
      role,
      name: name || '',
      phone: '', // Will be filled from Clerk
      language: language || 'en',
      district: district || '',
      state: state || 'Karnataka',
      verificationStatus: 'verified' as const,
      verificationSource: 'seeded-registry' as const,
      createdAt: new Date().toISOString(),
      ...(role === 'farmer'
        ? {
            farmerId: idNumber,
            village: village || '',
            landSizeAcres: landSizeAcres ? Number(landSizeAcres) : undefined,
            primaryCrops: primaryCrops || [],
          }
        : role === 'wholesaler'
        ? {
            wholesalerId: idNumber,
            businessName: businessName || '',
            gstin: gstin || '',
          }
        : {
            driverId: idNumber,
            vehicleType: vehicleType || 'truck',
            vehicleNumber: vehicleNumber || 'KA-11-E-4281',
            vehicleCapacityKg: Number(vehicleCapacityKg) || 3000,
            isRefrigerated: Boolean(isRefrigerated),
          }),
    };

    await collections.users.doc(userId).set(userProfile);

    // Update Clerk metadata
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: { role, onboarded: true },
      });
    } catch (clerkErr) {
      console.warn('Clerk metadata update warning:', clerkErr);
    }

    const response = NextResponse.json({ ok: true, data: userProfile });
    response.cookies.set('userRole', role, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: 'lax',
    });

    return response;
  } catch (error: unknown) {
    console.error('Onboarding error:', error);
    const msg = error instanceof Error ? error.message : 'Verification failed';
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: msg },
      { status: 500 }
    );
  }
}
