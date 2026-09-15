# Agri Route

Smart agricultural marketplace that pools small farmers into truck-scale lots for fair pricing.

**SIH-26033** · Agriculture, FoodTech & Rural Development

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in your API keys (see API Keys Guide)
npm run dev
```

## Tech Stack

- **Next.js 14+** (App Router, TypeScript)
- **Tailwind CSS** + Lucide React icons
- **Clerk** (Phone OTP auth)
- **Firebase** (Firestore + Storage, server-side only)
- **Razorpay** (test mode payments)
- **Gemini** (AI produce grading)
- **Leaflet + OpenStreetMap** (maps)
- **Recharts** (price trend charts)

## Key Features

- 🌾 **Fair Price Engine** — Live mandi rates + MSP comparison
- 📦 **Pooled Lots** — Auto-aggregate small quantities into truck-scale lots
- 🔒 **Escrow + OTP Handover** — Trust-free transactions
- ❄️ **Cold Storage Booking** — Hold-vs-sell advisor
- 📋 **Scheme Matching** — Personalized government scheme recommendations
- 🗣️ **Multilingual** — English, Hindi, Kannada with read-aloud

## Feature States

| Feature | State | Meaning |
|---|---|---|
| `LIVE` | Real API, real data | Fully functional |
| `SEEDED` | Real logic, local dataset | Works with bundled data |
| `SIMULATED` | Real UI + state machine | No external execution — labelled in UI |
