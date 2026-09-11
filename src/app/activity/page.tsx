'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { ListingCard } from '../../components/listing-card';
import { LookingForCard } from '../../components/looking-for-card';
import { KnowledgeCard } from '../../components/knowledge-card';
import { MatchCard } from '../../components/match-card';
import { HandoverModal } from '../../components/handover-modal';
import {
  Package, SearchCode, BookOpen, Sparkles, CheckCircle2,
  MapPin, MessageSquare, Clock, Check, X
} from 'lucide-react';
import Link from 'next/link';

function ActivityContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';

  const {
    listings, interests, handovers, lookingFor, matches,
    knowledgePosts, savedListings, savedKnowledge,
    acceptInterest, declineInterest, completeExchange
  } = useApp();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedHandoverListingId, setSelectedHandoverListingId] = useState<string | null>(null);
  const [selectedHandoverInterestId, setSelectedHandoverInterestId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">Please Log In</h2>
        <p className="text-xs text-stone-500">Log in to view your listings, interests, requests, and saved items.</p>
        <Link href="/login" className="inline-block bg-[#E9784B] text-white font-bold text-xs px-5 py-2.5 rounded-xl">
          Log In Now
        </Link>
      </div>
    );
  }

  // Filter user specific data
  const myListings = listings.filter((l) => l.owner_id === currentUser.id);
  const myRequests = lookingFor.filter((r) => r.student_id === currentUser.id);
  const myKnowledge = knowledgePosts.filter((k) => k.author_id === currentUser.id);

  // Received interests for my listings
  const receivedInterests = interests.filter((i) =>
    myListings.some((l) => l.id === i.listing_id)
  );

  // Sent interests by current user
  const sentInterests = interests.filter((i) => i.student_id === currentUser.id);

  // Saved listings & saved knowledge
  const savedListingItems = savedListings.map((s) => s.listing).filter(Boolean) as typeof listings;
  const savedKnowledgeItems = savedKnowledge.map((s) => s.post).filter(Boolean) as typeof knowledgePosts;

  return (
    <div className="space-y-8">
      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 overflow-x-auto text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'overview' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'listings' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          My Listings ({myListings.length})
        </button>
        <button
          onClick={() => setActiveTab('interests')}
          className={`px-4 py-2 rounded-xl transition-all relative ${
            activeTab === 'interests' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          Interests ({receivedInterests.length + sentInterests.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'requests' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          Requests & Matches ({myRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'saved' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          Saved ({savedListingItems.length + savedKnowledgeItems.length})
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'knowledge' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 hover:text-stone-900 bg-white border border-stone-200'
          }`}
        >
          Knowledge Posts ({myKnowledge.length})
        </button>
      </div>

      {/* Tab Content Areas */}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-stone-500 font-medium">Active Listings</span>
              <div className="text-2xl font-extrabold text-stone-900">{myListings.length}</div>
            </div>
            <div className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-stone-500 font-medium">Interests Received</span>
              <div className="text-2xl font-extrabold text-[#E9784B]">{receivedInterests.length}</div>
            </div>
            <div className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-stone-500 font-medium">Open Looking For</span>
              <div className="text-2xl font-extrabold text-amber-600">{myRequests.length}</div>
            </div>
            <div className="bg-white border border-stone-200/80 p-5 rounded-2xl space-y-1 shadow-sm">
              <span className="text-xs text-stone-500 font-medium">Knowledge Shared</span>
              <div className="text-2xl font-extrabold text-indigo-600">{myKnowledge.length}</div>
            </div>
          </div>

          {/* Pending Actions Alert Card */}
          {receivedInterests.some((i) => i.status === 'PENDING') && (
            <div className="bg-[#FFF1E8] border border-[#F6C7A9] rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#E9784B] uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" /> Action Required: Pending Interest Requests
              </div>
              <p className="text-xs text-stone-700">
                You have received interest from students on your listings. Review and accept to proceed to campus handover!
              </p>
              <button
                onClick={() => setActiveTab('interests')}
                className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                Review Requests Now
              </button>
            </div>
          )}

          {/* My Listings Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center justify-between">
              <span>My Active Listings</span>
              <Link href="/listing/new" className="text-xs text-[#E9784B] hover:underline font-semibold">
                + Add New
              </Link>
            </h2>
            {myListings.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200 text-center shadow-sm">
                You haven't listed any items yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Listings Tab */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900">All My Listed Items</h2>
          {myListings.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-stone-200 text-center space-y-2 shadow-sm">
              <Package className="w-10 h-10 text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-700">No active listings</p>
              <Link href="/listing/new" className="inline-block bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2 rounded-xl">
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

      {/* Interests Tab */}
      {activeTab === 'interests' && (
        <div className="space-y-8">
          {/* Received Interests */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#E9784B]" />
              Interests Received on My Listings
            </h2>
            {receivedInterests.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200 text-center shadow-sm">
                No students have expressed interest in your listings yet.
              </p>
            ) : (
              <div className="space-y-3">
                {receivedInterests.map((interest) => (
                  <div
                    key={interest.id}
                    className="bg-white border border-stone-200/80 rounded-2xl p-5 space-y-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={interest.student?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={interest.student?.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#F6C7A9]"
                        />
                        <div>
                          <div className="font-bold text-sm text-stone-900">{interest.student?.name}</div>
                          <div className="text-xs text-stone-500">
                            {interest.student?.branch} • {interest.student?.batch}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                          interest.status === 'ACCEPTED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : interest.status === 'DECLINED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {interest.status}
                      </span>
                    </div>

                    <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                      <span className="text-stone-500">Listing: </span>
                      <Link href={`/marketplace/${interest.listing_id}`} className="font-semibold text-[#E9784B] hover:underline">
                        {interest.listing?.title}
                      </Link>
                      {interest.message && <p className="text-stone-700 mt-1 italic">"{interest.message}"</p>}
                    </div>

                    {interest.status === 'PENDING' && (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => acceptInterest(interest.id)}
                          className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-4 h-4" /> Accept Interest
                        </button>
                        <button
                          onClick={() => declineInterest(interest.id)}
                          className="bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-600 font-semibold text-xs px-4 py-2 rounded-xl transition-colors"
                        >
                          <X className="w-4 h-4" /> Decline
                        </button>
                      </div>
                    )}

                    {interest.status === 'ACCEPTED' && (
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          onClick={() => {
                            setSelectedHandoverListingId(interest.listing_id);
                            setSelectedHandoverInterestId(interest.id);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <MapPin className="w-4 h-4" /> Plan Campus Handover
                        </button>

                        {interest.listing?.status === 'HANDOVER_PLANNED' && (
                          <button
                            onClick={() => completeExchange(interest.listing_id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Mark Completed
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Interests */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Interests I Have Sent
            </h2>
            {sentInterests.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200 text-center shadow-sm">
                You haven't expressed interest in any items yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sentInterests.map((interest) => (
                  <div key={interest.id} className="bg-white border border-stone-200/80 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                    <div>
                      <Link href={`/marketplace/${interest.listing_id}`} className="font-bold text-sm text-stone-900 hover:text-[#E9784B]">
                        {interest.listing?.title}
                      </Link>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Owner: {interest.listing?.owner?.name} • Mode: {interest.listing?.mode}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-lg border ${
                        interest.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : interest.status === 'DECLINED'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {interest.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests & Matches Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">My Looking For Requests</h2>
            <Link href="/looking-for/new" className="text-xs text-[#E9784B] hover:underline font-semibold">
              + Post Request
            </Link>
          </div>

          {myRequests.length === 0 ? (
            <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200 text-center shadow-sm">
              No open Looking For requests.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myRequests.map((req) => (
                <LookingForCard key={req.id} request={req} />
              ))}
            </div>
          )}

          {matches.length > 0 && (
            <div className="pt-6 border-t border-stone-200 space-y-4">
              <h3 className="text-base font-bold text-[#E9784B] flex items-center gap-2">
                <Sparkles className="w-4 h-4 fill-current" /> Matches Found for Your Requests
              </h3>
              <div className="space-y-4">
                {matches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Tab */}
      {activeTab === 'saved' && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Saved Marketplace Items</h2>
            {savedListingItems.length === 0 ? (
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200 text-center shadow-sm">
                No saved listings.
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
              <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200 text-center shadow-sm">
                No saved knowledge posts.
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

      {/* Knowledge Contributions Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">My Knowledge Posts</h2>
            <Link href="/knowledge/new" className="text-xs text-[#E9784B] hover:underline font-semibold">
              + Share Knowledge
            </Link>
          </div>

          {myKnowledge.length === 0 ? (
            <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200 text-center shadow-sm">
              You haven't contributed to the Knowledge Shelf yet.
            </p>
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
      {selectedHandoverListingId && selectedHandoverInterestId && (
        <HandoverModal
          listingId={selectedHandoverListingId}
          interestId={selectedHandoverInterestId}
          onClose={() => {
            setSelectedHandoverListingId(null);
            setSelectedHandoverInterestId(null);
          }}
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
            Track your listings, interests, reservations, handovers, requests, and saved items in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/listing/new"
            className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
          >
            + List Item
          </Link>
          <Link
            href="/looking-for/new"
            className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            + Post Request
          </Link>
        </div>
      </div>

      <Suspense fallback={<div className="text-xs text-stone-500 py-10 text-center">Loading activity...</div>}>
        <ActivityContent />
      </Suspense>
    </div>
  );
}
