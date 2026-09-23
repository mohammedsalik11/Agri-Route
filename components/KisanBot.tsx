'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, Sprout, Store, Truck, Warehouse, ChevronDown } from 'lucide-react';

type Role = 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const KNOWLEDGE_BASE: Record<string, Record<string, string>> = {
  farmer: {
    crop: `Popular crops in Karnataka: Tomato (Mandya/Kolar), Onion (Belgaum/Dharwad), Potato (Hassan), Ragi (Tumkur), Paddy (Mysuru/Mandya). Best harvest seasons vary by crop — Rabi (Nov-Apr) for wheat, Kharif (Jun-Oct) for paddy and maize.`,
    price: `Current mandi prices are available on your dashboard. For real-time prices, check the APMC portal or call the nearest mandi. The fair price check on your listing page shows today's modal price from Agmarknet.`,
    scheme: `Key schemes for farmers: PM-KISAN (₹6000/year direct benefit), PMFBY (crop insurance), PM-Fasal Bima Yojana, Rashtriya Krishi Vikas Yojana (RKVY), Kisan Credit Card (KCC) for loans at 4% interest, e-NAM for online mandi trading.`,
    fertilizer: `For tomato: use DAP at transplanting + NPK 19:19:19 during growth. For paddy: apply urea in 3 splits. Organic options: vermicompost, neem cake. Karnataka has subsidized fertilizer through IFFCO — contact your local PACS or Raitha Samparka Kendra.`,
    insurance: `PMFBY crop insurance available through banks and Common Service Centres (CSC). Premiums: Kharif 2%, Rabi 1.5%, Horticulture 5%. Claims are assessed after harvest loss. Apply before sowing season cutoff.`,
    pool: `Pooling helps small farmers get better prices by combining produce into larger lots. Join or create a pool on the Pools page. Minimum lot of 500 kg is needed. Pool organizer manages logistics and mandi contact.`,
    storage: `Cold storage protects perishables from spoilage. Tomato lasts 2-3 weeks at 10-12°C, potato 6 months at 4°C, onion 6 months. Book storage from the Storage page. WDRA-certified warehouses are recommended.`,
    logistics: `Request pickup from the Logistics page. Specify your village, produce type, and quantity. Drivers will quote rates. Typical rate: ₹25-40/quintal for 50 km.`,
    default: `I can help you with: crops, prices, government schemes, fertilizers, crop insurance, pooling, storage, and logistics. What would you like to know?`,
  },
  wholesaler: {
    price: `Price negotiations are done via the Negotiate button on any listing. You can offer any price — the system will show if it is above/below the mandi fair price. Use the Negotiate page to track all ongoing deals.`,
    pool: `Pools are group lots from multiple farmers. They offer consistent large volumes. Browse pools on the main page. A pool lot has a guaranteed minimum quantity, usually 1-5 tonnes.`,
    storage: `You can book cold storage to hold purchased produce before onward dispatch. Available at the Storage page. WDRA warehouses provide receipts usable as collateral.`,
    logistics: `After completing a purchase, request integrated farm-gate pickup to your preferred delivery point. Logistics jobs are posted to nearby drivers automatically.`,
    quality: `Quality grades (A/B/C) are self-declared by farmers or from AI photo analysis. Grade A = premium rate. You can request inspection or field visit before confirming large orders.`,
    gst: `All transactions generate GST-compliant invoices. Applicable rates: fresh vegetables 0%, packaged produce 5%, processed 12-18%. Your GSTIN is recorded during onboarding.`,
    default: `I can help you with: pricing strategy, negotiating with farmers, pool purchases, storage, logistics, quality assessment, and GST. What would you like to know?`,
  },
  logistics_driver: {
    job: `New jobs appear on your Driver Hub page. Accept a job to see pickup address, delivery point, produce type and quantity. Payment is released after delivery confirmation.`,
    route: `Plan your route using Google Maps or the built-in map. For cold-chain loads, maintain required temperatures. Refrigerated loads pay ₹5-10/km extra.`,
    payment: `Payments are processed after delivery confirmation. Amount is credited to your registered UPI ID within 24-48 hours. Track all earnings in your earnings section.`,
    vehicle: `Keep your vehicle documents (RC, Insurance, Pollution) up to date. For refrigerated transport, ensure the cooling unit is functioning. Cold-chain breakdowns must be reported immediately.`,
    default: `I can help you with: finding jobs, route planning, payment, vehicle requirements, and load handling. What would you like to know?`,
  },
  storage_owner: {
    booking: `Farmer and wholesaler bookings appear on your dashboard. Review and approve/reject requests. Check the booking details for: crop type, quantity, duration, and special requirements.`,
    capacity: `Update your available capacity on the dashboard after each booking or checkout. Accurate availability improves visibility in search results for farmers.`,
    wdra: `WDRA (Warehousing Development and Regulatory Authority) accreditation allows you to issue Negotiable Warehouse Receipts (NWR). Farmers can pledge these for loans. Apply at wdra.gov.in.`,
    pricing: `Your per kg/day rate is shown to farmers. Market rates range from ₹0.10-0.20/kg/day. Refrigerated storage commands premium rates. Update pricing from your profile.`,
    default: `I can help you with: managing bookings, capacity tracking, WDRA accreditation, pricing strategy, and facility management. What would you like to know?`,
  },
};

