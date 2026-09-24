'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Loader2,
  Sparkles,
  RotateCcw,
  User,
  ChevronRight,
} from 'lucide-react';
import { useT, useLanguage } from '@/lib/i18n/LanguageProvider';

type Role = 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
  source?: 'gemini-ai' | 'kisan-knowledge';
}

// Custom Natural Agricultural Icon (Two vibrant leaves with golden morning dewdrop)
export const NaturalAgriIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="leafGrad1" x1="12" y1="36" x2="36" y2="8" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#34D399" />
      </linearGradient>
      <linearGradient id="leafGrad2" x1="20" y1="38" x2="42" y2="16" gradientUnits="userSpaceOnUse">
        <stop stopColor="#059669" />
        <stop offset="1" stopColor="#10B981" />
      </linearGradient>
      <linearGradient id="sunDrop" x1="24" y1="6" x2="28" y2="12" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
    {/* Stem & Soil Roots */}
    <path
      d="M24 42C24 34 24 22 24 16"
      stroke="#047857"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
    {/* Left Main Leaf */}
    <path
      d="M24 24C16 22 10 16 10 9C17 9 23 15 24 24Z"
      fill="url(#leafGrad1)"
    />
    <path
      d="M24 24C16 22 10 16 10 9C17 9 23 15 24 24Z"
      stroke="#065F46"
      strokeWidth="1.2"
    />
    {/* Right Second Leaf */}
    <path
      d="M24 18C31 16 38 20 38 28C30 28 25 22 24 18Z"
      fill="url(#leafGrad2)"
    />
    <path
      d="M24 18C31 16 38 20 38 28C30 28 25 22 24 18Z"
      stroke="#065F46"
      strokeWidth="1.2"
    />
    {/* Golden Dewdrop / Sunlit Bud */}
    <circle cx="24" cy="11" r="3.2" fill="url(#sunDrop)" />
    <circle cx="23.2" cy="10" r="1" fill="#FFFFFF" />
  </svg>
);

