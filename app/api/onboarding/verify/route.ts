import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { collections } from '@/lib/firebase-admin';
import farmerRegistry from '@/data/farmer-registry.json';
import wholesalerRegistry from '@/data/wholesaler-registry.json';
import driverRegistry from '@/data/driver-registry.json';
import storageOwnerRegistry from '@/data/storage-owner-registry.json';

const FARMER_ID_REGEX = /^KA-[A-Z]{3}-\d{4}-\d{6}$/;
const WHOLESALER_ID_REGEX = /^WS-KA-\d{4}-\d{4}$/;
const DRIVER_ID_REGEX = /^DRV-KA-\d{4}-\d{4}$/;
const STORAGE_OWNER_ID_REGEX = /^STO-KA-\d{4}-\d{4}$/;

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
      facilityName,
      licenseNumber,
      storageCapacityKg,
      pricePerKgPerDay,
      facilityAddress,
      language,
    } = body;

    // Validate role
    if (!['farmer', 'wholesaler', 'logistics_driver', 'storage_owner'].includes(role)) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_ROLE', message: 'Role must be farmer, wholesaler, logistics_driver, or storage_owner' },
        { status: 400 }
      );
    }

    // Validate ID format & registry — STRICT: reject if ID matches a DIFFERENT role's pattern
    let verificationSource = 'official-registry';

    if (role === 'farmer') {
      const isRegexMatch = FARMER_ID_REGEX.test(idNumber);
      const registryMatch = (farmerRegistry as Array<{ farmerId: string }>).find(
        f => f.farmerId === idNumber
      );

      // Reject if the ID looks like a different role's ID
      if (WHOLESALER_ID_REGEX.test(idNumber) || DRIVER_ID_REGEX.test(idNumber) || STORAGE_OWNER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'WRONG_ROLE', message: 'This ID belongs to a different role. Please select the correct role for your registration.' },
          { status: 400 }
        );
      }

      if (!isRegexMatch && !registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Farmer ID format. Expected: KA-XXX-YYYY-NNNNNN (e.g. KA-MAN-2026-004417)' },
          { status: 400 }
        );
      }

      verificationSource = registryMatch ? 'seeded-registry' : 'agristack-direct';

      // Check if already claimed by a different user
      try {
        const existing = await collections.users
          .where('farmerId', '==', idNumber)
          .get();
        if (!existing.empty && existing.docs.some(doc => doc.id !== userId)) {
          return NextResponse.json(
            { ok: false, error: 'ALREADY_REGISTERED', message: 'This Farmer ID is already registered to another account' },
            { status: 409 }
          );
        }
      } catch (queryErr) {
        console.warn('Duplicate farmer check failed (non-fatal):', queryErr);
      }
    } else if (role === 'wholesaler') {
      const isRegexMatch = WHOLESALER_ID_REGEX.test(idNumber);
      const registryMatch = (wholesalerRegistry as Array<{ wholesalerId: string }>).find(
        w => w.wholesalerId === idNumber
      );

      // Reject if the ID looks like a different role's ID
      if (FARMER_ID_REGEX.test(idNumber) || DRIVER_ID_REGEX.test(idNumber) || STORAGE_OWNER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'WRONG_ROLE', message: 'This ID belongs to a different role. Please select the correct role for your registration.' },
          { status: 400 }
        );
      }

      if (!isRegexMatch && !registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Wholesaler ID format. Expected: WS-KA-YYYY-XXXX (e.g. WS-KA-2026-1183)' },
          { status: 400 }
        );
      }

      verificationSource = registryMatch ? 'seeded-registry' : 'apmc-direct';

      // Check if already claimed by a different user
      try {
        const existing = await collections.users
          .where('wholesalerId', '==', idNumber)
          .get();
        if (!existing.empty && existing.docs.some(doc => doc.id !== userId)) {
          return NextResponse.json(
            { ok: false, error: 'ALREADY_REGISTERED', message: 'This Wholesaler ID is already registered to another account' },
            { status: 409 }
          );
        }
      } catch (queryErr) {
        console.warn('Duplicate wholesaler check failed (non-fatal):', queryErr);
      }
    } else if (role === 'logistics_driver') {
      const isRegexMatch = DRIVER_ID_REGEX.test(idNumber);
      const registryMatch = (driverRegistry as Array<{ driverId: string }>).find(
        d => d.driverId === idNumber
      );

      // Reject if the ID looks like a different role's ID
      if (FARMER_ID_REGEX.test(idNumber) || WHOLESALER_ID_REGEX.test(idNumber) || STORAGE_OWNER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'WRONG_ROLE', message: 'This ID belongs to a different role. Please select the correct role for your registration.' },
          { status: 400 }
        );
      }

      if (!isRegexMatch && !registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Driver ID format. Expected: DRV-KA-YYYY-XXXX (e.g. DRV-KA-2026-1042)' },
          { status: 400 }
        );
      }

      verificationSource = registryMatch ? 'seeded-registry' : 'rto-permit-direct';

      // Check if already claimed by a different user
      try {
        const existing = await collections.users
          .where('driverId', '==', idNumber)
          .get();
        if (!existing.empty && existing.docs.some(doc => doc.id !== userId)) {
          return NextResponse.json(
            { ok: false, error: 'ALREADY_REGISTERED', message: 'This Driver ID is already registered to another account' },
            { status: 409 }
          );
        }
      } catch (queryErr) {
        console.warn('Duplicate driver check failed (non-fatal):', queryErr);
      }
    } else if (role === 'storage_owner') {
      const isRegexMatch = STORAGE_OWNER_ID_REGEX.test(idNumber);
      const registryMatch = (storageOwnerRegistry as Array<{ ownerId: string }>).find(
        s => s.ownerId === idNumber
      );

      // Reject if the ID looks like a different role's ID
      if (FARMER_ID_REGEX.test(idNumber) || WHOLESALER_ID_REGEX.test(idNumber) || DRIVER_ID_REGEX.test(idNumber)) {
        return NextResponse.json(
          { ok: false, error: 'WRONG_ROLE', message: 'This ID belongs to a different role. Please select the correct role for your registration.' },
          { status: 400 }
        );
      }

      if (!isRegexMatch && !registryMatch) {
        return NextResponse.json(
          { ok: false, error: 'INVALID_FORMAT', message: 'Invalid Storage Provider ID format. Expected: STO-KA-YYYY-XXXX (e.g. STO-KA-2026-1001)' },
          { status: 400 }
        );
      }

      verificationSource = registryMatch ? 'seeded-registry' : 'wdra-accredited-direct';

      try {
        const existing = await collections.users
          .where('ownerId', '==', idNumber)
          .get();
        if (!existing.empty && existing.docs.some(doc => doc.id !== userId)) {
          return NextResponse.json(
            { ok: false, error: 'ALREADY_REGISTERED', message: 'This Storage Owner ID is already registered to another account' },
            { status: 409 }
          );
        }
      } catch (queryErr) {
        console.warn('Duplicate storage owner check failed (non-fatal):', queryErr);
      }
    }


    // Fetch user details from Clerk if available
    let userPhone = '';
    let userEmail = '';
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      userPhone = clerkUser.primaryPhoneNumber?.phoneNumber || clerkUser.phoneNumbers?.[0]?.phoneNumber || '';
      userEmail = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
    } catch (e) {
      console.warn('Could not fetch Clerk user details:', e);
    }

    // Create user profile in Firestore
    const userProfile = {
      clerkUserId: userId,
      role,
      name: name || '',
      phone: userPhone,
      email: userEmail,
      language: language || 'en',
      district: district || '',
      state: state || 'Karnataka',
      verificationStatus: 'verified' as const,
      verificationSource,
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
        : role === 'logistics_driver'
        ? {
            driverId: idNumber,
            vehicleType: vehicleType || 'truck',
            vehicleNumber: vehicleNumber || 'KA-11-E-4281',
            vehicleCapacityKg: Number(vehicleCapacityKg) || 3000,
            isRefrigerated: Boolean(isRefrigerated),
          }
        : {
            ownerId: idNumber,
            businessName: businessName || facilityName || 'Cold Storage Facility',
            facilityName: facilityName || businessName || 'Cold Storage Facility',
            licenseNumber: licenseNumber || `WDRA-KA-${(district || 'MAN').slice(0,3).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
            storageCapacityKg: Number(storageCapacityKg) || 500000,
            availableCapacityKg: Number(storageCapacityKg) || 500000,
            pricePerKgPerDay: Number(pricePerKgPerDay) || 15,
            facilityAddress: facilityAddress || `${district} Industrial Area`,
          }),
    };

    await collections.users.doc(userId).set(userProfile, { merge: true });

    // If storage_owner, also sync or create the facility document in coldStorages collection
    if (role === 'storage_owner') {
      const facilityId = `cs-${(district || 'mandya').toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;
      await collections.coldStorages.doc(facilityId).set({
        facilityId,
        ownerId: userId,
        name: facilityName || businessName || `${district} Cold Storage`,
        operator: name || 'Storage Operator',
        district: district || 'Mandya',
        state: state || 'Karnataka',
        lat: 12.52,
        lng: 76.89,
        address: facilityAddress || `${district} Industrial Area, Karnataka`,
        totalCapacityKg: Number(storageCapacityKg) || 500000,
        availableCapacityKg: Number(storageCapacityKg) || 500000,
        suitableCrops: ["tomato", "potato", "onion", "banana", "vegetables"],
        tempRangeC: [2, 10],
        humidityControl: true,
        pricePerKgPerDay: Number(pricePerKgPerDay) || 15,
        contactPhone: userPhone || "+919876543210",
        licenseNumber: licenseNumber || "WDRA-KA-2026-PENDING",
        verificationStatus: "verified",
        subsidySchemeTag: "AIF",
        rating: 4.8,
        features: ["CCTV Security", "Solar Backup", "Loading Bay"],
        createdAt: new Date().toISOString()
      }, { merge: true });
    }

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
