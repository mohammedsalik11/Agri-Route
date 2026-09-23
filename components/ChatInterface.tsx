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

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ currentRole }) => {
  const { t, formatCurrency } = useT();
  const searchParams = useSearchParams();

  // URL query params for initial direct message launch
  const initialRecipientId = searchParams.get('userId');
  const initialRecipientName = searchParams.get('name');
  const initialCrop = searchParams.get('crop');
  const initialPoolId = searchParams.get('poolId');
  const initialListingId = searchParams.get('listingId');
  const initialOrderId = searchParams.get('orderId');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  // Active recipient info if conversation not yet created
  const [pendingRecipient, setPendingRecipient] = useState<{
    id: string;
    name: string;
    role: AnyRole;
    crop?: string;
  } | null>(null);


  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
            setMobileView('chat');
          } else {
            // Set pending recipient so user can initiate first message
            setPendingRecipient({
              id: initialRecipientId,
              name: initialRecipientName || 'User',
              role: currentRole === 'farmer' ? 'wholesaler' : 'farmer',
              crop: initialCrop || undefined,
            });
            setMobileView('chat');
          }
        } else if (convList.length > 0 && !activeConvId) {
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

  // 3. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageText = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const activeConv = conversations.find((c) => c.conversationId === activeConvId);
      const recipientId =
        pendingRecipient?.id ||
        (activeConv
          ? Object.keys(activeConv.participantDetails).find(
              (id) => activeConv.participantDetails[id]?.role !== currentRole
            ) || activeConv.participants.find((p) => p !== activeConv.participants[0])
          : undefined);

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId || undefined,
          recipientId,
          recipientName: pendingRecipient?.name || undefined,
          recipientRole: pendingRecipient?.role || undefined,
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
          setActiveConvId(data.data.conversationId);
          setPendingRecipient(null);
          // Refetch messages and conversations list
          const msgRes = await fetch(`/api/messages/${data.data.conversationId}`);
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
    ? Object.values(activeConv.participantDetails).find((p) => p.role !== currentRole) ||
      Object.values(activeConv.participantDetails)[0]
    : pendingRecipient
    ? {
        name: pendingRecipient.name,
        role: pendingRecipient.role,
        district: 'Direct Inquirer',
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

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs h-[calc(100vh-140px)] min-h-[550px] flex flex-col md:flex-row">
      {/* Sidebar: Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-stone-50/50 ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header & Search */}
        <div className="p-4 border-b border-border bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-ink flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-field-green" />
              Direct Messages
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-field-green/10 text-field-green">
              {getRoleLabel(currentRole)} Connect
            </span>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search conversations or produce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-100 rounded-xl text-xs text-ink placeholder:text-ink-muted border border-transparent focus:border-field-green focus:bg-white transition-all outline-hidden"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-ink-muted gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-field-green" />
              <p className="text-xs">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 && !pendingRecipient ? (
            <div className="p-8 text-center text-ink-muted">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-ink-muted/40" />
              <p className="font-semibold text-sm text-ink">No conversations yet</p>
              <p className="text-xs mt-1">
                Messages from traders and partners will appear here.
              </p>
            </div>
          ) : (
            <>
              {pendingRecipient && (
                <button
                  onClick={() => {
                    setActiveConvId(null);
                    setMobileView('chat');
                  }}
                  className={`w-full p-4 text-left flex items-start gap-3 transition-colors bg-field-green/5 border-l-4 border-field-green`}
                >
                  <div className="w-10 h-10 rounded-full bg-field-green/10 flex items-center justify-center text-field-green shrink-0 font-bold text-sm">
                    {pendingRecipient.name[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-ink truncate">
                        {pendingRecipient.name}
                      </p>
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        New Inquirer
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted truncate mt-0.5">
                      {pendingRecipient.crop
                        ? `Regarding ${pendingRecipient.crop} listing`
                        : 'Start a conversation...'}
                    </p>
                  </div>
                </button>
              )}

              {filteredConversations.map((c) => {
                const other =
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
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-all hover:bg-stone-100/60 ${
                      isSelected
                        ? 'bg-field-green/10 border-l-4 border-field-green font-medium'
                        : 'bg-white'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${getRoleColors(other?.role || 'farmer')}`}
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
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5">
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
      </div>

      {/* Main Chat Window */}
      <div
        className={`flex-1 flex flex-col bg-paper h-full ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Chat Header */}
        {otherParticipant ? (
          <div className="px-4 py-3.5 bg-white border-b border-border flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileView('list')}
                className="md:hidden p-1.5 rounded-lg hover:bg-stone-100 text-ink"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRoleColors(otherParticipant.role)}`}
              >
                {getRoleIcon(otherParticipant.role)}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-ink">
                    {otherParticipant.name || 'Trade Partner'}
                  </h2>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-ink-muted">
                    {getRoleLabel(otherParticipant.role)}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-field-green" />
                  Verified Direct Trade Channel
                </p>
              </div>
            </div>

            {/* Context Badge */}
            {(activeConv?.cropReference?.crop || initialCrop || pendingRecipient?.crop) && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-field-green/10 border border-field-green/20 rounded-xl text-xs font-semibold text-field-green">
                <Package className="w-3.5 h-3.5" />
                Lot: {activeConv?.cropReference?.crop || initialCrop || pendingRecipient?.crop}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-white border-b border-border text-center text-sm font-semibold text-ink-muted">
            Select a conversation to start messaging
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full text-ink-muted gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-field-green" />
              <p className="text-xs">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-ink-muted p-6">
              <div className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center mb-3 text-field-green shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="font-bold text-sm text-ink">Start the Conversation</p>
              <p className="text-xs max-w-xs mt-1">
                Directly communicate regarding pricing, harvest inspection, pickup schedule, or quality confirmation.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMe = m.senderRole === currentRole;

              return (
                <div
                  key={m.messageId}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-[10px] font-semibold text-ink-muted">
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
                    className={`max-w-[80%] md:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isMe
                        ? 'bg-field-green text-white rounded-br-xs'
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
              type="text"
              placeholder="Type your message..."
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
              <span>Send</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
