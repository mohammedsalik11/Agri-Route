import { collections } from '../firebase-admin';
import mspData from '../../data/msp.json';
import mandiSnapshot from '../../data/mandi-snapshot.json';

// ---------- Types ----------
export interface VarietyPrice {
  variety: string;
  minPrice: number;   // paise/kg
  maxPrice: number;   // paise/kg
  modalPrice: number; // paise/kg
  market: string;
}

export interface MandiPrice {
  minPrice: number;    // paise/kg
  maxPrice: number;    // paise/kg
  modalPrice: number;  // paise/kg
  date: string;
  market: string;
  varieties?: VarietyPrice[];  // top varieties by modal price
}

export interface FairPriceResult {
  mspPerKg: number | null;        // paise, null for non-MSP crops
  mandiMinPerKg: number;           // paise
  mandiModalPerKg: number;         // paise
  mandiMaxPerKg: number;           // paise
  floorPerKg: number;              // paise
  fairBand: { lo: number; hi: number };  // paise
  suggestedPerKg: number;          // paise
  verdict: 'BELOW_FLOOR' | 'FAIR' | 'ABOVE_MARKET';
  deltaVsMandiPercent: number;
  extraEarningVsFloor: number;     // paise (total, not per-kg)
  dataSource: 'LIVE' | 'CACHED';
  checkedAt: string;
  note?: string;                   // e.g. "No MSP declared for this crop"
}

export interface PriceTrendPoint {
  date: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
}

// ---------- Constants ----------
const GRADE_MULTIPLIER: Record<string, number> = { A: 1.05, B: 1.00, C: 0.90 };
const FAIR_BAND_MARGIN = 0.05; // ±5% of modal

// Convert ₹/quintal → paise/kg: (price_per_quintal / 100) * 100 = price_per_quintal
// Actually: ₹/quintal → ₹/kg = ÷100, then ₹/kg → paise/kg = ×100
// Net: paise/kg = ₹/quintal (the ÷100 and ×100 cancel out)
function quintalToPaisePerKg(pricePerQuintal: number): number {
  return Math.round(pricePerQuintal); // ÷100 (quintal→kg) × 100 (₹→paise) = 1:1
}

// ---------- MSP Lookup ----------
export function getMSP(crop: string): number | null {
  const entry = (mspData as Record<string, { mspPerQuintal: number } | null>)[crop.toLowerCase()];
  if (!entry) return null;
  return quintalToPaisePerKg(entry.mspPerQuintal);
}

// ---------- Mandi Price Fetching ----------
const DATA_GOV_BASE = 'https://api.data.gov.in/resource';
const AGMARKNET_RESOURCE = process.env.AGMARKNET_RESOURCE_ID || '9ef84268-d588-465a-a308-a864a43d0070';
const FETCH_TIMEOUT = 9000; // Increased to 9s to ensure live api.data.gov.in queries complete reliably

const AGMARKNET_COMMODITY_MAP: Record<string, string> = {
  tomato: 'Tomato',
  onion: 'Onion',
  potato: 'Potato',
  paddy: 'Paddy(Dhan)(Common)',
  paddy_common: 'Paddy(Dhan)(Common)',
  wheat: 'Wheat',
  ragi: 'Ragi (Finger Millet)',
  maize: 'Maize',
  banana: 'Banana',
  carrot: 'Carrot',
  brinjal: 'Brinjal',
  cabbage: 'Cabbage',
  cauliflower: 'Cauliflower',
  green_chilli: 'Green Chilli',
  cotton: 'Cotton',
  jowar: 'Jowar(Sorghum)',
  bajra: 'Bajra(Pearl Millet/Cumbu)',
  soyabean: 'Soyabean',
  groundnut: 'Groundnut',
};

