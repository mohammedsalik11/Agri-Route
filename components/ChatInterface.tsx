'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Store,
  Sprout,
  ShieldCheck,
  Search,
  ArrowLeft,
  Loader2,
  Sparkles,
  Package,
  Truck,
  Warehouse,
  Users,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useT } from '@/lib/i18n/LanguageProvider';

type AnyRole = 'farmer' | 'wholesaler' | 'logistics_driver' | 'storage_owner';

interface ChatMessage {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: AnyRole;
  text: string;
  createdAt: string;
  read: boolean;
}

interface Conversation {
  conversationId: string;
  participants: string[];
  participantDetails: Record<
    string,
    {
      userId: string;
      name: string;
      role: AnyRole;
      businessName?: string;
      district?: string;
    }
  >;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    timestamp: string;
  };
  cropReference?: {
    crop: string;
    variety?: string;
    quantityKg?: number;
    pricePerKgPaise?: number;
    poolId?: string;
    listingId?: string;
    orderId?: string;
  };
  unreadCount?: Record<string, number>;
  updatedAt: string;
}

interface ChatInterfaceProps {
  currentRole: AnyRole;
}

const getRoleIcon = (role: string) => {
  if (role === 'wholesaler') return <Store className="w-5 h-5" />;
  if (role === 'logistics_driver') return <Truck className="w-5 h-5" />;
  if (role === 'storage_owner') return <Warehouse className="w-5 h-5" />;
  return <Sprout className="w-5 h-5" />;
};

const getRoleColors = (role: string) => {
  if (role === 'wholesaler') return 'bg-amber-100 text-amber-800';
  if (role === 'logistics_driver') return 'bg-blue-100 text-blue-800';
  if (role === 'storage_owner') return 'bg-cyan-100 text-cyan-800';
  return 'bg-emerald-100 text-emerald-800';
};

const getRoleLabel = (role: string) => {
  if (role === 'wholesaler') return 'Wholesaler';
  if (role === 'logistics_driver') return 'Driver';
  if (role === 'storage_owner') return 'Storage';
  return 'Farmer';
};

interface DirectoryContact {
  id: string;
  name: string;
  role: AnyRole;
  location: string;
  badge: string;
  crop?: string;
  description: string;
}

