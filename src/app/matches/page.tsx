'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getNeutralAvatarUrl } from '../../lib/supabase';
import { MatchCard } from '../../components/match-card';
import { HandoverModal } from '../../components/handover-modal';
import { FeedbackModal } from '../../components/feedback-modal';
import { Conversation, Message, Interest, Listing, User } from '../../types';
import {
  Sparkles, MessageSquare, Send, Search, MapPin, CheckCircle2,
  Check, X, Clock, ArrowLeft, Tag, Info, AlertCircle, RefreshCw, UserCheck,
  ChevronDown, SearchCode
} from 'lucide-react';

function MatchesAndConversationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedConvParam = searchParams.get('conversation');
  const activeTabParam = searchParams.get('tab') || 'conversations';

  const {
    listings,
    interests,
    handovers,
    matches,
    messages,
    lookingFor,
    acceptInterest,
    declineInterest,
    completeExchange,
    sendMessage,
    markConversationRead,
  } = useApp();

  const { currentUser, users } = useAuth();

  const [activeTab, setActiveTab] = useState<'conversations' | 'demand'>(
    activeTabParam === 'demand' ? 'demand' : 'conversations'
  );
  const [selectedInterestId, setSelectedInterestId] = useState<string | null>(selectedConvParam);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Modals state
  const [handoverModalData, setHandoverModalData] = useState<{ listingId: string; interestId: string } | null>(null);
  const [feedbackModalData, setFeedbackModalData] = useState<{ exchangeId: string; toUserId: string; toUserName: string } | null>(null);

  // Chat scroll management refs & states
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [unreadWhileScrolledUp, setUnreadWhileScrolledUp] = useState(0);

  const prevConvIdRef = useRef<string | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  const isNearBottomRef = useRef<boolean>(true);

  // Helper to determine if user is within threshold of the bottom
  const checkIfNearBottom = (container: HTMLElement, threshold = 100) => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight <= threshold;
  };

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    setShowJumpToBottom(false);
    setUnreadWhileScrolledUp(0);
    isNearBottomRef.current = true;
  }, []);

  // Handler for user scrolling inside the chat box
  const handleChatScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const nearBottom = checkIfNearBottom(container, 100);
    isNearBottomRef.current = nearBottom;
    setShowJumpToBottom(!nearBottom);

    if (nearBottom) {
      setUnreadWhileScrolledUp(0);
    }
  }, []);

  // Sync selectedInterestId from URL searchParams
  useEffect(() => {
    if (selectedConvParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedInterestId(selectedConvParam);
      setActiveTab('conversations');
    }
  }, [selectedConvParam]);

  // Compute all conversations involving the currentUser
  const conversations = useMemo((): Conversation[] => {
    if (!currentUser) return [];

    // 1. All interests where currentUser is the interested student OR the listing owner
    const relevantInterests = interests.filter((interest) => {
      const listing = listings.find((l) => l.id === interest.listing_id);
      return interest.student_id === currentUser.id || (listing && listing.owner_id === currentUser.id);
    });

    const listingConversations: Conversation[] = relevantInterests.map((interest) => {
      const listing = listings.find((l) => l.id === interest.listing_id) || {
        id: interest.listing_id,
        title: 'Item Listing',
        owner_id: '',
        category: 'Other' as const,
        condition: 'Good' as const,
        mode: 'Exchange' as const,
        description: '',
        images: [],
        status: 'AVAILABLE' as const,
        created_at: interest.created_at,
        updated_at: interest.updated_at,
      };

      const isOwner = listing.owner_id === currentUser.id;
      const otherUserId = isOwner ? interest.student_id : listing.owner_id;
      const otherUser =
        users.find((u) => u.id === otherUserId) ||
        (isOwner ? interest.student : listing.owner) || {
          id: otherUserId,
          name: isOwner ? 'Interested Student' : 'Listing Owner',
          email: '',
          branch: 'VNR Student',
          batch: '',
          role: 'student' as const,
          created_at: '',
        };

      // Find all messages for this interest
      const convMessages = messages
        .filter((m) => m.interest_id === interest.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      const lastMessage = convMessages[convMessages.length - 1];
      const unreadCount = convMessages.filter(
        (m) => m.recipient_id === currentUser.id && !m.read && !m.system_event
      ).length;

      return {
        interest,
        listing,
        otherUser,
        lastMessage,
        unreadCount,
        status: (
          interest.status?.toUpperCase() === 'DECLINED'
            ? 'DECLINED'
            : listing.status === 'COMPLETED'
            ? 'COMPLETED'
            : listing.status === 'HANDOVER_PLANNED'
            ? 'HANDOVER_PLANNED'
            : interest.status === 'ACCEPTED' || listing.status === 'RESERVED'
            ? 'ACCEPTED'
            : interest.status || 'PENDING'
        ) as any,
        updated_at: lastMessage?.created_at || interest.updated_at || interest.created_at,
      };
    });

    // 2. All Looking For offer conversations involving currentUser
    const lookingForOfferThreads = new Map<string, Message[]>();
    messages.forEach((m) => {
      if (
        m.interest_id?.startsWith('lf_') &&
        (m.sender_id === currentUser.id || m.recipient_id === currentUser.id)
      ) {
        const list = lookingForOfferThreads.get(m.interest_id) || [];
        list.push(m);
        lookingForOfferThreads.set(m.interest_id, list);
      }
    });

    const lookingForConversations: Conversation[] = Array.from(lookingForOfferThreads.entries()).map(
      ([threadId, threadMessages]) => {
        const sortedMsgs = [...threadMessages].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const parts = threadId.split('_');
        const reqId = parts[1];
        const offererId = parts[2];

        const req = lookingFor.find((r) => r.id === reqId) || {
          id: reqId,
          title: 'Requested Item',
          category: 'Other' as const,
          mode: 'ANY' as const,
          description: '',
          student_id: offererId === currentUser.id ? '' : currentUser.id,
          status: 'OPEN' as const,
          created_at: sortedMsgs[0]?.created_at || new Date().toISOString(),
          updated_at: sortedMsgs[sortedMsgs.length - 1]?.created_at || new Date().toISOString(),
        };

        const isOfferer = currentUser.id === offererId;
        const otherUserId = isOfferer ? req.student_id : offererId;
        const otherUser =
          users.find((u) => u.id === otherUserId) ||
          (isOfferer ? req.student : users.find((u) => u.id === offererId)) || {
            id: otherUserId,
            name: isOfferer ? 'Request Author' : 'Helpful Student',
            email: '',
            branch: 'VNR Student',
            batch: '',
            role: 'student' as const,
            created_at: '',
          };

        const lastMessage = sortedMsgs[sortedMsgs.length - 1];
        const unreadCount = sortedMsgs.filter(
          (m) => m.recipient_id === currentUser.id && !m.read && !m.system_event
        ).length;

        const dummyListing: Listing = {
          id: `lf-${req.id}`,
          title: `Looking For: ${req.title}`,
          owner_id: req.student_id,
          category: req.category,
          condition: 'Good',
          mode: (req.mode === 'BUY' ? 'Sell' : req.mode === 'DONATE' ? 'Donate' : 'Exchange') as any,
          description: req.description,
          images: [],
          status: 'AVAILABLE',
          created_at: req.created_at,
          updated_at: req.updated_at,
        };

        const dummyInterest: Interest = {
          id: threadId,
          listing_id: `lf-${req.id}`,
          student_id: offererId,
          message: sortedMsgs[0]?.content || '',
          status: 'ACCEPTED',
          created_at: sortedMsgs[0]?.created_at || new Date().toISOString(),
          updated_at: lastMessage?.created_at || new Date().toISOString(),
        };

        return {
          interest: dummyInterest,
          listing: dummyListing,
          lookingFor: req,
          otherUser,
          lastMessage,
          unreadCount,
          status: (req.status || 'OPEN') as any,
          updated_at: lastMessage?.created_at || req.updated_at || req.created_at,
        };
      }
    );

    return [...listingConversations, ...lookingForConversations].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [currentUser, interests, listings, messages, users]);

  // Selected conversation object
  const activeConversation = useMemo(() => {
    if (!selectedInterestId) return null;
    return conversations.find((c) => c.interest.id === selectedInterestId) || null;
  }, [conversations, selectedInterestId]);

  // Messages for the active conversation
  const activeMessages = useMemo(() => {
    if (!selectedInterestId) return [];
    return messages
      .filter((m) => m.interest_id === selectedInterestId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, selectedInterestId]);

  // Mark active conversation as read only when there are unread messages
  useEffect(() => {
    if (selectedInterestId && currentUser) {
      const hasUnread = activeMessages.some(
        (m) => m.recipient_id === currentUser.id && !m.read && !m.system_event
      );
      if (hasUnread) {
        markConversationRead(selectedInterestId);
      }
    }
  }, [selectedInterestId, currentUser, markConversationRead, activeMessages]);

  // Automatically scroll to bottom when a conversation is first opened or switched
  useEffect(() => {
    if (!selectedInterestId) return;

    if (prevConvIdRef.current !== selectedInterestId) {
      prevConvIdRef.current = selectedInterestId;
      prevMessageCountRef.current = activeMessages.length;
      isNearBottomRef.current = true;
      setShowJumpToBottom(false);
      setUnreadWhileScrolledUp(0);

      // Instant scroll to bottom when conversation is opened for the first time
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [selectedInterestId, activeMessages.length, scrollToBottom]);

  // Handle incoming or sent messages:
  // Scroll to bottom only if user sent the message OR user is already near bottom.
  // If user has scrolled upward to read older messages, preserve position without forcing scroll.
  useEffect(() => {
    const prevCount = prevMessageCountRef.current;
    const currentCount = activeMessages.length;
    prevMessageCountRef.current = currentCount;

    // Do nothing if message count did not increase (e.g. read status update, same message array)
    if (currentCount <= prevCount) {
      return;
    }

    const lastMsg = activeMessages[activeMessages.length - 1];
    const isSentByMe = currentUser && lastMsg?.sender_id === currentUser.id;

    if (isSentByMe) {
      // Sent by current user -> auto-scroll smoothly to bottom
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
      return;
    }

    // New message from other party:
    if (isNearBottomRef.current) {
      // User is already near bottom -> auto-scroll smoothly to bottom
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
    } else {
      // User is scrolled up reading history -> preserve position, show jump button with badge
      setUnreadWhileScrolledUp((prev) => prev + (currentCount - prevCount));
      setShowJumpToBottom(true);
    }
  }, [activeMessages, currentUser, scrollToBottom]);

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(
      (c) =>
        c.listing.title.toLowerCase().includes(q) ||
        c.otherUser.name.toLowerCase().includes(q) ||
        (c.lastMessage?.content && c.lastMessage.content.toLowerCase().includes(q))
    );
  }, [conversations, searchQuery]);

  // Total unread across conversations
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  }, [conversations]);

  // Handler to send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation || !currentUser || isSending) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      await sendMessage(
        activeConversation.interest.id,
        activeConversation.otherUser.id,
        content,
        activeConversation.listing.id
      );
      // Ensure smooth scroll to bottom so the sent message is immediately visible
      scrollToBottom('smooth');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'RESERVED':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Reserved / Accepted</span>;
      case 'HANDOVER_PLANNED':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Handover Planned</span>;
      case 'COMPLETED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Completed</span>;
      case 'DECLINED':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Request Declined</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">Pending</span>;
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white border border-stone-200/80 rounded-3xl p-16 text-center space-y-4 shadow-sm max-w-xl mx-auto my-12">
        <MessageSquare className="w-12 h-12 text-[#E9784B] mx-auto opacity-80" />
        <h2 className="text-xl font-bold text-stone-900">Sign In to View Matches & Messages</h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Log in with your student account to communicate with owners, coordinate campus handovers, and track transactions.
        </p>
        <Link
          href="/login"
          className="inline-block bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-sm"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  // Planned handover for active conversation (if any)
  const activeHandover = activeConversation
    ? handovers.find((h) => h.interest_id === activeConversation.interest.id || h.listing_id === activeConversation.listing.id)
    : null;

  const isOwnerOfActive = activeConversation?.listing.owner_id === currentUser.id;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="pb-4 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#FFF1E8] border border-[#F6C7A9] text-[#E9784B] text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>PassOn Campus Communication Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
            Matches & Conversations
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Coordinate campus handovers, exchange follow-up messages, and monitor automated demand-supply matches.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200/80">
          <button
            onClick={() => {
              setActiveTab('conversations');
              router.replace('/matches?tab=conversations');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'conversations'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#E9784B]" />
            <span>Conversations</span>
            {totalUnreadCount > 0 && (
              <span className="bg-[#E9784B] text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {totalUnreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('demand');
              router.replace('/matches?tab=demand');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'demand'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Demand Engine ({matches.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Conversations & Messages Master-Detail View */}
      {activeTab === 'conversations' && (
        <div className="bg-white border border-stone-200/90 rounded-3xl shadow-sm overflow-hidden min-h-[600px] h-[calc(100vh-14rem)] max-h-[760px] grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Conversation Threads List */}
          <div
            className={`lg:col-span-4 border-r border-stone-200 flex flex-col ${
              selectedInterestId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Search Bar */}
            <div className="p-3.5 border-b border-stone-100 bg-stone-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student or item..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-[#E9784B]"
                />
              </div>
            </div>

            {/* Conversation List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
              {filteredConversations.length === 0 ? (
                <div className="p-10 text-center space-y-3">
                  <MessageSquare className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-xs font-bold text-stone-700">No active conversations</p>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    When you express interest in a marketplace item or a student requests your listing, conversations appear here.
                  </p>
                  <Link
                    href="/marketplace"
                    className="inline-block bg-[#FFF1E8] border border-[#F6C7A9] text-[#E9784B] font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-[#ffe5d4] transition-all"
                  >
                    Browse Items
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = activeConversation?.interest.id === conv.interest.id;
                  const isOwner = conv.listing.owner_id === currentUser.id;

                  return (
                    <button
                      key={conv.interest.id}
                      onClick={() => {
                        setSelectedInterestId(conv.interest.id);
                        router.replace(`/matches?tab=conversations&conversation=${conv.interest.id}`);
                      }}
                      className={`w-full p-4 text-left transition-all flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-[#FFF6F0] border-l-4 border-l-[#E9784B]'
                          : 'hover:bg-stone-50/80'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <img
                          src={conv.otherUser.avatar_url || getNeutralAvatarUrl(conv.otherUser.name)}
                          alt={conv.otherUser.name}
                          className="w-11 h-11 rounded-full object-cover border border-[#F6C7A9] bg-stone-100"
                        />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#E9784B] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Info & Snippet */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="font-bold text-xs text-stone-900 truncate">
                            {conv.otherUser.name}
                          </span>
                          <span className="text-[10px] text-stone-400 shrink-0">
                            {new Date(conv.updated_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Item Title & Role Badge */}
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-600 truncate mb-1">
                          <span className="font-semibold text-stone-800 truncate">
                            {conv.lookingFor ? `Looking For: ${conv.lookingFor.title}` : conv.listing.title}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                            {conv.lookingFor
                              ? conv.lookingFor.student_id === currentUser.id
                                ? 'Your Request'
                                : 'Offered Item'
                              : isOwner
                              ? 'Your Post'
                              : 'Interested'}
                          </span>
                        </div>

                        {/* Last Message Snippet */}
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'font-bold text-stone-900' : 'text-stone-500'}`}>
                            {conv.lastMessage?.system_event
                              ? `🔔 ${conv.lastMessage.content}`
                              : conv.lastMessage?.content
                              ? conv.lastMessage.content
                              : conv.interest.message || 'Started a conversation'}
                          </p>
                          <div className="shrink-0">{getStatusBadge(conv.status)}</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation Thread */}
          <div
            className={`lg:col-span-8 flex flex-col bg-white relative min-h-0 ${
              !selectedInterestId ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Conversation Header */}
                <div className="p-4 border-b border-stone-200 bg-white/95 sticky top-0 z-10 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Mobile back button */}
                      <button
                        onClick={() => {
                          setSelectedInterestId(null);
                          router.replace('/matches?tab=conversations');
                        }}
                        className="lg:hidden p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <img
                        src={
                          activeConversation.otherUser.avatar_url ||
                          getNeutralAvatarUrl(activeConversation.otherUser.name)
                        }
                        alt={activeConversation.otherUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#F6C7A9] bg-stone-100"
                      />

                      <div>
                        <div className="font-extrabold text-sm text-stone-900 flex items-center gap-1.5">
                          {activeConversation.otherUser.name}
                          <span className="text-[10px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                            {activeConversation.lookingFor
                              ? activeConversation.lookingFor.student_id === currentUser.id
                                ? 'Offering Student'
                                : 'Request Author'
                              : isOwnerOfActive
                              ? 'Interested Student'
                              : 'Listing Owner'}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {activeConversation.otherUser.branch} • {activeConversation.otherUser.batch}
                        </div>
                      </div>
                    </div>

                    <div>{getStatusBadge(activeConversation.status)}</div>
                  </div>

                  {/* Context Item Bar */}
                  {activeConversation.lookingFor ? (
                    <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold shrink-0">
                          <SearchCode className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Looking For Request
                            </span>
                            <span className="text-[10px] text-stone-400">•</span>
                            <span className="text-[10px] font-semibold text-stone-600">
                              {activeConversation.lookingFor.category}
                            </span>
                          </div>
                          <Link
                            href="/looking-for"
                            className="font-bold text-stone-900 hover:text-sky-700 hover:underline truncate block text-xs mt-0.5"
                          >
                            {activeConversation.lookingFor.title}
                          </Link>
                          <div className="text-[10px] text-stone-500 truncate">
                            Preferred Mode: <span className="font-semibold text-stone-700">{activeConversation.lookingFor.mode}</span>
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/looking-for"
                        className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition-all shrink-0"
                      >
                        View Requests
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {activeConversation.listing.images?.[0] ? (
                          <img
                            src={activeConversation.listing.images[0]}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#E9784B] font-bold text-xs shrink-0">
                            📦
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={`/marketplace/${activeConversation.listing.id}`}
                            className="font-bold text-stone-900 hover:text-[#E9784B] hover:underline truncate block"
                          >
                            {activeConversation.listing.title}
                          </Link>
                          <div className="text-[10px] text-stone-500">
                            Mode: <span className="font-semibold text-stone-700">{activeConversation.listing.mode}</span> •
                            Price: <span className="font-bold text-[#E9784B]">{activeConversation.listing.price ? `₹${activeConversation.listing.price}` : 'Free'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Context Action CTAs based on status & role */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isOwnerOfActive && activeConversation.interest.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => acceptInterest(activeConversation.interest.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept
                            </button>
                            <button
                              onClick={() => declineInterest(activeConversation.interest.id)}
                              className="bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-700 font-semibold text-xs px-3 py-1.5 rounded-xl transition-all"
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </>
                        )}

                        {activeConversation.status === 'RESERVED' && (
                          <button
                            onClick={() =>
                              setHandoverModalData({
                                listingId: activeConversation.listing.id,
                                interestId: activeConversation.interest.id,
                              })
                            }
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                          >
                            <MapPin className="w-3.5 h-3.5" /> Plan Handover
                          </button>
                        )}

                        {isOwnerOfActive && activeConversation.status === 'HANDOVER_PLANNED' && (
                          <button
                            onClick={() => completeExchange(activeConversation.listing.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                        )}

                        {activeConversation.status === 'COMPLETED' && (
                          <button
                            onClick={() =>
                              setFeedbackModalData({
                                exchangeId: activeConversation.listing.id,
                                toUserId: activeConversation.otherUser.id,
                                toUserName: activeConversation.otherUser.name,
                              })
                            }
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" /> Leave Feedback
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Handover Notice banner if planned */}
                  {activeHandover && activeConversation.status === 'HANDOVER_PLANNED' && (
                    <div className="bg-purple-50 border border-purple-200 text-purple-900 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-purple-700 shrink-0" />
                        <span>
                          <strong>Campus Handover Planned:</strong> {activeHandover.location} on {activeHandover.date} ({activeHandover.time})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Thread History */}
                <div
                  ref={chatContainerRef}
                  onScroll={handleChatScroll}
                  className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50/40 min-h-0"
                >
                  {/* Initial Conversation Anchor */}
                  <div className="text-center py-2">
                    <div className="inline-flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1 rounded-full text-[11px] text-stone-500 shadow-xs">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>
                        {activeConversation.lookingFor ? 'Offer' : 'Interest'} initiated on {new Date(activeConversation.interest.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Messages list */}
                  {activeMessages.map((msg) => {
                    if (msg.system_event) {
                      return (
                        <div key={msg.id} className="text-center my-3">
                          <div className="inline-block bg-[#FFF1E8] border border-[#F6C7A9] text-[#292524] text-xs px-4 py-1.5 rounded-2xl shadow-xs max-w-md font-medium">
                            🔔 {msg.content}
                          </div>
                        </div>
                      );
                    }

                    const isMe = msg.sender_id === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <img
                            src={
                              activeConversation.otherUser.avatar_url ||
                              getNeutralAvatarUrl(activeConversation.otherUser.name)
                            }
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-stone-200 shrink-0 mb-1"
                          />
                        )}

                        <div
                          className={`max-w-[80%] sm:max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? 'bg-[#E9784B] text-white rounded-br-xs font-normal'
                              : 'bg-white border border-stone-200/90 text-stone-900 rounded-bl-xs font-normal'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          <div
                            className={`text-[9px] mt-1.5 text-right flex items-center justify-end gap-1 ${
                              isMe ? 'text-white/80' : 'text-stone-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && msg.read && <span title="Read">✓✓</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* Floating "Jump to latest" Button */}
                {showJumpToBottom && (
                  <button
                    type="button"
                    onClick={() => scrollToBottom('smooth')}
                    className="absolute bottom-18 right-6 z-20 flex items-center gap-1.5 bg-stone-900/90 hover:bg-stone-900 text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg backdrop-blur-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0 border border-stone-700/40 cursor-pointer"
                    aria-label="Jump to latest messages"
                  >
                    <ChevronDown className="w-4 h-4 text-[#E9784B]" />
                    <span>Jump to latest</span>
                    {unreadWhileScrolledUp > 0 && (
                      <span className="bg-[#E9784B] text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full leading-none">
                        {unreadWhileScrolledUp}
                      </span>
                    )}
                  </button>
                )}

                {/* Message Input Form */}
                <form onSubmit={handleSendMessage} className="p-3.5 border-t border-stone-200 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={`Type a message to ${activeConversation.otherUser.name.split(' ')[0]}...`}
                      className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || isSending}
                      className="bg-[#E9784B] hover:bg-[#d66538] disabled:opacity-40 text-white font-bold p-2.5 rounded-2xl shadow-xs transition-all flex items-center justify-center shrink-0"
                      title="Send message (Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3 bg-stone-50/40">
                <div className="w-14 h-14 rounded-full bg-[#FFF1E8] border border-[#F6C7A9] flex items-center justify-center text-[#E9784B]">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-stone-900">Select a Conversation</h3>
                <p className="text-xs text-stone-500 max-w-xs">
                  Choose an ongoing discussion on the left to read messages, send replies, or arrange handover times.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Algorithmic Demand & Supply Matching Engine */}
      {activeTab === 'demand' && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 shadow-sm space-y-2">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E9784B] fill-current" />
              Automated Campus Demand & Supply Matches
            </h2>
            <p className="text-xs text-stone-500">
              PassOn continuously aligns your active Looking For requests with available student listings using category, keywords, and exchange compatibility.
            </p>
          </div>

          {matches.length === 0 ? (
            <div className="bg-white border border-stone-200/80 rounded-3xl p-16 text-center space-y-4 shadow-sm">
              <Sparkles className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No active algorithmic matches</h3>
              <p className="text-xs text-stone-500 max-w-md mx-auto">
                Post a Looking For request to enable PassOn&apos;s transparent demand scanner across all senior and junior student listings.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/looking-for/new"
                  className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all"
                >
                  Post a Request
                </Link>
                <Link
                  href="/marketplace"
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                >
                  Browse Marketplace
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-[#E9784B]">
                Found {matches.length} candidate match{matches.length > 1 ? 'es' : ''} for your campus requests:
              </div>
              <div className="space-y-4">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {handoverModalData && (
        <HandoverModal
          listingId={handoverModalData.listingId}
          interestId={handoverModalData.interestId}
          onClose={() => setHandoverModalData(null)}
        />
      )}

      {feedbackModalData && (
        <FeedbackModal
          exchangeId={feedbackModalData.exchangeId}
          toUserId={feedbackModalData.toUserId}
          toUserName={feedbackModalData.toUserName}
          onClose={() => setFeedbackModalData(null)}
        />
      )}
    </div>
  );
}

export default function MatchesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div className="text-xs text-stone-500 py-12 text-center">Loading matches & conversations...</div>}>
        <MatchesAndConversationsContent />
      </Suspense>
    </div>
  );
}
