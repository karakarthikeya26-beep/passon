'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getNeutralAvatarUrl } from '../../lib/supabase';
import { ListingCard } from '../../components/listing-card';
import { LookingForCard } from '../../components/looking-for-card';
import { KnowledgeCard } from '../../components/knowledge-card';
import { MatchCard } from '../../components/match-card';
import { HandoverModal } from '../../components/handover-modal';
import { FeedbackModal } from '../../components/feedback-modal';
import { ActivityCategory, ActivityItem, Interest, Listing, User } from '../../types';
import {
  Package, SearchCode, BookOpen, Sparkles, CheckCircle2,
  MapPin, MessageSquare, Clock, Check, X, ArrowRight,
  Filter, Calendar, ExternalLink, ShieldCheck, Tag
} from 'lucide-react';
import Link from 'next/link';

function ActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMainTab = searchParams.get('tab') || 'history';
  const initialCategory = (searchParams.get('category') as ActivityCategory) || 'All';

  const {
    listings,
    interests,
    handovers,
    lookingFor,
    matches,
    messages,
    knowledgePosts,
    savedListings,
    savedKnowledge,
    acceptInterest,
    declineInterest,
    completeExchange,
  } = useApp();

  const { currentUser, users } = useAuth();

  const [mainTab, setMainTab] = useState<'history' | 'listings' | 'requests' | 'saved' | 'knowledge'>(
    (initialMainTab as any) || 'history'
  );
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>(initialCategory);

  // Modals state
  const [handoverModalData, setHandoverModalData] = useState<{ listingId: string; interestId: string } | null>(null);
  const [feedbackModalData, setFeedbackModalData] = useState<{ exchangeId: string; toUserId: string; toUserName: string } | null>(null);

  useEffect(() => {
    if (initialMainTab && ['history', 'listings', 'requests', 'saved', 'knowledge'].includes(initialMainTab)) {
      setMainTab(initialMainTab as any);
    }
  }, [initialMainTab]);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  if (!currentUser) {
    return (
      <div className="bg-white border border-stone-200/80 rounded-3xl p-16 text-center space-y-4 shadow-sm max-w-xl mx-auto my-12">
        <Sparkles className="w-12 h-12 text-[#E9784B] mx-auto opacity-80" />
        <h2 className="text-xl font-bold text-stone-900">Sign In to View Your Activity</h2>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Log in with your student account to view your complete interaction history, sent and received interests, and exchange progress.
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

  // Filter user specific base data
  const myListings = listings.filter((l) => l.owner_id === currentUser.id);
  const myRequests = lookingFor.filter((r) => r.student_id === currentUser.id);
  const myKnowledge = knowledgePosts.filter((k) => k.author_id === currentUser.id);
  const savedListingItems = savedListings.map((s) => s.listing).filter(Boolean) as typeof listings;
  const savedKnowledgeItems = savedKnowledge.map((s) => s.post).filter(Boolean) as typeof knowledgePosts;

  // Build the complete, unified Activity history stream
  const allActivityItems = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];

    // 1. Interests Sent by current user
    interests
      .filter((i) => i.student_id === currentUser.id)
      .forEach((interest) => {
        const listing = listings.find((l) => l.id === interest.listing_id);
        const owner = users.find((u) => u.id === listing?.owner_id) || listing?.owner;
        const convMessages = messages.filter((m) => m.interest_id === interest.id);
        const lastMsg = convMessages[convMessages.length - 1];

        // Overall status of interest/exchange
        let statusText: string = interest.status;
        let statusColor: ActivityItem['statusColor'] = 'amber';
        if (listing?.status === 'COMPLETED') {
          statusText = 'COMPLETED';
          statusColor = 'blue';
        } else if (listing?.status === 'HANDOVER_PLANNED') {
          statusText = 'HANDOVER_PLANNED';
          statusColor = 'purple';
        } else if (interest.status === 'ACCEPTED' || listing?.status === 'RESERVED') {
          statusText = 'ACCEPTED';
          statusColor = 'emerald';
        } else if (interest.status === 'DECLINED') {
          statusText = 'DECLINED';
          statusColor = 'rose';
        }

        items.push({
          id: `act-sent-${interest.id}`,
          type: 'INTEREST_SENT',
          category: 'Interests Sent',
          title: `You expressed interest in "${listing?.title || 'an item'}"`,
          description: lastMsg?.content
            ? `Latest message: "${lastMsg.content.slice(0, 70)}${lastMsg.content.length > 70 ? '...' : ''}"`
            : interest.message
            ? `Your note: "${interest.message}"`
            : 'Interest submitted to the owner.',
          timestamp: lastMsg?.created_at || interest.updated_at || interest.created_at,
          status: statusText,
          statusColor,
          item: listing,
          otherUser: owner,
          isOwner: false,
          interestId: interest.id,
          link: `/matches?conversation=${interest.id}`,
          actionLabel: 'Open Conversation',
        });
      });

    // 2. Interests Received on user's listings
    interests
      .filter((i) => {
        const listing = listings.find((l) => l.id === i.listing_id);
        return listing && listing.owner_id === currentUser.id;
      })
      .forEach((interest) => {
        const listing = listings.find((l) => l.id === interest.listing_id);
        const student = users.find((u) => u.id === interest.student_id) || interest.student;
        const convMessages = messages.filter((m) => m.interest_id === interest.id);
        const lastMsg = convMessages[convMessages.length - 1];

        let statusText: string = interest.status;
        let statusColor: ActivityItem['statusColor'] = 'amber';
        if (listing?.status === 'COMPLETED') {
          statusText = 'COMPLETED';
          statusColor = 'blue';
        } else if (listing?.status === 'HANDOVER_PLANNED') {
          statusText = 'HANDOVER_PLANNED';
          statusColor = 'purple';
        } else if (interest.status === 'ACCEPTED' || listing?.status === 'RESERVED') {
          statusText = 'ACCEPTED';
          statusColor = 'emerald';
        } else if (interest.status === 'DECLINED') {
          statusText = 'DECLINED';
          statusColor = 'rose';
        }

        items.push({
          id: `act-rcvd-${interest.id}`,
          type: 'INTEREST_RECEIVED',
          category: 'Interests Received',
          title: `${student?.name || 'A student'} expressed interest in your "${listing?.title || 'item'}"`,
          description: lastMsg?.content
            ? `Latest reply: "${lastMsg.content.slice(0, 70)}${lastMsg.content.length > 70 ? '...' : ''}"`
            : interest.message
            ? `Note from ${student?.name || 'student'}: "${interest.message}"`
            : 'Awaiting your review and acceptance.',
          timestamp: lastMsg?.created_at || interest.updated_at || interest.created_at,
          status: statusText,
          statusColor,
          item: listing,
          otherUser: student,
          isOwner: true,
          interestId: interest.id,
          link: `/matches?conversation=${interest.id}`,
          actionLabel: interest.status === 'PENDING' ? 'Review & Respond' : 'Open Conversation',
        });
      });

    // 3. Planned Campus Handovers
    handovers
      .filter((h) => {
        const listing = listings.find((l) => l.id === h.listing_id);
        const interest = interests.find((i) => i.id === h.interest_id);
        return (
          listing?.owner_id === currentUser.id ||
          interest?.student_id === currentUser.id
        );
      })
      .forEach((handover) => {
        const listing = listings.find((l) => l.id === handover.listing_id);
        const interest = interests.find((i) => i.id === handover.interest_id);
        const isOwner = listing?.owner_id === currentUser.id;
        const otherUserId = isOwner ? interest?.student_id : listing?.owner_id;
        const otherUser = users.find((u) => u.id === otherUserId);

        items.push({
          id: `act-handover-${handover.id}`,
          type: 'HANDOVER_PLANNED',
          category: 'Exchanges',
          title: `Campus Handover Scheduled for "${listing?.title || 'item'}"`,
          description: `Location: ${handover.location} • Date: ${handover.date} (${handover.time})${handover.note ? ` • Note: "${handover.note}"` : ''}`,
          timestamp: handover.created_at,
          status: handover.status === 'COMPLETED' ? 'COMPLETED' : 'HANDOVER_PLANNED',
          statusColor: handover.status === 'COMPLETED' ? 'blue' : 'purple',
          item: listing,
          otherUser,
          isOwner,
          interestId: handover.interest_id,
          link: `/matches?conversation=${handover.interest_id}`,
          actionLabel: 'View Handover & Chat',
        });
      });

    // 4. Completed Exchanges
    listings
      .filter((l) => l.status === 'COMPLETED')
      .filter((l) => {
        const acceptedInt = interests.find((i) => i.listing_id === l.id && i.status === 'ACCEPTED');
        return l.owner_id === currentUser.id || acceptedInt?.student_id === currentUser.id;
      })
      .forEach((listing) => {
        const acceptedInt = interests.find((i) => i.listing_id === listing.id && i.status === 'ACCEPTED');
        const isOwner = listing.owner_id === currentUser.id;
        const otherUserId = isOwner ? acceptedInt?.student_id : listing.owner_id;
        const otherUser = users.find((u) => u.id === otherUserId);

        items.push({
          id: `act-comp-${listing.id}`,
          type: 'EXCHANGE_COMPLETED',
          category: 'Completed',
          title: `Campus Exchange Completed for "${listing.title}"`,
          description: `Item successfully handed over on VNR campus. Tap to review exchange notes or leave feedback.`,
          timestamp: listing.updated_at || listing.created_at,
          status: 'COMPLETED',
          statusColor: 'blue',
          item: listing,
          otherUser,
          isOwner,
          interestId: acceptedInt?.id,
          link: acceptedInt ? `/matches?conversation=${acceptedInt.id}` : `/marketplace/${listing.id}`,
          actionLabel: 'View Exchange & Feedback',
        });
      });

    // 5. Recent Direct Messages
    messages
      .filter((m) => !m.system_event && (m.sender_id === currentUser.id || m.recipient_id === currentUser.id))
      .forEach((msg) => {
        const interest = interests.find((i) => i.id === msg.interest_id);
        const listing = listings.find((l) => l.id === msg.listing_id || l.id === interest?.listing_id);
        const isSender = msg.sender_id === currentUser.id;
        const otherUserId = isSender ? msg.recipient_id : msg.sender_id;
        const otherUser = users.find((u) => u.id === otherUserId);

        items.push({
          id: `act-msg-${msg.id}`,
          type: 'MESSAGE',
          category: 'Messages',
          title: isSender
            ? `You replied to ${otherUser?.name || 'student'}`
            : `${otherUser?.name || 'Student'} sent you a message`,
          description: `"${msg.content.slice(0, 80)}${msg.content.length > 80 ? '...' : ''}"`,
          timestamp: msg.created_at,
          status: 'MESSAGE',
          statusColor: 'stone',
          item: listing,
          otherUser,
          isOwner: listing?.owner_id === currentUser.id,
          interestId: msg.interest_id,
          link: `/matches?conversation=${msg.interest_id}`,
          actionLabel: 'Open Chat',
        });
      });

    // 6. Algorithmic Demand Matches
    matches.forEach((match) => {
      items.push({
        id: `act-match-${match.id}`,
        type: 'MATCH_FOUND',
        category: 'Matches',
        title: `Match Found for "${match.request?.title || 'your request'}"`,
        description: `Compatible with "${match.listing?.title}". Match reason: ${match.match_reason}`,
        timestamp: match.created_at,
        status: 'MATCHED',
        statusColor: 'emerald',
        item: match.listing,
        otherUser: match.listing?.owner,
        isOwner: false,
        link: `/matches?tab=demand`,
        actionLabel: 'View Match Details',
      });
    });

    // Deduplicate items that have the exact same interaction ID & category, then sort descending by timestamp
    const seen = new Set<string>();
    const deduplicated: ActivityItem[] = [];

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    for (const it of items) {
      const key = `${it.type}-${it.interestId || it.id}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(it);
      }
    }

    return deduplicated;
  }, [currentUser, interests, listings, handovers, messages, matches, users]);

  // Filter activity items based on selected category pill
  const filteredActivity = useMemo(() => {
    if (selectedCategory === 'All') return allActivityItems;
    if (selectedCategory === 'Interests Sent') return allActivityItems.filter((i) => i.category === 'Interests Sent');
    if (selectedCategory === 'Interests Received') return allActivityItems.filter((i) => i.category === 'Interests Received');
    if (selectedCategory === 'Messages') return allActivityItems.filter((i) => i.category === 'Messages' || i.type === 'MESSAGE');
    if (selectedCategory === 'Matches') return allActivityItems.filter((i) => i.category === 'Matches' || i.type === 'MATCH_FOUND');
    if (selectedCategory === 'Exchanges') {
      return allActivityItems.filter(
        (i) => i.category === 'Exchanges' || i.status === 'ACCEPTED' || i.status === 'HANDOVER_PLANNED'
      );
    }
    if (selectedCategory === 'Completed') return allActivityItems.filter((i) => i.category === 'Completed' || i.status === 'COMPLETED');
    return allActivityItems;
  }, [allActivityItems, selectedCategory]);

  const categories: { label: ActivityCategory; count: number }[] = [
    { label: 'All', count: allActivityItems.length },
    { label: 'Interests Sent', count: allActivityItems.filter((i) => i.category === 'Interests Sent').length },
    { label: 'Interests Received', count: allActivityItems.filter((i) => i.category === 'Interests Received').length },
    { label: 'Messages', count: allActivityItems.filter((i) => i.category === 'Messages' || i.type === 'MESSAGE').length },
    { label: 'Matches', count: allActivityItems.filter((i) => i.category === 'Matches' || i.type === 'MATCH_FOUND').length },
    {
      label: 'Exchanges',
      count: allActivityItems.filter(
        (i) => i.category === 'Exchanges' || i.status === 'ACCEPTED' || i.status === 'HANDOVER_PLANNED'
      ).length,
    },
    { label: 'Completed', count: allActivityItems.filter((i) => i.category === 'Completed' || i.status === 'COMPLETED').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'RESERVED':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Reserved / Accepted</span>;
      case 'HANDOVER_PLANNED':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Handover Planned</span>;
      case 'COMPLETED':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Completed</span>;
      case 'DECLINED':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Declined</span>;
      case 'MATCHED':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Match Found</span>;
      case 'MESSAGE':
        return <span className="bg-stone-100 text-stone-700 border border-stone-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Direct Message</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">Pending Review</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">My Active Listings</span>
          <div className="text-2xl font-extrabold text-stone-900">{myListings.length}</div>
        </div>
        <div className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">Total Interactions</span>
          <div className="text-2xl font-extrabold text-[#E9784B]">{allActivityItems.length}</div>
        </div>
        <div className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">In-Progress Exchanges</span>
          <div className="text-2xl font-extrabold text-purple-700">
            {
              allActivityItems.filter(
                (i) => i.status === 'ACCEPTED' || i.status === 'HANDOVER_PLANNED'
              ).length
            }
          </div>
        </div>
        <div className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs text-stone-500 font-medium">Completed Exchanges</span>
          <div className="text-2xl font-extrabold text-blue-700">
            {allActivityItems.filter((i) => i.status === 'COMPLETED').length}
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setMainTab('history')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            mainTab === 'history'
              ? 'bg-[#E9784B] text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Interaction History ({allActivityItems.length})</span>
        </button>

        <button
          onClick={() => setMainTab('listings')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            mainTab === 'listings'
              ? 'bg-[#E9784B] text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>My Listings ({myListings.length})</span>
        </button>

        <button
          onClick={() => setMainTab('requests')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            mainTab === 'requests'
              ? 'bg-[#E9784B] text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          <SearchCode className="w-3.5 h-3.5" />
          <span>Looking For Requests ({myRequests.length})</span>
        </button>

        <button
          onClick={() => setMainTab('saved')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            mainTab === 'saved'
              ? 'bg-[#E9784B] text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Saved Items ({savedListingItems.length + savedKnowledgeItems.length})</span>
        </button>

        <button
          onClick={() => setMainTab('knowledge')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
            mainTab === 'knowledge'
              ? 'bg-[#E9784B] text-white font-bold shadow-sm'
              : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Knowledge Posts ({myKnowledge.length})</span>
        </button>
      </div>

      {/* TAB 1: Complete Interaction History Stream */}
      {mainTab === 'history' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-stone-400 font-bold text-[11px] flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 text-xs ${
                  selectedCategory === cat.label
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    selectedCategory === cat.label
                      ? 'bg-white/20 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Activity Feed Cards */}
          {filteredActivity.length === 0 ? (
            <div className="bg-white border border-stone-200/80 rounded-3xl p-16 text-center space-y-3 shadow-sm">
              <Clock className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-base font-bold text-stone-800">No records found in "{selectedCategory}"</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                {selectedCategory === 'Interests Sent'
                  ? "You haven't expressed interest in any campus listings yet. Browse marketplace items and send an interest request."
                  : selectedCategory === 'Interests Received'
                  ? 'No students have requested your items yet. Share your listing link with batchmates!'
                  : selectedCategory === 'Messages'
                  ? 'You do not have any message threads yet. Send or respond to interest requests to start chatting.'
                  : selectedCategory === 'Exchanges'
                  ? 'No accepted exchanges currently in progress. When you or an owner accept interest, handover planning starts here.'
                  : selectedCategory === 'Completed'
                  ? 'No completed campus handovers recorded yet.'
                  : 'Your complete PassOn interaction timeline will appear here.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/marketplace"
                  className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all"
                >
                  Browse Marketplace
                </Link>
                <Link
                  href="/listing/new"
                  className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  List an Item
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white border border-stone-200/80 hover:border-stone-300 rounded-3xl p-5 shadow-xs transition-all space-y-4"
                >
                  {/* Top Row: Meta Info, Status, Timestamp */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 px-2.5 py-1 rounded-lg">
                        {activity.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          activity.isOwner
                            ? 'bg-[#FFF1E8] text-[#E9784B] border border-[#F6C7A9]'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {activity.isOwner ? 'You are the Owner' : 'You expressed interest'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {getStatusBadge(activity.status)}
                      <span className="text-[11px] text-stone-400 font-medium">
                        {new Date(activity.timestamp).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Item & Counterpart Student Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    {/* Item Thumbnail & Context */}
                    <div className="flex items-center gap-3 min-w-0">
                      {activity.item?.images?.[0] ? (
                        <img
                          src={activity.item.images[0]}
                          alt=""
                          className="w-14 h-14 rounded-2xl object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#E9784B] font-bold text-base shrink-0">
                          📦
                        </div>
                      )}

                      <div className="min-w-0 space-y-0.5">
                        <div className="font-bold text-sm text-stone-900 truncate">
                          {activity.title}
                        </div>
                        <p className="text-xs text-stone-600 line-clamp-1 italic">
                          {activity.description}
                        </p>
                      </div>
                    </div>

                    {/* Counterpart Student Badge */}
                    {activity.otherUser && (
                      <div className="flex items-center gap-2.5 bg-stone-50 border border-stone-200/80 px-3 py-1.5 rounded-2xl shrink-0">
                        <img
                          src={
                            activity.otherUser.avatar_url ||
                            getNeutralAvatarUrl(activity.otherUser.name)
                          }
                          alt={activity.otherUser.name}
                          className="w-8 h-8 rounded-full object-cover border border-stone-200"
                        />
                        <div className="text-left">
                          <div className="font-bold text-xs text-stone-900 truncate max-w-[120px]">
                            {activity.otherUser.name}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {activity.otherUser.branch?.split(' ')?.[0] || 'VNR Student'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row: Actions Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-stone-100 text-xs">
                    <div className="flex items-center gap-3 text-stone-500 text-[11px]">
                      {activity.item && (
                        <span>
                          Category: <strong className="text-stone-700">{activity.item.category}</strong>
                        </span>
                      )}
                      {activity.item?.mode && (
                        <span>
                          Mode: <strong className="text-stone-700">{activity.item.mode}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Owner quick accept/decline for pending interests */}
                      {activity.isOwner && activity.status === 'PENDING' && activity.interestId && (
                        <>
                          <button
                            onClick={() => acceptInterest(activity.interestId!)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-xs transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => declineInterest(activity.interestId!)}
                            className="bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 font-semibold text-xs px-3 py-1.5 rounded-xl transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </>
                      )}

                      {/* Primary Open Conversation / View Details Button */}
                      <Link
                        href={activity.link}
                        className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{activity.actionLabel || 'Open Conversation'}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: My Listings */}
      {mainTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">All Items You Listed</h2>
            <Link
              href="/listing/new"
              className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              + List New Item
            </Link>
          </div>

          {myListings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3 shadow-xs">
              <Package className="w-10 h-10 text-stone-400 mx-auto" />
              <p className="text-sm font-bold text-stone-800">No active listings posted yet</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Declutter your hostel room or pass on engineering textbooks to junior VNR students.
              </p>
              <Link
                href="/listing/new"
                className="inline-block bg-[#E9784B] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
              >
                List Item Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Looking For Requests */}
      {mainTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">My Looking For Requests</h2>
            <Link
              href="/looking-for/new"
              className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              + Post Request
            </Link>
          </div>

          {myRequests.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3 shadow-xs">
              <SearchCode className="w-10 h-10 text-stone-400 mx-auto" />
              <p className="text-sm font-bold text-stone-800">No open Looking For requests</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Need a specific calculator, component kit, or textbook? Post a request and PassOn will scan matching listings.
              </p>
              <Link
                href="/looking-for/new"
                className="inline-block bg-[#E9784B] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
              >
                Post a Request
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myRequests.map((req) => (
                <LookingForCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Saved Items */}
      {mainTab === 'saved' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Saved Marketplace Items</h2>
            {savedListingItems.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-8 rounded-2xl border border-stone-200 text-center shadow-xs">
                No saved listings yet. Bookmark items in the marketplace to review them later.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedListingItems.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-stone-200">
            <h2 className="text-lg font-bold text-stone-900">Saved Knowledge Posts</h2>
            {savedKnowledgeItems.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-8 rounded-2xl border border-stone-200 text-center shadow-xs">
                No saved knowledge guides yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedKnowledgeItems.map((post) => (
                  <KnowledgeCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Knowledge Posts */}
      {mainTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">My Knowledge Shelf Contributions</h2>
            <Link
              href="/knowledge/new"
              className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
            >
              + Share Knowledge
            </Link>
          </div>

          {myKnowledge.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3 shadow-xs">
              <BookOpen className="w-10 h-10 text-stone-400 mx-auto" />
              <p className="text-sm font-bold text-stone-800">No knowledge shared yet</p>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Share your placement interview experiences, hackathon roadmaps, or department study tips.
              </p>
              <Link
                href="/knowledge/new"
                className="inline-block bg-[#E9784B] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs"
              >
                Share Knowledge
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {myKnowledge.map((post) => (
                <KnowledgeCard key={post.id} post={post} />
              ))}
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

export default function ActivityPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-8 h-8 text-[#E9784B]" />
            My Activity & Exchange Hub
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Complete interaction history: sent and received interests, conversations, campus exchanges, and saved items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/matches?tab=conversations"
            className="bg-[#FFF1E8] border border-[#F6C7A9] hover:bg-[#ffe5d4] text-[#E9784B] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open Conversations</span>
          </Link>
          <Link
            href="/listing/new"
            className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs"
          >
            + List Item
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-xs text-stone-500 py-12 text-center">Loading activity hub...</div>}>
        <ActivityContent />
      </Suspense>
    </div>
  );
}