const DIRECTORY_CONTACTS: Record<AnyRole, DirectoryContact[]> = {
  wholesaler: [
    {
      id: 'farmer_lakshmamma_ka',
      name: 'Lakshmamma (Farmer)',
      role: 'farmer',
      location: 'Mandya, Karnataka',
      badge: 'Certified Organic',
      crop: 'Tomato',
      description: 'Produces high-grade Bangalore Blue Tomato & Ragi lots',
    },
    {
      id: 'farmer_ramesh_patil_mh',
      name: 'Ramesh Patil (Farmer)',
      role: 'farmer',
      location: 'Nashik, Maharashtra',
      badge: 'APMC Top Producer',
      crop: 'Onion',
      description: 'Nashik Red Onion exporter quality, ready for bulk dispatch',
    },
    {
      id: 'farmer_gurpreet_singh_pb',
      name: 'Gurpreet Singh (Farmer)',
      role: 'farmer',
      location: 'Ludhiana, Punjab',
      badge: 'MSP Gold Standard',
      crop: 'Wheat',
      description: 'High-protein Sharbati Wheat, harvested & lab certified',
    },
    {
      id: 'farmer_rajesh_patel_gj',
      name: 'Rajesh Patel (Farmer)',
      role: 'farmer',
      location: 'Mehsana, Gujarat',
      badge: 'Verified FPO',
      crop: 'Potato',
      description: 'Large-scale processing variety potato, 10,000 kg pool',
    },
    {
      id: 'logistics_agriroute_fleet',
      name: 'AgriRoute Logistics Desk',
      role: 'logistics_driver',
      location: 'Pan-India Freight',
      badge: 'Live Fleet',
      description: 'Coordinate truck dispatch, reefer vans, & transit tracking',
    },
  ],
  farmer: [
    {
      id: 'wholesaler_suresh_traders_ka',
      name: 'Suresh Traders',
      role: 'wholesaler',
      location: 'Yeshwanthpur APMC, Bengaluru',
      badge: 'Verified Buyer',
      crop: 'Tomato & Vegetables',
      description: 'Guaranteed 24-hr payment escrow, buying 10,000+ kg weekly',
    },
    {
      id: 'wholesaler_reliance_fresh_mh',
      name: 'Reliance Fresh Hub',
      role: 'wholesaler',
      location: 'Pune / Mumbai Central',
      badge: 'Corporate Partner',
      crop: 'Onion & Potato',
      description: 'Direct procurement at premium over mandi modal rates',
    },
    {
      id: 'wholesaler_punjab_agro_pb',
      name: 'Punjab Agro Foods',
      role: 'wholesaler',
      location: 'Amritsar, Punjab',
      badge: 'Export Partner',
      crop: 'Wheat & Grains',
      description: 'Procuring Grade-A rabi grains with upfront escrow advance',
    },
    {
      id: 'logistics_agriroute_fleet',
      name: 'AgriRoute Logistics Desk',
      role: 'logistics_driver',
      location: 'Pan-India Freight',
      badge: 'Live Fleet',
      description: 'Book vehicle pickup from farmgate or pool point',
    },
    {
      id: 'storage_cold_chain_desk',
      name: 'AgriRoute Cold Chain Support',
      role: 'storage_owner',
      location: 'Pan-India Accredited',
      badge: 'WDRA Certified',
      description: 'Inquire on cold storage space, e-NWR receipts, and subsidies',
    },
  ],
  logistics_driver: [
    {
      id: 'farmer_lakshmamma_ka',
      name: 'Lakshmamma (Farmer Pickup)',
      role: 'farmer',
      location: 'Mandya Hub, Karnataka',
      badge: 'Farmgate Point',
      crop: 'Tomato',
      description: 'Contact farmer for loading location & farmgate gates',
    },
    {
      id: 'wholesaler_suresh_traders_ka',
      name: 'Suresh Traders (Receiving)',
      role: 'wholesaler',
      location: 'Bengaluru APMC Market',
      badge: 'Unloading Bay',
      description: 'Direct contact with warehouse receiving supervisor',
    },
    {
      id: 'farmer_ramesh_patil_mh',
      name: 'Ramesh Patil (Pickup)',
      role: 'farmer',
      location: 'Nashik Aggregation Point, MH',
      badge: 'Pool Yard',
      crop: 'Onion',
      description: 'Coordinating 10T Onion dispatch to Mumbai Market',
    },
  ],
  storage_owner: [
    {
      id: 'farmer_lakshmamma_ka',
      name: 'Lakshmamma (Produce Inward)',
      role: 'farmer',
      location: 'Mandya Hub, Karnataka',
      badge: 'Farmer Lot',
      crop: 'Tomato',
      description: 'Coordinate bay allocation and produce drop-off timing',
    },
    {
      id: 'wholesaler_suresh_traders_ka',
      name: 'Suresh Traders (Stock Release)',
      role: 'wholesaler',
      location: 'Bengaluru APMC Market',
      badge: 'Buyer Rep',
      description: 'Verification of release tokens and gate passes',
    },
  ],
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentRole }) => {
  const { t } = useT();
  const searchParams = useSearchParams();

  // URL query params for initial direct message launch
  const rawRecipientId = searchParams.get('userId');
  const initialRecipientName = searchParams.get('name');
  const initialCrop = searchParams.get('crop');
  const initialPoolId = searchParams.get('poolId');
  const initialListingId = searchParams.get('listingId');
  const initialOrderId = searchParams.get('orderId');

  const initialRecipientId =
    rawRecipientId ||
    (initialRecipientName
      ? 'user_' + encodeURIComponent(initialRecipientName.toLowerCase().replace(/\s+/g, '_'))
      : null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [activeTab, setActiveTab] = useState<'chats' | 'directory'>('chats');

  // Active recipient info if conversation not yet created
  const [pendingRecipient, setPendingRecipient] = useState<{
    id: string;
    name: string;
    role: AnyRole;
    crop?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 0. Fetch current user info for sender/recipient deduplication
  useEffect(() => {
    fetch('/api/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.data?.clerkUserId) {
          setCurrentUserId(data.data.clerkUserId);
        }
      })
      .catch(() => {});
  }, []);

  // 1. Fetch user conversations
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/messages');
      if (res.ok) {
        const data = await res.json();
        const convList: Conversation[] = data.data?.conversations || [];
        setConversations(convList);

        // If URL had a userId and matched existing conversation
        if (initialRecipientId) {
          const matched = convList.find((c) =>
            c.participants.includes(initialRecipientId)
          );
          if (matched) {
            setActiveConvId(matched.conversationId);
            setPendingRecipient(null);
            setMobileView('chat');
          } else {
            // Set pending recipient so user can initiate first message
            setPendingRecipient({
              id: initialRecipientId,
              name: initialRecipientName || 'Trade Partner',
              role: currentRole === 'farmer' ? 'wholesaler' : 'farmer',
              crop: initialCrop || undefined,
            });
            setActiveConvId(null);
            setMobileView('chat');
          }
        } else if (convList.length > 0 && !activeConvId && !pendingRecipient) {
          setActiveConvId(convList[0].conversationId);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [initialRecipientId]);

  // 2. Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConvId) return;

    setMessagesLoading(true);
    fetch(`/api/messages/${activeConvId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.data?.messages) {
          setMessages(data.data.messages);
          scrollToBottom();
        }
      })
      .catch((err) => console.error('Failed to load messages:', err))
      .finally(() => setMessagesLoading(false));

    // Polling every 5 seconds for live chat feel
    const interval = setInterval(() => {
      fetch(`/api/messages/${activeConvId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.ok && data.data?.messages) {
            setMessages(data.data.messages);
          }
        })
        .catch(() => {});
    }, 5000);

    return () => clearInterval(interval);
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Start chat with a directory contact
  const handleSelectContact = (contact: DirectoryContact) => {
    const existing = conversations.find((c) => c.participants.includes(contact.id));
    if (existing) {
      setActiveConvId(existing.conversationId);
      setPendingRecipient(null);
    } else {
      setActiveConvId(null);
      setPendingRecipient({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        crop: contact.crop,
      });
      setMessages([]);
    }
    setMobileView('chat');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  // 4. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const activeConv = conversations.find((c) => c.conversationId === activeConvId);

      // Robust recipient deduction: never assign current user as recipient
      let recipientId: string | undefined = pendingRecipient?.id;
      let recipientName: string | undefined = pendingRecipient?.name;
      let recipientRole: AnyRole | undefined = pendingRecipient?.role;

      if (!recipientId && activeConv) {
        if (currentUserId) {
          recipientId = activeConv.participants.find((p) => p !== currentUserId);
        }
        if (!recipientId) {
          const otherKey = Object.keys(activeConv.participantDetails).find(
            (id) => activeConv.participantDetails[id]?.role !== currentRole
          );
          recipientId = otherKey || activeConv.participants.find((p) => p !== activeConv.participants[0]);
        }
        if (recipientId && activeConv.participantDetails[recipientId]) {
          recipientName = activeConv.participantDetails[recipientId].name;
          recipientRole = activeConv.participantDetails[recipientId].role;
        }
      }

      if (!recipientId && !activeConvId) {
        throw new Error('No recipient specified');
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId || undefined,
          recipientId,
          recipientName: recipientName || undefined,
          recipientRole: recipientRole || undefined,
          text: messageText,
          cropReference:
            initialCrop || pendingRecipient?.crop
              ? {
                  crop: initialCrop || pendingRecipient?.crop || '',
                  poolId: initialPoolId || undefined,
                  listingId: initialListingId || undefined,
                  orderId: initialOrderId || undefined,
                }
              : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.conversationId) {
          const newConvId = data.data.conversationId;
          setActiveConvId(newConvId);
          setPendingRecipient(null);
          // Refetch messages and reload conversations
          const msgRes = await fetch(`/api/messages/${newConvId}`);
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(msgData.data?.messages || []);
          }
          loadConversations();
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.conversationId === activeConvId);
  const otherParticipant = activeConv
    ? (currentUserId
        ? Object.values(activeConv.participantDetails).find((p) => p.userId !== currentUserId)
        : null) ||
      Object.values(activeConv.participantDetails).find((p) => p.role !== currentRole) ||
      Object.values(activeConv.participantDetails)[0]
    : pendingRecipient
    ? {
        name: pendingRecipient.name,
        role: pendingRecipient.role,
        district: 'Direct Inquirer',
        userId: pendingRecipient.id,
      }
    : null;

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const other = Object.values(c.participantDetails).find((p) => p.role !== currentRole);
    return (
      (other?.name && other.name.toLowerCase().includes(q)) ||
      (c.lastMessage?.text && c.lastMessage.text.toLowerCase().includes(q)) ||
      (c.cropReference?.crop && c.cropReference.crop.toLowerCase().includes(q))
    );
  });

  const directoryList = DIRECTORY_CONTACTS[currentRole] || DIRECTORY_CONTACTS.farmer;

  return (
    <div className="bg-white rounded-3xl border border-border overflow-hidden shadow-xs h-[calc(100vh-130px)] min-h-[580px] flex flex-col md:flex-row">
      {/* Sidebar: Conversations & Contacts Directory */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-stone-50/60 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header & Tabs */}
        <div className="p-4 border-b border-border bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-ink flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-field-green" />
              {t('chat.directMessages')}
            </h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-field-green/10 text-field-green border border-field-green/20">
              {getRoleLabel(currentRole)}
            </span>
          </div>

          {/* Tab switcher: Chats vs Verified Directory */}
          <div className="flex rounded-xl bg-stone-100 p-1 mb-3">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'chats'
                  ? 'bg-white text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chats ({conversations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'directory'
                  ? 'bg-white text-field-green shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Directory</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder={activeTab === 'chats' ? t('chat.searchPlaceholder') : 'Search verified partners...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-100 rounded-xl text-xs text-ink placeholder:text-ink-muted border border-transparent focus:border-field-green focus:bg-white transition-all outline-hidden"
            />
          </div>
        </div>

        {/* Tab 1: Conversations List */}
        {activeTab === 'chats' ? (
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 text-ink-muted gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-field-green" />
                <p className="text-xs">{t('common.loading')}</p>
              </div>
            ) : filteredConversations.length === 0 && !pendingRecipient ? (
              <div className="p-6 text-center text-ink-muted space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-field-green/10 text-field-green mx-auto flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold text-sm text-ink">{t('chat.noConversations')}</p>
                  <p className="text-xs mt-1 text-ink-muted leading-relaxed">
                    Start a chat from produce listings, lots, or choose from our verified directory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-field-green text-white text-xs font-bold rounded-xl hover:bg-field-green-dark shadow-xs transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Open Partner Directory</span>
                </button>
              </div>
            ) : (
              <>
                {pendingRecipient && (
                  <button
                    onClick={() => {
                      setActiveConvId(null);
                      setMobileView('chat');
                    }}
                    className="w-full p-4 text-left flex items-start gap-3 transition-colors bg-field-green/10 border-l-4 border-field-green"
                  >
                    <div className="w-10 h-10 rounded-full bg-field-green/15 text-field-green flex items-center justify-center shrink-0 font-bold text-sm border border-field-green/30">
                      {pendingRecipient.name[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm text-ink truncate">
                          {pendingRecipient.name}
                        </p>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                          {t('chat.newInquirer')}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted truncate mt-0.5">
                        {pendingRecipient.crop
                          ? `${t('chat.lot')} ${pendingRecipient.crop}`
                          : `${t('chat.startConversation')}...`}
                      </p>
                    </div>
                  </button>
                )}

                {filteredConversations.map((c) => {
                  const other =
                    (currentUserId
                      ? Object.values(c.participantDetails).find((p) => p.userId !== currentUserId)
                      : null) ||
                    Object.values(c.participantDetails).find((p) => p.role !== currentRole) ||
                    Object.values(c.participantDetails)[0];
                  const isSelected = c.conversationId === activeConvId;

                  return (
                    <button
                      key={c.conversationId}
                      onClick={() => {
                        setActiveConvId(c.conversationId);
                        setPendingRecipient(null);
                        setMobileView('chat');
                      }}
                      className={`w-full p-3.5 text-left flex items-start gap-3 transition-all hover:bg-stone-100/70 ${
                        isSelected
                          ? 'bg-field-green/10 border-l-4 border-field-green font-medium'
                          : 'bg-white'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm border ${getRoleColors(
                          other?.role || 'farmer'
                        )}`}
                      >
                        {getRoleIcon(other?.role || 'farmer')}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm text-ink truncate">
                            {other?.name || 'Direct Trade Partner'}
                          </p>
                          <span className="text-[10px] text-ink-muted shrink-0">
                            {c.lastMessage?.timestamp
                              ? new Date(c.lastMessage.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>

                        {c.cropReference?.crop && (
                          <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 border border-emerald-200">
                            🌾 {c.cropReference.crop}
                          </span>
                        )}

                        <p className="text-xs text-ink-muted truncate mt-1">
                          {c.lastMessage?.text || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        ) : (
          /* Tab 2: Pan-India Verified Directory */
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="px-2 py-1 text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center justify-between">
              <span>Verified Pan-India Partners</span>
              <ShieldCheck className="w-3.5 h-3.5 text-field-green" />
            </div>

            {directoryList
              .filter((contact) => {
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                return (
                  contact.name.toLowerCase().includes(q) ||
                  contact.location.toLowerCase().includes(q) ||
                  contact.crop?.toLowerCase().includes(q) ||
                  contact.description.toLowerCase().includes(q)
                );
              })
              .map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white p-3 rounded-2xl border border-border hover:border-field-green transition-all shadow-2xs group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getRoleColors(
                        contact.role
                      )}`}
                    >
                      {getRoleIcon(contact.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-ink truncate group-hover:text-field-green transition-colors">
                          {contact.name}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-100 text-ink-muted">
                          {contact.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-field-green shrink-0" />
                        <span className="truncate">{contact.location}</span>
                      </p>
                      <p className="text-[11px] text-ink-muted mt-1 leading-snug line-clamp-2">
                        {contact.description}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between">
                        {contact.crop ? (
                          <span className="text-[10px] font-semibold text-field-green bg-field-green/10 px-2 py-0.5 rounded-full">
                            🌾 {contact.crop}
                          </span>
                        ) : (
                          <span className="text-[10px] text-ink-muted">Ready to Trade</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSelectContact(contact)}
                          className="px-2.5 py-1 bg-field-green text-white text-[11px] font-bold rounded-lg hover:bg-field-green-dark transition-all flex items-center gap-1 shadow-2xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Main Chat Window */}
      <div
        className={`flex-1 flex flex-col bg-paper h-full ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Chat Header */}
        {otherParticipant ? (
          <div className="px-5 py-3.5 bg-white border-b border-border flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileView('list')}
                className="md:hidden p-1.5 rounded-xl hover:bg-stone-100 text-ink"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${getRoleColors(
                  otherParticipant.role
                )}`}
              >
                {getRoleIcon(otherParticipant.role)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-ink">
                    {otherParticipant.name || 'Trade Partner'}
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-ink-muted">
                    {getRoleLabel(otherParticipant.role)}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-field-green" />
                  <span>{t('chat.verifiedChannel')}</span>
                </p>
              </div>
            </div>

            {/* Context Badge */}
            {(activeConv?.cropReference?.crop || initialCrop || pendingRecipient?.crop) && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-field-green/10 border border-field-green/20 rounded-xl text-xs font-bold text-field-green">
                <Package className="w-3.5 h-3.5" />
                <span>{t('chat.lot')} {activeConv?.cropReference?.crop || initialCrop || pendingRecipient?.crop}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-white border-b border-border flex items-center justify-between text-xs text-ink-muted">
            <span className="font-semibold">Direct Communication Channel</span>
            <span className="flex items-center gap-1 text-field-green font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Escrow Protected
            </span>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full text-ink-muted gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-field-green" />
              <p className="text-xs">{t('common.loading')}</p>
            </div>
          ) : !otherParticipant ? (
            /* Empty state when no conversation is selected */
            <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-white border border-border shadow-xs flex items-center justify-center text-field-green">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-ink">AgriRoute Direct Messenger</h3>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Select an active chat from the sidebar or click any verified partner from the directory to start coordinating produce orders, freight, and quality inspection.
                </p>
              </div>
              <div className="w-full pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('directory')}
                  className="w-full py-2.5 bg-field-green text-white font-bold text-xs rounded-xl hover:bg-field-green-dark shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span>Browse Verified Directory</span>
                </button>
              </div>
            </div>
          ) : messages.length === 0 ? (
            /* First conversation empty state */
            <div className="flex flex-col items-center justify-center h-full text-center text-ink-muted p-6">
              <div className="w-14 h-14 rounded-2xl bg-white border border-border flex items-center justify-center mb-3 text-field-green shadow-2xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <p className="font-bold text-sm text-ink">{t('chat.startConversation')}</p>
              <p className="text-xs max-w-sm mt-1 leading-relaxed text-ink-muted">
                Send a direct message to {otherParticipant.name} to confirm batch quality, negotiate price, or arrange farmgate pickup.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = currentUserId ? m.senderId === currentUserId : m.senderRole === currentRole;

              return (
                <div
                  key={m.messageId}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-baseline gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-ink-muted">
                      {isMe ? 'You' : m.senderName}
                    </span>
                    <span className="text-[9px] text-ink-muted/70">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] md:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-field-green text-white rounded-br-xs font-medium'
                        : 'bg-white text-ink border border-border rounded-bl-xs'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        {otherParticipant && (
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white border-t border-border flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              placeholder={t('chat.typeMessage')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending}
              className="flex-1 px-4 py-2.5 bg-stone-100 rounded-xl text-xs text-ink placeholder:text-ink-muted border border-transparent focus:border-field-green focus:bg-white outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className="px-4 py-2.5 bg-field-green text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-field-green-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{t('chatbot.send')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