const GREETINGS: Record<Role, string> = {
  farmer: `Namaskara! 🌾 I am **KisanBot**, your farming assistant. I can help you with crop advice, mandi prices, government schemes, fertilizers, and more. How can I assist you today?`,
  wholesaler: `Namaskara! 🏪 I am **KisanBot**, your trade assistant. I can help you with market prices, negotiation tips, pool purchases, and supply chain management. How can I help?`,
  logistics_driver: `Namaskara! 🚚 I am **KisanBot**, your logistics assistant. I can help you find jobs, plan routes, and manage your earnings. How can I help?`,
  storage_owner: `Namaskara! 🏭 I am **KisanBot**, your facility management assistant. I can help with bookings, WDRA accreditation, and capacity management. How can I help?`,
};

function getBotResponse(question: string, role: Role): string {
  const q = question.toLowerCase();
  const kb = KNOWLEDGE_BASE[role];

  if (q.includes('crop') || q.includes('vegetable') || q.includes('fruit') || q.includes('kharif') || q.includes('rabi') || q.includes('harvest')) {
    return kb.crop || kb.default;
  }
  if (q.includes('price') || q.includes('rate') || q.includes('mandi') || q.includes('market') || q.includes('negotiat')) {
    return kb.price || kb.default;
  }
  if (q.includes('scheme') || q.includes('pm-kisan') || q.includes('pmfby') || q.includes('subsid') || q.includes('government') || q.includes('benefit')) {
    return kb.scheme || kb.default;
  }
  if (q.includes('fertilizer') || q.includes('pesticide') || q.includes('manure') || q.includes('organic') || q.includes('urea') || q.includes('dap')) {
    return kb.fertilizer || kb.default;
  }
  if (q.includes('insur') || q.includes('pmfby') || q.includes('fasal bima')) {
    return kb.insurance || kb.default;
  }
  if (q.includes('pool') || q.includes('group') || q.includes('collective') || q.includes('cooperative')) {
    return kb.pool || kb.default;
  }
  if (q.includes('storage') || q.includes('cold') || q.includes('warehouse') || q.includes('refrigerat')) {
    return kb.storage || kb.default;
  }
  if (q.includes('logistics') || q.includes('transport') || q.includes('truck') || q.includes('pickup') || q.includes('deliver')) {
    return kb.logistics || kb.default;
  }
  if (q.includes('job') || q.includes('load') || q.includes('accept')) {
    return kb.job || kb.default;
  }
  if (q.includes('route') || q.includes('map') || q.includes('direction')) {
    return kb.route || kb.default;
  }
  if (q.includes('payment') || q.includes('earning') || q.includes('upi') || q.includes('money')) {
    return kb.payment || kb.default;
  }
  if (q.includes('wdra') || q.includes('accredit') || q.includes('receipt') || q.includes('nwr')) {
    return kb.wdra || kb.default;
  }
  if (q.includes('booking') || q.includes('book') || q.includes('request')) {
    return kb.booking || kb.default;
  }
  if (q.includes('capacity') || q.includes('space') || q.includes('available')) {
    return kb.capacity || kb.default;
  }
  if (q.includes('quality') || q.includes('grade') || q.includes('inspect')) {
    return kb.quality || kb.default;
  }
  if (q.includes('gst') || q.includes('invoice') || q.includes('tax')) {
    return kb.gst || kb.default;
  }
  if (q.includes('hello') || q.includes('hi') || q.includes('namask') || q.includes('help')) {
    return GREETINGS[role];
  }

  return `I understand you are asking about "${question.slice(0, 60)}". ${kb.default}`;
}

