import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { collections } from '@/lib/firebase-admin';
import farmerRegistry from '@/data/farmer-registry.json';
import wholesalerRegistry from '@/data/wholesaler-registry.json';

const FARMER_ID_REGEX = /^KA-[A-Z]{3}-\d{4}-\d{6}$/;
const WHOLESALER_ID_REGEX = /^WS-KA-\d{4}-\d{4}$/;

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
      category,
      primaryCrops,
      businessName,
      gstin,
      language,
    } = body;

    // Validate role
    if (!['farmer', 'wholesaler'].includes(role)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_ROLE', message: 'Role must be farmer or wholesaler' },
        { status: 400 }
      );
    }

    // Validate ID format
    if (role === 'farmer') {
      if (!FARMER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Farmer ID format. Expected: KA-XXX-YYYY-ZZZZZZ' },
          { status: 400 }
        );
      }

      // Check against seeded registry
      const registryMatch = (farmerRegistry as Array<{ farmerId: string }>).find(
        f => f.farmerId === idNumber
      );
      if (!registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'NOT_FOUND', message: 'Farmer ID not found in registry' },
          { status: 404 }
        );
      }

      // Check if already claimed
      const existing = await collections.users
        .where('farmerId', '==', idNumber)
        .get();
      if (!existing.empty) {
        return NextResponse.json(
          { ok: false, error: 'ALREADY_REGISTERED', message: 'This Farmer ID is already registered' },
          { status: 409 }
        );
      }
    } else {
      if (!WHOLESALER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Wholesaler ID format. Expected: WS-KA-YYYY-XXXX' },
          { status: 400 }
        );
      }

      const registryMatch = (wholesalerRegistry as Array<{ wholesalerId: string }>).find(
        w => w.wholesalerId === idNumber
      );
      if (!registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'NOT_FOUND', message: 'Wholesaler ID not found in registry' },
          { status: 404 }
        );
      }

      const existing = await collections.users
        .where('wholesalerId', '==', idNumber)
        .get();
      if (!existing.empty) {
        return NextResponse.json(
          { ok: false, error: 'ALREADY_REGISTERED', message: 'This Wholesaler ID is already registered' },
          { status: 409 }
        );
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
            category: category || 'general',
            primaryCrops: primaryCrops || [],
          }
        : {
            wholesalerId: idNumber,
            businessName: businessName || '',
            gstin: gstin || '',
          }),
    };

    await collections.users.doc(userId).set(userProfile);

    // Update Clerk metadata
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: { role, onboarded: true },
    });

    return NextResponse.json({ ok: true, data: userProfile });
  } catch (error: unknown) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { ok: false, error: 'INTERNAL_ERROR', message: 'Verification failed' },
      { status: 500 }
    );
  }
}