const SUGGESTIONS_BY_LANG: Record<'en' | 'kn' | 'hi', Record<Role, string[]>> = {
  kn: {
    farmer: [
      'ನನ್ನ ದರವನ್ನು ಬದಲಾಯಿಸುವುದು ಹೇಗೆ?',
      'ಟೊಮೆಟೊ ಬೆಳೆಗೆ ಯಾವ ಗೊಬ್ಬರ ಉತ್ತಮ?',
      'ಪಿಎಂ-ಕಿಸಾನ್ ₹6,000 ಯೋಜನೆ ಮಾಹಿತಿ',
      'ಆಲೂಗಡ್ಡೆ ಅಂಗಮಾರಿ ರೋಗ ಪರಿಹಾರ',
    ],
    wholesaler: [
      'ರೈತರೊಂದಿಗೆ ಬೆಲೆ ಮಾತುಕತೆ ನಡೆಸುವುದು ಹೇಗೆ?',
      'ಬಲ್ಕ್ ಪೂಲಿಂಗ್ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ?',
      'ಶೈತ್ಯಾಗಾರ ಕಾಯ್ದಿರಿಸುವುದು ಹೇಗೆ?',
      'ತರಕಾರಿಗಳ ಮೇಲಿನ ಜಿಎಸ್‌ಟಿ ಎಷ್ಟು?',
    ],
    logistics_driver: [
      'ಅಗ್ರಿರೌಟ್‌ನಲ್ಲಿ ಲೋಡ್‌ಗಳನ್ನು ಪಡೆಯುವುದು ಹೇಗೆ?',
      'ಕೋಲ್ಡ್ ಚೈನ್ ಟ್ರಕ್‌ಗಳ ದರ ಎಷ್ಟು?',
      'ಡೆಲಿವರಿ ಒಟಿಪಿ ಪರಿಶೀಲನೆ ಹೇಗೆ?',
      'ಟ್ರಿಪ್ ಪಾವತಿಗಳು ಹೇಗೆ ಬಿಡುಗಡೆಯಾಗುತ್ತವೆ?',
    ],
    storage_owner: [
      'ನನ್ನ ಬಾಡಿಗೆ ದರ ಮತ್ತು ಸಾಮರ್ಥ್ಯ ಬದಲಾಯಿಸುವುದು ಹೇಗೆ?',
      'WDRA ಮಾನ್ಯತೆ ಮತ್ತು e-NWR ಎಂದರೇನು?',
      'ಟೊಮೆಟೊ ಮತ್ತು ಆಲೂಗಡ್ಡೆ ಸಂಗ್ರಹ ತಾಪಮಾನ',
      'ಬುಕಿಂಗ್ ವಿನಂತಿಗಳನ್ನು ಅನುಮೋದಿಸುವುದು ಹೇಗೆ?',
    ],
  },
  hi: {
    farmer: [
      'अपना रेट/भाव कैसे बदलें?',
      'टमाटर के लिए सबसे अच्छी खाद कौन सी है?',
      'पीएम-किसान ₹6,000 योजना की जानकारी',
      'आलू का झुलसा रोग कैसे ठीक करें?',
    ],
    wholesaler: [
      'किसान से भाव पर बातचीत कैसे करें?',
      'बल्क प्रोड्यूस पूल कैसे काम करता है?',
      'कोल्ड स्टोरेज कैसे बुक करें?',
      'ताज़ी सब्जियों पर जीएसटी कितना है?',
    ],
    logistics_driver: [
      'एग्रीरूट पर लोड कैसे स्वीकार करें?',
      'रेफ्रिजरेटेड ट्रक के रेट क्या हैं?',
      'डिलीवरी ओटीपी कैसे सत्यापित करें?',
      'भुगतान कैसे जारी होता है?',
    ],
    storage_owner: [
      'अपने किराया रेट और क्षमता कैसे अपडेट करें?',
      'WDRA प्रमाणन और e-NWR क्या है?',
      'टमाटर और आलू का सही भंडारण तापमान',
      'बुकिंग अनुरोध कैसे स्वीकृत करें?',
    ],
  },
  en: {
    farmer: [
      'How to update my rates or prices?',
      'What fertilizer is best for Tomato?',
      'Tell me about PM-KISAN ₹6000 scheme',
      'How to cure leaf blight in potato?',
    ],
    wholesaler: [
      'How to negotiate price with a farmer?',
      'How does bulk produce pooling work?',
      'How to book cold storage for bulk lots?',
      'What is the GST on fresh vegetables?',
    ],
    logistics_driver: [
      'How to accept loads on AgriRoute?',
      'What are the rates for refrigerated trucks?',
      'How does OTP delivery verification work?',
      'How are trip payments released?',
    ],
    storage_owner: [
      'How to update my rates and capacity?',
      'What is WDRA accreditation & e-NWR?',
      'Optimal temperature for tomato & potato',
      'How to approve farmer storage bookings?',
    ],
  },
};

interface KisanBotProps {
  userRole?: Role;
}