const roleColor: Record<Role, string> = {
  farmer: 'bg-field-green',
  wholesaler: 'bg-amber-600',
  logistics_driver: 'bg-blue-600',
  storage_owner: 'bg-cyan-700',
};

const roleIcon: Record<Role, React.ReactNode> = {
  farmer: <Sprout className="w-4 h-4" />,
  wholesaler: <Store className="w-4 h-4" />,
  logistics_driver: <Truck className="w-4 h-4" />,
  storage_owner: <Warehouse className="w-4 h-4" />,
};

interface KisanBotProps {
  userRole?: Role;
}

export const KisanBot: React.FC<KisanBotProps> = ({ userRole = 'farmer' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const openBot = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: GREETINGS[userRole],
        timestamp: new Date().toISOString(),
      }]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate a short delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 600));

    const botResponse = getBotResponse(text, userRole);
    const botMsg: Message = {
      id: `b-${Date.now()}`,
      role: 'bot',
      text: botResponse,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, botMsg]);
    setTyping(false);
  };

  const QUICK_QUESTIONS: Record<Role, string[]> = {
    farmer: ['What crops should I grow?', 'Tell me about PM-KISAN scheme', 'How to get fair price?', 'Fertilizer advice for tomato'],
    wholesaler: ['How to negotiate price?', 'What are pool purchases?', 'GST on fresh vegetables', 'How to book storage?'],
    logistics_driver: ['How to find new jobs?', 'How are payments made?', 'Route planning tips', 'Refrigerated load rates'],
    storage_owner: ['How to approve bookings?', 'What is WDRA accreditation?', 'How to update my rates?', 'Managing capacity'],
  };

  const btnColor = roleColor[userRole];

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={openBot}
          className={`fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-50 w-14 h-14 ${btnColor} text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}
          title="Ask KisanBot"
        >
          <Bot className="w-7 h-7" />
        </button>
      )}

      {/* Chat Drawer */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-8 sm:right-8 z-50 w-full sm:w-96 h-[85vh] sm:h-[580px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className={`${btnColor} text-white px-4 py-3 flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm">KisanBot</p>
                <p className="text-[11px] opacity-80 flex items-center gap-1">
                  {roleIcon[userRole]}
                  {userRole === 'farmer' ? 'Farmer Assistant'
                    : userRole === 'wholesaler' ? 'Trade Assistant'
                    : userRole === 'logistics_driver' ? 'Driver Assistant'
                    : 'Facility Assistant'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-paper/50">
            {messages.map(m => (
              <div key={m.id} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold ${m.role === 'bot' ? btnColor : 'bg-stone-400'}`}>
                  {m.role === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
                </div>
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed shadow-xs ${m.role === 'bot' ? 'bg-white text-ink border border-border rounded-tl-sm' : 'bg-field-green text-white rounded-tr-sm'}`}>
                  {m.text.split('**').map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-start gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${btnColor}`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-border px-3 py-2 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 border-t border-border bg-white shrink-0">
              <p className="text-[10px] font-semibold text-ink-muted mb-1.5">Quick Questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS[userRole].map(q => (
                  <button
                    key={q}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => {
                        const form = document.getElementById('kisanbot-form');
                        if (form) (form as HTMLFormElement).requestSubmit();
                      }, 50);
                    }}
                    className="px-2 py-1 bg-stone-100 hover:bg-field-green/10 text-ink text-[10px] rounded-lg border border-border hover:border-field-green transition-colors font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form
            id="kisanbot-form"
            onSubmit={sendMessage}
            className="p-3 border-t border-border bg-white flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about crops, schemes, prices..."
              className="flex-1 px-3 py-2 bg-stone-100 rounded-xl text-xs text-ink placeholder:text-ink-muted border border-transparent focus:border-field-green focus:bg-white outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              className={`w-9 h-9 ${btnColor} text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all`}
            >
              {typing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
};
