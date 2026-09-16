import { db, collections } from '../firebase-admin';
import { checkFairPrice, getMSP, getMandiPrice } from './fairPriceEngine';
import { FieldValue } from 'firebase-admin/firestore';

export interface CreateNegotiationData {
  poolId: string;
  crop: string;
  district: string;
  state: string;
  wholesalerId: string;
  wholesalerBusinessName: string;
  farmerId: string;
  farmerIds?: string[];
  offerPricePerKgPaise: number;
  listingPricePerKgPaise: number;
  message?: string;
}

export const negotiationService = {
  async createNegotiation(data: CreateNegotiationData) {
    const { crop, district, state, offerPricePerKgPaise } = data;
    
    const msp = getMSP(crop);
    const { price: mandi } = await getMandiPrice(crop, state, district);
    
    const floor = msp !== null ? Math.max(msp, mandi.minPrice) : mandi.minPrice;
    const ceiling = Math.round(mandi.maxPrice * 1.05);

    if (offerPricePerKgPaise < floor || offerPricePerKgPaise > ceiling) {
      return { 
        ok: false, 
        message: 'Offer is outside the fair price range.',
        floor,
        ceiling
      };
    }

    const docRef = db.collection('negotiations').doc();
    const negotiationId = docRef.id;

    await docRef.set({
      negotiationId,
      poolId: data.poolId,
      crop: data.crop,
      district: data.district,
      wholesalerId: data.wholesalerId,
      wholesalerBusinessName: data.wholesalerBusinessName,
      farmerId: data.farmerId,
      farmerIds: data.farmerIds || [data.farmerId],
      offerPricePerKgPaise: data.offerPricePerKgPaise,
      listingPricePerKgPaise: data.listingPricePerKgPaise,
      floorPricePerKgPaise: floor,
      ceilingPricePerKgPaise: ceiling,
      status: 'pending',
      message: data.message || '',
      createdAt: FieldValue.serverTimestamp(),
    });

    return { ok: true, negotiationId, floor, ceiling };
  },

  async getNegotiationsForFarmer(userId: string) {
    try {
      const snapshot = await db.collection('negotiations').get();
      
      const list = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            respondedAt: data.respondedAt?.toDate?.()?.toISOString() || data.respondedAt,
          };
        })
        .filter(item => {
          const rec = item as any;
          return (
            rec.farmerId === userId ||
            rec.farmerId === 'all_farmers' ||
            (Array.isArray(rec.farmerIds) && (rec.farmerIds.includes(userId) || rec.farmerIds.includes('all_farmers')))
          );
        })
        .sort((a, b) => String((b as any).createdAt).localeCompare(String((a as any).createdAt)));

      return list;
    } catch (err) {
      console.error('getNegotiationsForFarmer error:', err);
      return [];
    }
  },

  async getNegotiationsForWholesaler(userId: string) {
    try {
      const snapshot = await db.collection('negotiations')
        .where('wholesalerId', '==', userId)
        .get();
        
      const list = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            respondedAt: data.respondedAt?.toDate?.()?.toISOString() || data.respondedAt,
          };
        })
        .sort((a, b) => String((b as any).createdAt).localeCompare(String((a as any).createdAt)));

      return list;
    } catch (err) {
      console.error('getNegotiationsForWholesaler error:', err);
      return [];
    }
  },

  async respondToNegotiation(negotiationId: string, response: 'accepted' | 'declined', responderId: string) {
    const docRef = db.collection('negotiations').doc(negotiationId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { ok: false, message: 'Negotiation not found' };
    }
    
    const data = doc.data();
    if (!data) {
      return { ok: false, message: 'Invalid negotiation data' };
    }

    // Check authorization: responder can be direct farmer, in farmerIds, or a member of the pool
    let isAuthorized = false;
    if (data.farmerId === responderId) {
      isAuthorized = true;
    } else if (Array.isArray(data.farmerIds) && data.farmerIds.includes(responderId)) {
      isAuthorized = true;
    } else if (data.farmerId === 'all_farmers' || !data.farmerId) {
      // Check if responder owns any listing in this pool
      if (data.poolId) {
        try {
          const poolDoc = await collections.pools.doc(data.poolId).get();
          if (poolDoc.exists) {
            const poolData = poolDoc.data();
            const listingIds: string[] = poolData?.listingIds || [];
            if (listingIds.length > 0) {
              const listingDocs = await Promise.all(
                listingIds.map(id => collections.listings.doc(id).get())
              );
              const memberFarmerIds = listingDocs.map(d => d.data()?.farmerId);
              if (memberFarmerIds.includes(responderId)) {
                isAuthorized = true;
              }
            } else {
              // Pool has no listings, allow responder
              isAuthorized = true;
            }
          } else {
            isAuthorized = true;
          }
        } catch {
          isAuthorized = true;
        }
      } else {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return { ok: false, message: 'Unauthorized' };
    }
    
    if (data.status !== 'pending') {
      return { ok: false, message: `Negotiation is already ${data.status}` };
    }

    await docRef.update({
      status: response,
      respondedAt: FieldValue.serverTimestamp(),
      respondedBy: responderId,
    });

    // If accepted, update the pool's price in Firestore to reflect the agreed offer
    if (response === 'accepted' && data.poolId) {
      try {
        await collections.pools.doc(data.poolId).update({
          poolPricePerKg: data.offerPricePerKgPaise,
        });
      } catch (err) {
        console.error('Error updating pool price on accepted offer:', err);
      }
    }

    // Notify the wholesaler of the outcome
    if (data.wholesalerId) {
      try {
        await collections.notifications.add({
          userId: data.wholesalerId,
          type: response === 'accepted' ? 'NEGOTIATION_ACCEPTED' : 'NEGOTIATION_DECLINED',
          title: response === 'accepted' ? 'Offer Accepted! 🎉' : 'Offer Declined',
          body: response === 'accepted'
            ? `Your offer of ₹${(data.offerPricePerKgPaise / 100).toFixed(2)}/kg for ${data.crop || 'produce'} was accepted by the farmer!`
            : `Your offer of ₹${(data.offerPricePerKgPaise / 100).toFixed(2)}/kg for ${data.crop || 'produce'} was declined.`,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Error sending notification to wholesaler:', err);
      }
    }

    return { ok: true, data: { ...data, status: response } };
  }
};