async function fetchLiveMandiPrice(
  crop: string,
  state: string,
  district: string
): Promise<{ price: MandiPrice; source: 'LIVE' } | null> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;
  if (!apiKey) return null;

  try {
    const commodityName =
      AGMARKNET_COMMODITY_MAP[crop.toLowerCase()] ||
      crop.charAt(0).toUpperCase() + crop.slice(1);

    const params = new URLSearchParams({
      'api-key': apiKey,
      format: 'json',
      limit: '15',
      'filters[commodity]': commodityName,
      'filters[state]': state,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const res = await fetch(`${DATA_GOV_BASE}/${AGMARKNET_RESOURCE}?${params}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const data = await res.json();
    const records = data.records || [];
    if (records.length === 0) {
      // Retry once without state filter if empty
      return null;
    }

    // Collect top varieties by modal price (dedup by variety name)
    const varietyMap = new Map<string, VarietyPrice>();
    for (const r of records) {
      const variety = r.variety || r.Variety || r.grade || r.Grade || 'Standard';
      const rMin = quintalToPaisePerKg(Number(r.min_price || r.Min_Price || r.min_x0020_price || 0));
      const rMax = quintalToPaisePerKg(Number(r.max_price || r.Max_Price || r.max_x0020_price || 0));
      const rModal = quintalToPaisePerKg(Number(r.modal_price || r.Modal_Price || r.modal_x0020_price || 0));
      if (rModal > 0 && !varietyMap.has(variety)) {
        varietyMap.set(variety, {
          variety,
          minPrice: rMin,
          maxPrice: rMax,
          modalPrice: rModal,
          market: r.market || r.Market || district,
        });
      }
    }
    const varieties = Array.from(varietyMap.values())
      .sort((a, b) => b.modalPrice - a.modalPrice)
      .slice(0, 5);

    // Find best match: prefer exact district, else take first
    const match =
      records.find(
        (r: Record<string, string>) =>
          (r.district || r.District || '').toLowerCase() === district.toLowerCase()
      ) || records[0];

    const minPrice = Number(match.min_price || match.Min_Price || match.min_x0020_price || 0);
    const maxPrice = Number(match.max_price || match.Max_Price || match.max_x0020_price || 0);
    const modalPrice = Number(match.modal_price || match.Modal_Price || match.modal_x0020_price || 0);

    const price: MandiPrice = {
      minPrice: quintalToPaisePerKg(minPrice),
      maxPrice: quintalToPaisePerKg(maxPrice),
      modalPrice: quintalToPaisePerKg(modalPrice),
      date: match.arrival_date || match.Arrival_Date || new Date().toISOString().slice(0, 10),
      market: match.market || match.Market || district,
      varieties: varieties.length > 0 ? varieties : undefined,
    };

    // Cache in Firestore
    const cacheKey = `${crop}_${state}_${price.date}`.toLowerCase().replace(/\s+/g, '_');
    await collections.priceCache.doc(cacheKey).set({
      ...price,
      crop,
      state,
      district,
      fetchedAt: new Date().toISOString(),
    });

    return { price, source: 'LIVE' as const };
  } catch {
    return null;
  }
}

function getCachedMandiPrice(crop: string): { price: MandiPrice; source: 'CACHED' } | null {
  const snapshot = mandiSnapshot as Record<
    string,
    { history: Array<{ date: string; minPrice: number; maxPrice: number; modalPrice: number }> }
  >;
  const entry = snapshot[crop.toLowerCase()];
  if (!entry || !entry.history || entry.history.length === 0) return null;

  const latest = entry.history[0]; // Most recent day
  return {
    price: {
      minPrice: quintalToPaisePerKg(latest.minPrice),
      maxPrice: quintalToPaisePerKg(latest.maxPrice),
      modalPrice: quintalToPaisePerKg(latest.modalPrice),
      date: latest.date,
      market: (entry as unknown as { market?: string }).market || 'Cached',
    },
    source: 'CACHED' as const,
  };
}

/**
 * Get mandi price — live first, cached fallback. NEVER throws.
 */
export async function getMandiPrice(
  crop: string,
  state: string,
  district: string
): Promise<{ price: MandiPrice; source: 'LIVE' | 'CACHED' }> {
  // Try Firestore cache for today first
  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `${crop}_${state}_${today}`.toLowerCase().replace(/\s+/g, '_');
  try {
    const cached = await collections.priceCache.doc(cacheKey).get();
    if (cached.exists) {
      const data = cached.data()!;
      return {
        price: {
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          modalPrice: data.modalPrice,
          date: data.date || today,
          market: data.market || district,
        },
        source: 'LIVE',
      };
    }
  } catch {
    // Ignore cache error, proceed to fetch
  }

  // Try live API
  const live = await fetchLiveMandiPrice(crop, state, district);
  if (live) return live;

  // Fallback to snapshot
  const snapshot = getCachedMandiPrice(crop);
  if (snapshot) return snapshot;

  // Ultimate fallback — return zeros (should never happen with good seed data)
  return {
    price: {
      minPrice: 0,
      maxPrice: 0,
      modalPrice: 0,
      date: today,
      market: 'Unavailable',
    },
    source: 'CACHED',
  };
}

/**
 * Fetch live mandi prices and MSP for multiple crops at once.
 */
export async function getMultipleMandiPrices(
  crops: string[],
  state: string = 'Karnataka',
  district: string = 'Mandya'
): Promise<
  Record<
    string,
    {
      crop: string;
      state: string;
      district: string;
      mspPerKg: number | null;
      mandiMinPerKg: number;
      mandiModalPerKg: number;
      mandiMaxPerKg: number;
      mandiDate: string;
      mandiMarket: string;
      dataSource: 'LIVE' | 'CACHED';
    }
  >
> {
  const uniqueCrops = Array.from(new Set(crops.map(c => c.trim().toLowerCase()))).filter(Boolean);

  const results = await Promise.allSettled(
    uniqueCrops.map(async (crop) => {
      const mspPerKg = getMSP(crop);
      const { price: mandi, source: dataSource } = await getMandiPrice(crop, state, district);
      return {
        crop,
        state,
        district,
        mspPerKg,
        mandiMinPerKg: mandi.minPrice,
        mandiModalPerKg: mandi.modalPrice,
        mandiMaxPerKg: mandi.maxPrice,
        mandiDate: mandi.date,
        mandiMarket: mandi.market,
        varieties: mandi.varieties || [],
        dataSource,
      };
    })
  );

  const output: Record<string, any> = {};
  results.forEach((res, i) => {
    const crop = uniqueCrops[i];
    if (res.status === 'fulfilled') {
      output[crop] = res.value;
    } else {
      output[crop] = {
        crop,
        state,
        district,
        mspPerKg: getMSP(crop),
        mandiMinPerKg: 0,
        mandiModalPerKg: 0,
        mandiMaxPerKg: 0,
        mandiDate: new Date().toISOString().slice(0, 10),
        mandiMarket: 'Unavailable',
        dataSource: 'CACHED' as const,
      };
    }
  });

  return output;
}

// ---------- Fair Price Engine ----------
export async function checkFairPrice(input: {
  crop: string;
  state: string;
  district: string;
  quantityKg: number;
  askPricePerKg: number; // paise
  qualityGrade: 'A' | 'B' | 'C';
}): Promise<FairPriceResult> {
  const { crop, state, district, quantityKg, askPricePerKg, qualityGrade } = input;

  const msp = getMSP(crop);
  const { price: mandi, source: dataSource } = await getMandiPrice(crop, state, district);

  const gradeMultiplier = GRADE_MULTIPLIER[qualityGrade] || 1.0;
  const suggested = Math.round(mandi.modalPrice * gradeMultiplier);
  const floor = msp !== null ? Math.max(msp, mandi.minPrice) : mandi.minPrice;
  const fairBandLo = Math.round(mandi.modalPrice * (1 - FAIR_BAND_MARGIN));
  const fairBandHi = Math.round(mandi.modalPrice * (1 + FAIR_BAND_MARGIN));

  let verdict: 'BELOW_FLOOR' | 'FAIR' | 'ABOVE_MARKET';
  if (askPricePerKg < floor) {
    verdict = 'BELOW_FLOOR';
  } else if (askPricePerKg > fairBandHi) {
    verdict = 'ABOVE_MARKET';
  } else {
    verdict = 'FAIR';
  }

  const deltaVsMandiPercent =
    mandi.modalPrice > 0
      ? Math.round(((askPricePerKg - mandi.modalPrice) / mandi.modalPrice) * 100)
      : 0;

  const extraEarningVsFloor =
    askPricePerKg < floor ? (floor - askPricePerKg) * quantityKg : 0;

  let note: string | undefined;
  if (msp === null) {
    note = 'NO_MSP_FOR_CROP'; // Maps to i18n key fairPrice.noMspForCrop
  }

  return {
    mspPerKg: msp,
    mandiMinPerKg: mandi.minPrice,
    mandiModalPerKg: mandi.modalPrice,
    mandiMaxPerKg: mandi.maxPrice,
    floorPerKg: floor,
    fairBand: { lo: fairBandLo, hi: fairBandHi },
    suggestedPerKg: suggested,
    verdict,
    deltaVsMandiPercent,
    extraEarningVsFloor,
    dataSource,
    checkedAt: new Date().toISOString(),
    note,
  };
}

// ---------- Price Trend (for hold-vs-sell) ----------
export function getPriceTrend(crop: string, days: number = 7): PriceTrendPoint[] {
  const snapshot = mandiSnapshot as Record<
    string,
    { history: Array<{ date: string; minPrice: number; maxPrice: number; modalPrice: number }> }
  >;
  const entry = snapshot[crop.toLowerCase()];
  if (!entry || !entry.history) return [];

  return entry.history.slice(0, days).map(h => ({
    date: h.date,
    minPrice: quintalToPaisePerKg(h.minPrice),
    maxPrice: quintalToPaisePerKg(h.maxPrice),
    modalPrice: quintalToPaisePerKg(h.modalPrice),
  }));
}
