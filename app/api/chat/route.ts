import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], userRole = 'farmer', language = 'en' } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message required' }, { status: 400 });
    }

    const lang = (language === 'kn' || language === 'hi' || language === 'en') ? language : 'en';

    // Try Gemini with a short 3.5s timeout; if busy/timeout, immediately return rich multi-lingual answer
    const apiKey = process.env.VISION_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const prompt = `You are KisanAI for AgriRoute. User role: ${userRole}. Language: ${lang}.
Answer the following agricultural / AgriRoute question concisely with clear bullet points.
If the question is about changing/updating rates, explain that on AgriRoute, users click the "Role" button in the top navigation bar to edit their profile rates and capacity.
User question: "${message}"`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 600, temperature: 0.3 }
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply && reply.trim() && !reply.includes("503")) {
            return NextResponse.json({ ok: true, text: reply.trim(), source: 'gemini-ai' });
          }
        }
      } catch {
        // Fallback below
      }
    }

    const answer = getIntelligentAnswer(message, userRole, lang);
    return NextResponse.json({ ok: true, text: answer, source: 'kisan-knowledge' });

  } catch (error: any) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

function getIntelligentAnswer(query: string, role: string, lang: 'en' | 'kn' | 'hi'): string {
  const q = query.toLowerCase();

  // 1. UPDATE RATES / CHANGE RATES / PRICING
  if (
    q.includes('rate') || q.includes('price') || q.includes('change rate') ||
    q.includes('update rate') || q.includes('rates') || q.includes('ಬೆಲೆ') ||
    q.includes('ದರ') || q.includes('ಬದಲಾವಣೆ') || q.includes('भाव') || q.includes('दर') ||
    q.includes('रेट') || q.includes('किराया') || q.includes('बदल') || q.includes('अपडेट')
  ) {
    if (lang === 'kn') {
      return role === 'storage_owner'
        ? `### ನಿಮ್ಮ ಶೈತ್ಯಾಗಾರ ದರಗಳನ್ನು ನವೀಕರಿಸುವುದು ಹೇಗೆ:
1. **ನ್ಯಾವಿಗೇಷನ್‌ನಲ್ಲಿ ಪಾತ್ರ ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ**: ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿರುವ **"ಶೈತ್ಯಾಗಾರ (ಪಾತ್ರ)"** ಅಥವಾ **"ಪ್ರೊಫೈಲ್"** ಬಟನ್ ಅನ್ನು ಒತ್ತಿರಿ.
2. **ಬಾಡಿಗೆ ದರ ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ**: ಫಾರ್ಮ್‌ನಲ್ಲಿ ಕೆಳಗೆ ಸ್ಕ್ರಾಲ್ ಮಾಡಿ **"ಬಾಡಿಗೆ ದರ (ಪೈಸೆ/ಕೆಜಿ/ದಿನ)"** ಕ್ಷೇತ್ರವನ್ನು ಹುಡುಕಿ.
3. **ಹೊಸ ದರವನ್ನು ನಮೂದಿಸಿ**: ನಿಮ್ಮ ಹೊಸ ದರವನ್ನು ನಮೂದಿಸಿ (ಉದಾ. \`15\` ಪೈಸೆ = ₹0.15/ಕೆಜಿ/ದಿನ, ಅಥವಾ \`18\` ಪೈಸೆ = ₹0.18/ಕೆಜಿ/ದಿನ).
4. **ಲಭ್ಯವಿರುವ ಸಾಮರ್ಥ್ಯ**: ಅಗತ್ಯವಿದ್ದರೆ ಲಭ್ಯವಿರುವ ಗೋದಾಮಿನ ಸ್ಥಳವನ್ನು (ಕೆಜಿಗಳಲ್ಲಿ) ಇಲ್ಲಿ ಬದಲಾಯಿಸಬಹುದು.
5. **ಉಳಿಸಿ / ಸಲ್ಲಿಸಿ**: ನಿಮ್ಮ ಹೊಸ ದರಗಳು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ರೈತರಿಗೆ ಮತ್ತು ಸಗಟು ವ್ಯಾಪಾರಿಗಳಿಗೆ ತಕ್ಷಣವೇ ನೇರವಾಗಿ ಕಾಣಿಸುತ್ತವೆ!`
        : `### ಅಗ್ರಿರೌಟ್‌ನಲ್ಲಿ ಬೆಲೆ ಮತ್ತು ದರಗಳ ವಿವರ:
- **ರೈತರು**: **ಉತ್ಪನ್ನ ಪಟ್ಟಿಮಾಡಿ** ಪುಟದಲ್ಲಿ ಪ್ರತಿ ಕೆಜಿಗೆ ನಿಮ್ಮ ಅಪೇಕ್ಷಿತ ಮಾರಾಟ ದರವನ್ನು ನಮೂದಿಸಿ. ನ್ಯಾಯಯುತ ಬೆಲೆ ಮೀಟರ್ ಮಂಡಿ ದರವನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ.
- **ಶೈತ್ಯಾಗಾರ ಮಾಲೀಕರು**: ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿರುವ **ಶೈತ್ಯಾಗಾರ (ಪಾತ್ರ)** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಬಾಡಿಗೆ ದರಗಳನ್ನು ಸುಲಭವಾಗಿ ನವೀಕರಿಸಬಹುದು.
- **ಸಗಟು ವ್ಯಾಪಾರಿಗಳು**: ಉತ್ಪನ್ನದ ಪುಟದಲ್ಲಿ **ಮಾತುಕತೆ** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಯಾವುದೇ ಕೌಂಟರ್ ಆಫರ್ ಸಲ್ಲಿಸಬಹುದು.`;
    }

    if (lang === 'hi') {
      return role === 'storage_owner'
        ? `### अपने कोल्ड स्टोरेज की दरें कैसे अपडेट करें:
1. **नेविगेशन में भूमिका बटन पर क्लिक करें**: शीर्ष बार में **"स्टोरेज (भूमिका)"** बटन पर क्लिक करें।
2. **किराया दर फील्ड पर जाएं**: फॉर्म में नीचे स्क्रॉल करके **"किराया दर (पैसे/किग्रा/दिन)"** खोजें।
3. **नया रेट दर्ज करें**: अपना नया रेट डालें (जैसे \`15\` पैसे = ₹0.15 प्रति किग्रा/दिन)।
4. **क्षमता अपडेट करें**: आप अपनी उपलब्ध क्षमता (किग्रा) भी यहीं अपडेट कर सकते हैं।
5. **सत्यापित करें / सुरक्षित करें**: आपकी नई दरें तुरंत पूरे मार्केटप्लेस में लाइव हो जाएंगी!`
        : `### एग्रीरूट पर दरें कैसे प्रबंधित करें:
- **किसान**: **उपज बेचें** में अपनी मनचाही कीमत दर्ज करें। फेयर प्राइस मीटर आपको सही मंडी भाव सुझाता है।
- **कोल्ड स्टोरेज प्रदाता**: शीर्ष बार में **स्टोरेज (भूमिका)** पर क्लिक करके अपना किराया अपडेट करें।
- **थोक व्यापारी**: किसी भी लॉट पर **बातचीत (Negotiate)** बटन से अपनी बोली लगा सकते हैं।`;
    }

    // English
    return role === 'storage_owner'
      ? `### How to Update Your Cold Storage Rates & Capacity:
1. **Click the Role Button**: In the top navigation bar, click on the **"Storage (Role)"** button.
2. **Locate Rental Price**: Scroll down in your profile form to **"Rental Price (Paise/kg/day)"**.
3. **Enter Your New Rate**: Put your updated rate (e.g., \`15\` paise = ₹0.15/kg/day, or \`20\` paise = ₹0.20/kg/day for cold-chain units).
4. **Update Available Capacity**: You can also adjust your available storage space in kg.
5. **Click "Verify & Continue"**: Your new rates and availability will update live across the entire marketplace instantly!`
      : `### How Pricing & Rates Work on AgriRoute:
- **Cold Storage Owners**: Click **Storage (Role)** in the top navigation bar to change your rental rate (paise/kg/day) and capacity.
- **Farmers**: Enter your ask price under **List Produce**. The Fair Price Gauge checks it against today's APMC Mandi modal price to protect your profits.
- **Wholesalers**: Use the **Negotiate** button on any lot to counter-offer your target price.`;
  }

  // 2. FERTILIZER & SOIL
  if (
    q.includes('fertiliz') || q.includes('urea') || q.includes('dap') || q.includes('npk') ||
    q.includes('ಗೊಬ್ಬರ') || q.includes('ಖತ') || q.includes('ಯೂರಿಯಾ') || q.includes('उर्वरक') || q.includes('खाद')
  ) {
    if (lang === 'kn') {
      return `### ಶಿಫಾರಸು ಮಾಡಲಾದ ರಸಗೊಬ್ಬರ ಮಾರ್ಗದರ್ಶಿ:
- **ಟೊಮೆಟೊ ಮತ್ತು ತರಕಾರಿಗಳು**:
  * *ನಾಟಿ ಸಮಯದಲ್ಲಿ*: ಎಕರೆಗೆ ಚೆನ್ನಾಗಿ ಕಳಿತ ಕೊಟ್ಟಿಗೆ ಗೊಬ್ಬರ (10 ಟನ್) + ಡಿಎಪಿ (50 ಕೆಜಿ) + ಎಂಒಪಿ (25 ಕೆಜಿ).
  * *ಬೆಳವಣಿಗೆಯ ಹಂತದಲ್ಲಿ (3-4 ವಾರಗಳು)*: ಯೂರಿಯಾ ಸಿಂಪಡಣೆ ಅಥವಾ NPK 19:19:19 (ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ 5 ಗ್ರಾಂ).
  * *ಹೂವು ಮತ್ತು ಕಾಯಿ ಬಿಡುವಾಗ*: ಕ್ಯಾಲ್ಸಿಯಂ ನೈಟ್ರೇಟ್ ಮತ್ತು ಬೋರಾನ್ ಕಾಯಿ ಒಡೆಯುವುದನ್ನು ತಪ್ಪಿಸುತ್ತದೆ.
- **ಭತ್ತ**: ಸಾರಜನಕವನ್ನು (ಯೂರಿಯಾ) ಮೂರು ಕಂತುಗಳಲ್ಲಿ ನೀಡಿ.
- **ಸಾವಯವ ಪರಿಹಾರ**: ಪ್ರತಿ 15 ದಿನಗಳಿಗೊಮ್ಮೆ ಜೀವಾಮೃತ ನೀಡಿದರೆ ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಹೆಚ್ಚುತ್ತದೆ!`;
    }
    if (lang === 'hi') {
      return `### अनुशंसित उर्वरक और पोषण कार्यक्रम:
- **टमाटर और सब्जियां**:
  * *रोपाई के समय*: 10 टन गोबर की खाद + डीएपी (50 किग्रा) + पोटाश/एमओपी (25 किग्रा) प्रति एकड़।
  * *वृद्धि के समय (3-4 सप्ताह)*: यूरिया या एनपीके 19:19:19 (5 ग्राम प्रति लीटर पानी)।
  * *फूल और फल आते समय*: कैल्शियम नाइट्रेट और बोरॉन फल फटने से बचाते हैं।
- **धान**: यूरिया को 3 भागों में बांटकर दें (रोपाई, कल्ले फूटते समय, और बाली निकलते समय)।
- **जैविक विकल्प**: जीवामृत का उपयोग मिट्टी की गुणवत्ता को बढ़ाता है!`;
    }
    return `### Recommended Fertilizer & Nutrition Schedule:
- **Tomato & Vegetables**:
  * *Basal dose*: 10 tonnes well-rotted FYM/compost + 50 kg DAP + 25 kg MOP per acre.
  * *Vegetative stage (3-4 weeks)*: Urea in split doses or NPK 19:19:19 foliar spray (5g/L).
  * *Fruiting stage*: Calcium Nitrate + Boron to prevent blossom-end rot and fruit cracking.
- **Paddy (Rice)**: Apply Nitrogen (Urea) in 3 equal splits for maximum tillering.
- **Organic Boosters**: Spray Jeevamrutha or Vermiwash every 15 days for robust soil health!`;
  }

  // 3. GOVERNMENT SCHEMES & SUBSIDIES
  if (
    q.includes('scheme') || q.includes('pm-kisan') || q.includes('pmfby') || q.includes('subsidy') ||
    q.includes('loan') || q.includes('ಯೋಜನೆ') || q.includes('ಸಾಲ') || q.includes('ಸಹಾಯಧನ') || q.includes('योजना')
  ) {
    if (lang === 'kn') {
      return `### ರೈತರಿಗಾಗಿ ಪ್ರಮುಖ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು:
1. **ಪಿಎಂ-ಕಿಸಾನ್ (PM-KISAN)**: ರೈತರ ಖಾತೆಗೆ ವರ್ಷಕ್ಕೆ ₹6,000 (3 ಕಂತುಗಳಲ್ಲಿ ತಲಾ ₹2,000).
2. **ಪಿಎಂಎಫ್‌ಬಿವೈ (ಬೆಳೆ ವಿಮೆ)**: ಅಕಾಲಿಕ ಮಳೆ ಮತ್ತು ನೈಸರ್ಗಿಕ ಹಾನಿಗೆ ವಿಮೆ. ಮುಂಗಾರು ಬೆಳೆಗೆ ಕೇವಲ 2%, ಹಿಂಗಾರು ಬೆಳೆಗೆ 1.5% ಪ್ರೀಮಿಯಂ.
3. **ಕಿಸಾನ್ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ (KCC)**: ಕೇವಲ 4% ಬಡ್ಡಿದರದಲ್ಲಿ ₹3 ಲಕ್ಷದವರೆಗೆ ಕೃಷಿ ಸಾಲ.
4. **ಕೃಷಿ ಮೂಲಸೌಕರ್ಯ ನಿಧಿ (AIF)**: ಶೈತ್ಯಾಗಾರ ಮತ್ತು ಗೋದಾಮು ನಿರ್ಮಾಣಕ್ಕೆ ಶೇ. 3 ಬಡ್ಡಿ ಸಬ್ಸಿಡಿ.`;
    }
    if (lang === 'hi') {
      return `### किसानों के लिए प्रमुख सरकारी योजनाएं:
1. **पीएम-किसान (PM-KISAN)**: किसानों को सीधे बैंक खाते में ₹6,000 प्रति वर्ष (3 किस्तों में ₹2,000-₹2,000)।
2. **पीएम फसल बीमा योजना (PMFBY)**: प्राकृतिक आपदाओं से सुरक्षा। खरीफ के लिए 2%, रबी के लिए 1.5% प्रीमियम।
3. **किसान क्रेडिट कार्ड (KCC)**: समय पर भुगतान करने पर मात्र 4% ब्याज पर ₹3 लाख तक का फसली ऋण।
4. **कृषि अवसंरचना कोष (AIF)**: कोल्ड स्टोरेज और गोदाम निर्माण के लिए 3% ब्याज अनुदान।`;
    }
    return `### Key Government Schemes for Farmers & Agri Businesses:
1. **PM-KISAN**: ₹6,000 per year direct income support in 3 equal installments of ₹2,000.
2. **PMFBY (Crop Insurance)**: Low premium protection against weather damage (2% Kharif, 1.5% Rabi).
3. **Kisan Credit Card (KCC)**: Crop loans up to ₹3 Lakh at an effective 4% interest rate.
4. **Agriculture Infrastructure Fund (AIF)**: 3% interest subvention for setting up cold storages, sorting facilities, and warehouses.`;
  }

  // 4. COLD STORAGE & WDRA
  if (
    q.includes('storage') || q.includes('cold') || q.includes('wdra') || q.includes('ಶೈತ್ಯಾಗಾರ') ||
    q.includes('ಕೋಲ್ಡ್') || q.includes('कोल्ड') || q.includes('भंडारण')
  ) {
    if (lang === 'kn') {
      return `### ಶೈತ್ಯಾಗಾರ ಮತ್ತು ಬೆಳೆ ಸಂರಕ್ಷಣಾ ನಿಯಮಗಳು:
- **ಟೊಮೆಟೊ**: 10°C ಯಿಂದ 12°C ತಾಪಮಾನ, 85-90% ಆರ್ದ್ರತೆ (2-3 ವಾರಗಳ ಕಾಲ ತಾಜಾವಾಗಿರುತ್ತದೆ).
- **ಆಲೂಗಡ್ಡೆ**: 2°C ಯಿಂದ 4°C ತಾಪಮಾನ (6-8 ತಿಂಗಳುಗಳ ಕಾಲ ಸಂಗ್ರಹಿಸಬಹುದು).
- **ಈರುಳ್ಳಿ**: ಗಾಳಿಯಾಡುವ ಒಣ ವಾತಾವರಣ (25-30°C) ಅಥವಾ ನಿಯಂತ್ರಿತ ಶೀತಲ ಕೊಠಡಿ (0-2°C).
- **WDRA ಮಾನ್ಯತೆ**: ನೋಂದಾಯಿತ ಶೈತ್ಯಾಗಾರಗಳ ರಶೀದಿ (e-NWR) ಬಳಸಿಕೊಂಡು ಬೆಳೆ ಮಾರಾಟ ಮಾಡದೆಯೇ ಬ್ಯಾಂಕ್ ಸಾಲ ಪಡೆಯಬಹುದು!`;
    }
    if (lang === 'hi') {
      return `### कोल्ड स्टोरेज और फसल संरक्षण दिशानिर्देश:
- **टमाटर**: 10°C से 12°C, 85-90% आर्द्रता (2-3 सप्ताह सुरक्षित रहता है)।
- **आलू**: 2°C से 4°C (6-8 महीने तक सुरक्षित भंडारण)।
- **प्याज**: हवादार सूखा स्थान (25-30°C) या नियंत्रित कोल्ड स्टोरेज (0-2°C)।
- **WDRA रसीद (e-NWR)**: इसके आधार पर आप फसल बेचे बिना बैंक से तुरंत कम ब्याज पर लोन ले सकते हैं!`;
    }
    return `### Cold Storage Parameters & WDRA Benefits:
- **Tomato**: 10°C to 12°C, 85-90% Relative Humidity (preserves for 2-3 weeks).
- **Potato**: 2°C to 4°C, 90-95% RH (preserves 6-8 months).
- **Onion**: Well-ventilated dry ambient (25-30°C) or controlled 0-2°C.
- **WDRA Accreditation**: WDRA facilities issue e-NWRs (Negotiable Warehouse Receipts) which can be pledged with banks for quick loans without selling at distress prices.`;
  }

  // 5. CROPS, PESTS & HARVEST
  if (
    q.includes('crop') || q.includes('pest') || q.includes('disease') || q.includes('blight') ||
    q.includes('tomato') || q.includes('potato') || q.includes('onion') || q.includes('ಬೆಳೆ') ||
    q.includes('ಕೀಟ') || q.includes('ರೋಗ') || q.includes('फसल') || q.includes('कीट') || q.includes('रोग')
  ) {
    if (lang === 'kn') {
      return `### ಬೆಳೆ ನಿರ್ವಹಣೆ ಮತ್ತು ಕೀಟ ನಿಯಂತ್ರಣ:
- **ಎಲೆ ಚುಕ್ಕೆ / ಅಂಗಮಾರಿ ರೋಗ (Blight)**: ಎಲೆಗಳ ಮೇಲೆ ಕಂದು ಮಚ್ಚೆಗಳು ಕಂಡುಬಂದರೆ ಮ್ಯಾಂಕೋಜೆಬ್ (2.5 ಗ್ರಾಂ/ಲೀಟರ್) ಸಿಂಪಡಿಸಿ.
- **ಕಾಯಿ ಕೊರಕ ಕೀಟ (Fruit Borer)**: ಎಕರೆಗೆ 5 ಮೋಹಕ ಬಲೆಗಳನ್ನು (Pheromone traps) ಇರಿಸಿ ಹಾಗೂ ಬೇವಿನ ಎಣ್ಣೆ (10,000 ppm) ಸಿಂಪಡಿಸಿ.
- **ಹನಿ ನೀರಾವರಿ (Drip)**: ಎಲೆಗಳ ತೇವವನ್ನು ಕಡಿಮೆ ಮಾಡಿ ಶಿಲೀಂಧ್ರ ರೋಗಗಳನ್ನು ನಿಯಂತ್ರಿಸಲು ಹನಿ ನೀರಾವರಿ ಅತ್ಯುತ್ತಮ.`;
    }
    if (lang === 'hi') {
      return `### फसल देखभाल और कीट प्रबंधन:
- **झुलसा रोग (Blight)**: पत्तियों पर भूरे धब्बे दिखने पर मैंकोजेब (2.5 ग्राम/लीटर पानी) का छिड़काव करें।
- **फल छेदक (Fruit Borer)**: प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं और नीम का तेल (10,000 ppm) छिड़कें।
- **टपक सिंचाई (Drip)**: पत्तियों को सूखा रखकर फंगल संक्रमण को 60% तक कम करती है।`;
    }
    return `### Crop Care & Disease Management:
- **Early/Late Blight**: Spray Mancozeb (2.5g/L water) or Copper Oxychloride at first sign of brown leaf spots.
- **Fruit Borer**: Install 5 pheromone traps per acre and spray Neem oil (10,000 ppm) or Bt early morning.
- **Drip Irrigation**: Keeps foliage dry and dramatically cuts down fungal infections.`;
  }

  // 6. DEFAULT INTRO / GREETING
  if (lang === 'kn') {
    return `### ನಮಸ್ಕಾರ! ನಾನು ಕಿಸಾನ್ AI 🌾
ಅಗ್ರಿರೌಟ್‌ನ ಕೃಷಿ ಮಾರ್ಗದರ್ಶಿ. ನಾನು ನಿಮಗೆ ಈ ಕೆಳಗಿನವುಗಳಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ:
- **ದರಗಳನ್ನು ಬದಲಾಯಿಸುವುದು**: ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿರುವ **ಪಾತ್ರ** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ದರಗಳನ್ನು ನವೀಕರಿಸಿ.
- **ಬೆಳೆ ರಕ್ಷಣೆ ಮತ್ತು ಕೀಟ ನಿಯಂತ್ರಣ**: ಸಾವಯವ ಔಷಧಗಳು, ರೋಗ ತಡೆಗಟ್ಟುವಿಕೆ.
- **ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ**: ಡಿಎಪಿ, ಯೂರಿಯಾ, ಎನ್‌ಪಿಕೆ ವೇಳಾಪಟ್ಟಿ.
- **ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು**: ಪಿಎಂ-ಕಿಸಾನ್, ಬೆಳೆ ವಿಮೆ, ಕೆಸಿಸಿ ಸಾಲಗಳು.
- **ಶೈತ್ಯಾಗಾರ ಮತ್ತು ಸಾರಿಗೆ**: ತಾಪಮಾನ ಮಾಹಿತಿ ಮತ್ತು ವಾಹನ ಪಿಕಪ್.

ನಿಮಗೆ ಇಂದು ಯಾವ ಮಾಹಿತಿ ಬೇಕು?`;
  }

  if (lang === 'hi') {
    return `### नमस्ते! मैं किसान AI हूँ 🌾
एग्रीरूट का कृषि और प्लेटफॉर्म सहायक। मैं आपकी इनमें सहायता कर सकता हूँ:
- **रेट/दरें अपडेट करना**: शीर्ष मेनू में **भूमिका** बटन पर क्लिक करके दरें बदलें।
- **फसल सुरक्षा और कीट नियंत्रण**: जैविक उपचार, रोग निवारण।
- **खाद व उर्वरक कार्यक्रम**: डीएपी, यूरिया, एनपीके सही मात्रा।
- **सरकारी योजनाएं**: पीएम-किसान, फसल बीमा, केसीसी लोन।
- **कोल्ड स्टोरेज और परिवहन**: भंडारण तापमान और पिकअप वाहन।

आज मैं आपकी क्या सहायता कर सकता हूँ?`;
  }

  return `### Hello! I am KisanAI 🌾
Your intelligent agricultural and AgriRoute assistant. I can assist you with:
- **Updating Rates & Capacity**: Click your **Role** button in the top navigation bar to change prices or available space.
- **Crop Protection & Pest Cures**: Remedies for blight, borers, and wilt.
- **Fertilizer Guidance**: Dosage and timing for DAP, Urea, and NPK.
- **Government Schemes**: PM-KISAN ₹6000, PMFBY insurance, KCC loans.
- **Cold Storage & Logistics**: Optimum preservation temperatures, WDRA receipts, and farm-gate haulage.

What would you like to know today?`;
}