export const KisanBot: React.FC<KisanBotProps> = ({ userRole = 'farmer' }) => {
  const { t } = useT();
  const { language } = useLanguage();
  const lang = (language === 'kn' || language === 'hi' || language === 'en') ? language : 'en';

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getWelcomeText = () => {
    if (lang === 'kn') {
      return `ನಮಸ್ಕಾರ! 🌾 ನಾನು **ಕಿಸಾನ್ AI**, ನಿಮ್ಮ ಕೃಷಿ ಮತ್ತು ಅಗ್ರಿರೌಟ್ ಮಾರ್ಗದರ್ಶಿ.
- **ದರಗಳನ್ನು ಬದಲಾಯಿಸುವುದು**: ಮೇಲಿನ ಮೆನುವಿನಲ್ಲಿರುವ **ಪಾತ್ರ** ಬಟನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಬಾಡಿಗೆ ಅಥವಾ ಮಾರಾಟ ದರಗಳನ್ನು ನವೀಕರಿಸಿ.
- **ಬೆಳೆ ರಕ್ಷಣೆ & ಕೀಟ ನಿರ್ವಹಣೆ**: ಅಂಗಮಾರಿ, ಕಾಯಿ ಕೊರಕ ಮತ್ತು ಜೈವಿಕ ಔಷಧಗಳು.
- **ರಸಗೊಬ್ಬರ & ಪೋಷಣೆ**: ಡಿಎಪಿ, ಯೂರಿಯಾ, ಎನ್‌ಪಿಕೆ 19:19:19.
- **ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು**: ಪಿಎಂ-ಕಿಸಾನ್ ₹6,000, ಪಿಎಂಎಫ್‌ಬಿವೈ ವಿಮೆ, ಕೆಸಿಸಿ ಸಾಲ.

ನಿಮಗೆ ಇಂದು ಯಾವ ಮಾಹಿತಿ ಬೇಕು?`;
    }
    if (lang === 'hi') {
      return `नमस्ते! 🌾 मैं **किसान AI** हूँ, आपका कृषि और एग्रीरूट प्लेटफॉर्म सहायक।
- **दरें अपडेट करना**: शीर्ष मेनू में **भूमिका** बटन पर क्लिक करके किराया या बिक्री दरें बदलें।
- **फसल सुरक्षा और कीट नियंत्रण**: झुलसा रोग, फल छेदक कीट, जैविक स्प्रे।
- **उर्वरक कार्यक्रम**: डीएपी, यूरिया, एनपीके सही मात्रा।
- **सरकारी योजनाएं**: पीएम-किसान ₹6,000, फसल बीमा, केसीसी लोन।

आज मैं आपकी क्या सहायता कर सकता हूँ?`;
    }
    return `Namaskara! 🌾 I am **KisanAI**, your intelligent agricultural and AgriRoute guide.
- **Updating Rates**: Click your **Role** button in the top navigation bar to change prices or capacity.
- **Crop Protection & Pest Cures**: Remedies for blight, borers, and wilt.
- **Fertilizer Guidance**: Dosage and timing for DAP, Urea, and NPK.
- **Government Schemes**: PM-KISAN ₹6000, PMFBY insurance, KCC loans.

How can I assist your farm or business today?`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const openBot = () => {
    setOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          text: getWelcomeText(),
          timestamp: new Date().toISOString(),
          source: 'kisan-knowledge',
        },
      ]);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'bot',
        text: getWelcomeText(),
        timestamp: new Date().toISOString(),
        source: 'kisan-knowledge',
      },
    ]);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userRole,
          language: lang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          role: 'bot',
          text: data.text || 'I am ready to help. Could you please rephrase your query?',
          timestamp: new Date().toISOString(),
          source: data.source || 'kisan-knowledge',
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(`API error: ${res.status}`);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackText = lang === 'kn'
        ? `ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ. ಬೆಳೆಗಳು, ರಸಗೊಬ್ಬರಗಳು, ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಅಥವಾ ಅಗ್ರಿರೌಟ್‌ನಲ್ಲಿ ದರಗಳನ್ನು ನವೀಕರಿಸುವ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ!`
        : lang === 'hi'
        ? `मैं आपकी सहायता के लिए तैयार हूँ। फसलों, खाद, सरकारी योजनाओं या एग्रीरूट पर दरें अपडेट करने के बारे में कोई भी प्रश्न पूछें!`
        : `I am here to assist. Ask me about crops, fertilizers, government schemes, or how to update rates in AgriRoute!`;

      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'bot',
        text: fallbackText,
        timestamp: new Date().toISOString(),
        source: 'kisan-knowledge',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Heading ###
          if (trimmed.startsWith('###')) {
            return (
              <h4 key={idx} className="font-bold text-emerald-950 text-xs mt-2 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 inline" />
                {trimmed.replace(/^###\s*/, '')}
              </h4>
            );
          }
          // Heading ##
          if (trimmed.startsWith('##')) {
            return (
              <h3 key={idx} className="font-bold text-emerald-950 text-sm mt-2 mb-1">
                {trimmed.replace(/^##\s*/, '')}
              </h3>
            );
          }
          // Bullet point * or -
          if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
            const content = trimmed.replace(/^[\*\-]\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-emerald-600 font-bold leading-tight mt-0.5">•</span>
                <span className="flex-1">{formatInlineBold(content)}</span>
              </div>
            );
          }
          // Numbered item 1.
          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+\.)\s/)?.[1] || '•';
            const content = trimmed.replace(/^\d+\.\s*/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 ml-1">
                <span className="text-emerald-700 font-bold shrink-0">{num}</span>
                <span className="flex-1">{formatInlineBold(content)}</span>
              </div>
            );
          }

          return <p key={idx}>{formatInlineBold(trimmed)}</p>;
        })}
      </div>
    );
  };

  const formatInlineBold = (str: string) => {
    const parts = str.split('**');
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-bold text-emerald-900">
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  const currentSuggestions = SUGGESTIONS_BY_LANG[lang]?.[userRole] || SUGGESTIONS_BY_LANG.en[userRole];

  return (
    <>
      {/* Natural Floating Button */}
      {!open && (
        <button
          onClick={openBot}
          className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 z-50 group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 hover:from-emerald-800 hover:to-green-700 text-white rounded-full shadow-xl shadow-emerald-900/25 border-2 border-white/40 hover:scale-105 active:scale-95 transition-all"
          title={t('chatbot.name')}
        >
          {/* Natural Sprout & Leaf Emblem */}
          <div className="relative w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
            <NaturalAgriIcon className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-emerald-700 animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="font-extrabold text-xs tracking-wide flex items-center gap-1">
              <span>{t('chatbot.name')}</span>
              <Sparkles className="w-3 h-3 text-amber-200" />
            </p>
            <p className="text-[10px] text-emerald-100 font-medium leading-none">
              {t('chatbot.tagline')}
            </p>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] h-[90vh] sm:h-[620px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-emerald-200/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Natural Lush Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white px-5 py-3.5 flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-3">
              {/* Natural Leaf & Sprout Avatar */}
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-amber-200 shadow-inner">
                <NaturalAgriIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm tracking-tight">{t('chatbot.name')}</h3>
                  <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                    {t('chatbot.smartAi')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  <p className="text-[11px] text-emerald-100 font-medium">
                    {userRole === 'farmer' && t('chatbot.farmerExpert')}
                    {userRole === 'wholesaler' && t('chatbot.wholesalerExpert')}
                    {userRole === 'logistics_driver' && t('chatbot.driverExpert')}
                    {userRole === 'storage_owner' && t('chatbot.storageExpert')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                title={t('chatbot.restart')}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                title={t('chatbot.close')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-emerald-900 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              {t('chatbot.askLabel')}
            </span>
            {currentSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white hover:bg-emerald-100 text-emerald-950 border border-emerald-200/90 shadow-2xs hover:border-emerald-400 transition-all flex items-center gap-1"
              >
                <span>{s}</span>
                <ChevronRight className="w-2.5 h-2.5 text-emerald-600" />
              </button>
            ))}
          </div>

          {/* Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-50/60">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                      isUser
                        ? 'bg-stone-700 text-white'
                        : 'bg-gradient-to-tr from-emerald-700 to-green-500 text-white'
                    }`}
                  >
                    {isUser ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <NaturalAgriIcon className="w-4 h-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-2xs ${
                      isUser
                        ? 'bg-emerald-700 text-white rounded-tr-xs text-xs leading-relaxed font-medium'
                        : 'bg-white text-ink border border-emerald-100 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? m.text : renderFormattedText(m.text)}

                    {/* Metadata timestamp */}
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        isUser ? 'text-emerald-200' : 'text-stone-400'
                      }`}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-700 to-green-500 text-white flex items-center justify-center shrink-0">
                  <NaturalAgriIcon className="w-4 h-4" />
                </div>
                <div className="bg-white border border-emerald-100 px-4 py-3 rounded-2xl rounded-tl-xs flex items-center gap-2 shadow-2xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span className="text-xs text-emerald-800 font-medium">{t('chatbot.analyzing')}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-emerald-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder={t('chatbot.inputPlaceholder')}
              className="flex-1 px-4 py-2.5 bg-stone-100 rounded-xl text-xs text-ink placeholder:text-stone-400 border border-transparent focus:border-emerald-500 focus:bg-white outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs active:scale-95 shrink-0"
              title={t('chatbot.send')}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
};
