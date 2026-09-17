import { db, collections } from '../firebase-admin';
import { getMSP, getMandiPrice } from './fairPriceEngine';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export interface OfferHistoryItem {
  by: 'wholesaler' | 'farmer';
  byName?: string;
  pricePerKgPaise: number;
  message?: string;
  timestamp: string;
  round: number;
}

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

export interface RespondNegotiationData {
  response: 'accepted' | 'declined' | 'countered';
  counterPricePerKgPaise?: number;
  message?: string;
  responderId: string;
  responderRole: 'farmer' | 'wholesaler';
  responderName?: string;
}

export const MAX_NEGOTIATION_ROUNDS = 3;
export const NEGOTIATION_EXPIRY_HOURS = 48;

export const negotiationService = {
  async createNegotiation(data: CreateNegotiationData) {
    const { crop, district, state, offerPricePerKgPaise } = data;
    
    const msp = getMSP(crop);
    const { price: mandi } = await getMandiPrice(crop, state, district);
    
    const floor = msp !== null ? Math.max(msp, mandi.minPrice) : mandi.minPrice;
    const ceiling = Math.round(mandi.maxPrice * 1.05);
    const isOutsideFairBand = (offerPricePerKgPaise < floor || offerPricePerKgPaise > ceiling);

    const docRef = db.collection('negotiations').doc();
    const negotiationId = docRef.id;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + NEGOTIATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    const initialHistory: OfferHistoryItem = {
      by: 'wholesaler',
      byName: data.wholesalerBusinessName,
      pricePerKgPaise: data.offerPricePerKgPaise,
      message: data.message || '',
      timestamp: now.toISOString(),
      round: 1,
    };

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
      round: 1,
      maxRounds: MAX_NEGOTIATION_ROUNDS,
      lastActionBy: 'wholesaler',
      expiresAt,
      message: data.message || '',
      offerHistory: [initialHistory],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Notify farmer(s)
    const targetFarmerId = data.farmerId !== 'all_farmers' ? data.farmerId : null;
    if (targetFarmerId) {
      await collections.notifications.add({
        userId: targetFarmerId,
        type: 'NEGOTIATION_OFFER',
        title: `New Offer for ${data.crop}`,
        body: `${data.wholesalerBusinessName} offered ₹${(data.offerPricePerKgPaise / 100).toFixed(2)}/kg (Round 1/3).`,
        createdAt: Timestamp.now(),
        read: false,
      });
    }

    return { ok: true, negotiationId, floor, ceiling };
  },

  async getNegotiationsForFarmer(userId: string) {
    try {
      const snapshot = await db.collection('negotiations').get();
      const nowIso = new Date().toISOString();
      
      const list = snapshot.docs
        .map(doc => {
          const data = doc.data();
          let status = data.status;
          if ((status === 'pending' || status === 'countered') && data.expiresAt && data.expiresAt < nowIso) {
            status = 'expired';
          }
          return {
            ...data,
            status,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
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
        .sort((a, b) => String((b as any).updatedAt || (b as any).createdAt).localeCompare(String((a as any).updatedAt || (a as any).createdAt)));

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
        
      const nowIso = new Date().toISOString();

      const list = snapshot.docs
        .map(doc => {
          const data = doc.data();
          let status = data.status;
          if ((status === 'pending' || status === 'countered') && data.expiresAt && data.expiresAt < nowIso) {
            status = 'expired';
          }
          return {
            ...data,
            status,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
            respondedAt: data.respondedAt?.toDate?.()?.toISOString() || data.respondedAt,
          };
        })
        .sort((a, b) => String((b as any).updatedAt || (b as any).createdAt).localeCompare(String((a as any).updatedAt || (a as any).createdAt)));

      return list;
    } catch (err) {
      console.error('getNegotiationsForWholesaler error:', err);
      return [];
    }
  },

  async respondToNegotiation(negotiationId: string, params: RespondNegotiationData) {
    const { response, counterPricePerKgPaise, message, responderId, responderRole, responderName } = params;

    const docRef = db.collection('negotiations').doc(negotiationId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return { ok: false, message: 'Negotiation not found' };
    }
    
    const data = doc.data();
    if (!data) {
      return { ok: false, message: 'Invalid negotiation data' };
    }

    // Check expiry
    const nowIso = new Date().toISOString();
    if (data.expiresAt && data.expiresAt < nowIso && data.status !== 'accepted' && data.status !== 'declined') {
      await docRef.update({ status: 'expired' });
      return { ok: false, message: 'This negotiation offer has expired (48-hour limit).' };
    }

    if (data.status === 'accepted' || data.status === 'declined' || data.status === 'expired') {
      return { ok: false, message: `Negotiation is already ${data.status}` };
    }

    // Authorization check
    let isAuthorized = false;
    if (responderRole === 'wholesaler') {
      isAuthorized = data.wholesalerId === responderId;
    } else {
      if (data.farmerId === responderId || data.farmerId === 'all_farmers') {
        isAuthorized = true;
      } else if (Array.isArray(data.farmerIds) && (data.farmerIds.includes(responderId) || data.farmerIds.includes('all_farmers'))) {
        isAuthorized = true;
      } else {
        // Pool listing check
        if (data.poolId) {
          try {
            const poolDoc = await collections.pools.doc(data.poolId).get();
            if (poolDoc.exists) {
              const listingIds: string[] = poolDoc.data()?.listingIds || [];
              const listingDocs = await Promise.all(listingIds.map(id => collections.listings.doc(id).get()));
              const memberFarmerIds = listingDocs.map(d => d.data()?.farmerId);
              if (memberFarmerIds.includes(responderId)) {
                isAuthorized = true;
              }
            }
          } catch {
            isAuthorized = true;
          }
        }
      }
    }

    if (!isAuthorized) {
      return { ok: false, message: 'Unauthorized to respond to this negotiation' };
    }

    const currentRound = data.round || 1;
    const history: OfferHistoryItem[] = data.offerHistory || [];

    // Counter offer flow
    if (response === 'countered') {
      if (currentRound >= MAX_NEGOTIATION_ROUNDS) {
        return {
          ok: false,
          message: `Maximum negotiation rounds reached (${MAX_NEGOTIATION_ROUNDS}/${MAX_NEGOTIATION_ROUNDS}). You may only accept or decline.`,
        };
      }

      if (!counterPricePerKgPaise || isNaN(counterPricePerKgPaise)) {
        return { ok: false, message: 'Valid counter offer price is required.' };
      }

      const floor = data.floorPricePerKgPaise || 0;
      const ceiling = data.ceilingPricePerKgPaise || Infinity;
      const isOutsideFairBand = (counterPricePerKgPaise < floor || counterPricePerKgPaise > ceiling);

      const newRound = currentRound + 1;
      const newExpiresAt = new Date(Date.now() + NEGOTIATION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

      const newHistoryItem: OfferHistoryItem = {
        by: responderRole,
        byName: responderName || (responderRole === 'farmer' ? 'Farmer' : 'Wholesaler'),
        pricePerKgPaise: counterPricePerKgPaise,
        message: message || '',
        timestamp: new Date().toISOString(),
        round: newRound,
      };

      await docRef.update({
        status: 'countered',
        offerPricePerKgPaise: counterPricePerKgPaise,
        round: newRound,
        lastActionBy: responderRole,
        expiresAt: newExpiresAt,
        message: message || '',
        offerHistory: [...history, newHistoryItem],
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Notify the recipient
      const notifyUserId = responderRole === 'farmer' ? data.wholesalerId : data.farmerId;
      if (notifyUserId && notifyUserId !== 'all_farmers') {
        await collections.notifications.add({
          userId: notifyUserId,
          type: 'NEGOTIATION_COUNTER',
          title: `Counter-Offer from ${responderRole === 'farmer' ? 'Farmer' : 'Wholesaler'}`,
          body: `New counter-offer of ₹${(counterPricePerKgPaise / 100).toFixed(2)}/kg for ${data.crop} (Round ${newRound}/${MAX_NEGOTIATION_ROUNDS}).`,
          createdAt: Timestamp.now(),
          read: false,
        });
      }

      return {
        ok: true,
        data: {
          ...data,
          status: 'countered',
          round: newRound,
          offerPricePerKgPaise: counterPricePerKgPaise,
        },
      };
    }

    // Accept / Decline flow
    await docRef.update({
      status: response,
      respondedAt: FieldValue.serverTimestamp(),
      respondedBy: responderId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (response === 'accepted' && data.poolId) {
      try {
        await collections.pools.doc(data.poolId).update({
          poolPricePerKg: data.offerPricePerKgPaise,
        });
      } catch (err) {
        console.error('Error updating pool price on accepted offer:', err);
      }
    }

    // Notify the other party
    const recipientUserId = responderRole === 'farmer' ? data.wholesalerId : data.farmerId;
    if (recipientUserId && recipientUserId !== 'all_farmers') {
      await collections.notifications.add({
        userId: recipientUserId,
        type: response === 'accepted' ? 'NEGOTIATION_ACCEPTED' : 'NEGOTIATION_DECLINED',
        title: response === 'accepted' ? 'Offer Accepted! 🎉' : 'Offer Declined',
        body: response === 'accepted'
          ? `Agreed price: ₹${(data.offerPricePerKgPaise / 100).toFixed(2)}/kg for ${data.crop}. Proceed with escrow checkout!`
          : `Offer of ₹${(data.offerPricePerKgPaise / 100).toFixed(2)}/kg for ${data.crop} was declined.`,
        createdAt: Timestamp.now(),
        read: false,
      });
    }

    return { ok: true, data: { ...data, status: response } };
  },
};
