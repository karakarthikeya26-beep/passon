'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { ListingStatusBadge } from '../../../components/listing-status-badge';
import { InterestModal } from '../../../components/interest-modal';
import { HandoverModal } from '../../../components/handover-modal';
import { FeedbackModal } from '../../../components/feedback-modal';
import { ReportModal } from '../../../components/report-modal';
import {
  Tag, Bookmark, MessageSquare, ShieldAlert, MapPin, CheckCircle2,
  User, ArrowLeft, Trash2, Check, X
} from 'lucide-react';
import Link from 'next/link';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const {
    listings, interests, handovers, savedListings,
    toggleSaveListing, acceptInterest, declineInterest,
    completeExchange, deleteListing
  } = useApp();
  const { currentUser } = useAuth();

  const listing = listings.find((l) => l.id === listingId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedInterestForHandover, setSelectedInterestForHandover] = useState<string | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#292524]">Nothing here yet.</h2>
        <p className="text-xs text-stone-500 font-medium">This listing may have been removed or closed.</p>
        <Link href="/marketplace" className="inline-block bg-[#E9784B] text-white font-bold text-xs px-4 py-2 rounded-xl">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const isOwner = currentUser?.id === listing.owner_id;
  const isSaved = currentUser ? savedListings.some((s) => s.listing_id === listing.id) : false;

  const userInterest = currentUser
    ? interests.find((i) => i.listing_id === listing.id && i.student_id === currentUser.id)
    : null;

  const listingInterests = interests.filter((i) => i.listing_id === listing.id);
  const acceptedInterest = listingInterests.find((i) => i.status === 'ACCEPTED');
  const plannedHandover = handovers.find((h) => h.listing_id === listing.id);

  const owner = listing.owner;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#292524] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] w-full bg-stone-100 border border-[#E7E5E4] rounded-3xl overflow-hidden shadow-sm">
            <img
              src={listing.images[activeImageIndex] || 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?w=800'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <ListingStatusBadge status={listing.status} />
            </div>
          </div>

          {/* Image Thumbnails */}
          {listing.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#E9784B] scale-102 shadow-sm' : 'border-[#E7E5E4] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Listing Info & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-[#FFF1E8] text-[#E9784B] border border-[#F6C7A9] px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider text-[10px]">
                {listing.category}
              </span>
              <button
                onClick={() => toggleSaveListing(listing.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isSaved
                    ? 'bg-[#E9784B] text-white border-[#E9784B]'
                    : 'bg-white border-[#E7E5E4] text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#292524] leading-tight">
              {listing.title}
            </h1>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-stone-700 font-bold">
                <Tag className="w-4 h-4 text-[#E9784B]" />
                <span>{listing.mode}</span>
              </div>
              <div className="text-stone-300">•</div>
              <div className="text-stone-600 font-semibold">Condition: {listing.condition}</div>
            </div>

            <div className="p-4 bg-[#FFF1E8]/70 border border-[#F6C7A9] rounded-2xl flex items-center justify-between">
              <span className="text-xs text-stone-600 font-semibold">Value / Preference:</span>
              <span className="text-xl font-black text-[#E9784B]">
                {listing.mode === 'Donate' || listing.mode === 'Hand Over' || listing.price === 0
                  ? 'Free (Donate / Hand Over)'
                  : `₹${listing.price}`}
              </span>
            </div>

            {listing.exchange_preference && (
              <div className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 font-medium">
                <span className="font-bold text-[#E9784B]">Owner Preference: </span>
                {listing.exchange_preference}
              </div>
            )}

            <div className="space-y-1.5 pt-2">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider">Item Description</h3>
              <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-2xl border border-stone-200 whitespace-pre-line font-normal">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Owner Card */}
          <div className="bg-white border border-[#E7E5E4] rounded-3xl p-5 space-y-3 shadow-sm">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Listed By VNR Student</div>
            <div className="flex items-center gap-3">
              <img
                src={owner?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={owner?.name}
                className="w-11 h-11 rounded-full object-cover border border-[#E9784B]/40"
              />
              <div>
                <div className="font-extrabold text-sm text-[#292524]">{owner?.name || 'VNR Student'}</div>
                <div className="text-xs text-stone-500 font-medium">{owner?.branch}</div>
                <div className="text-[11px] text-[#E9784B] font-bold">{owner?.batch}</div>
              </div>
            </div>
            {owner?.bio && <p className="text-xs text-stone-500 italic pt-2 border-t border-stone-100 font-normal">"{owner.bio}"</p>}
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-3">
            {!isOwner && (
              <>
                {listing.status === 'AVAILABLE' || listing.status === 'INTERESTED' ? (
                  userInterest ? (
                    <div className="w-full bg-sky-50 border border-sky-200 text-sky-900 p-4 rounded-2xl text-center text-xs font-bold space-y-1">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-sky-600" /> Interest Sent!
                      </div>
                      <p className="text-stone-500 font-normal">
                        Your interest message has been delivered. The owner will review and accept.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        if (!currentUser) {
                          router.push('/login');
                          return;
                        }
                        setIsInterestModalOpen(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white font-bold py-3.5 rounded-[12px] text-sm shadow-sm transition-all hover:scale-102"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Express Interest</span>
                    </button>
                  )
                ) : (
                  <div className="w-full bg-white border border-[#E7E5E4] text-stone-500 p-4 rounded-2xl text-center text-xs font-semibold">
                    This listing is currently <span className="text-[#292524] font-bold">{listing.status.replace('_', ' ')}</span>.
                  </div>
                )}

                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-400 hover:text-rose-600 py-2 transition-colors font-medium"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Report this listing</span>
                </button>
              </>
            )}

            {/* Owner Control Actions */}
            {isOwner && (
              <div className="bg-white border border-[#F6C7A9] rounded-3xl p-5 space-y-4 shadow-sm">
                <div className="text-xs font-bold text-[#E9784B] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" /> Your Listing Management
                </div>

                {/* Interested Students Section */}
                <div className="space-y-3">
                  <div className="text-xs text-[#292524] font-bold">
                    Interested Students ({listingInterests.length}):
                  </div>

                  {listingInterests.length === 0 ? (
                    <p className="text-xs text-stone-400 italic">No interest requests received yet.</p>
                  ) : (
                    listingInterests.map((interest) => (
                      <div
                        key={interest.id}
                        className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#292524]">{interest.student?.name}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              interest.status === 'ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : interest.status === 'DECLINED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {interest.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-medium">
                          {interest.student?.branch} • {interest.student?.batch}
                        </div>
                        {interest.message && (
                          <p className="text-stone-700 italic bg-white p-2 rounded-lg border border-stone-200 font-normal">"{interest.message}"</p>
                        )}

                        {interest.status === 'PENDING' && (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => acceptInterest(interest.id)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3" /> Accept
                            </button>
                            <button
                              onClick={() => declineInterest(interest.id)}
                              className="bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-800 font-semibold px-3 py-1.5 rounded-xl text-[11px]"
                            >
                              <X className="w-3 h-3" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Handover & Completion Lifecycle Triggers */}
                {listing.status === 'RESERVED' && (
                  <button
                    onClick={() => {
                      if (acceptedInterest) {
                        setSelectedInterestForHandover(acceptedInterest.id);
                        setIsHandoverModalOpen(true);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 rounded-[12px] text-xs shadow-xs transition-all"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Plan Campus Handover</span>
                  </button>
                )}

                {listing.status === 'HANDOVER_PLANNED' && (
                  <div className="space-y-3">
                    {plannedHandover && (
                      <div className="bg-purple-50 border border-purple-200 p-3.5 rounded-2xl text-xs space-y-1 text-purple-900 font-medium">
                        <div className="font-bold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-purple-700" /> Handover at {plannedHandover.location}
                        </div>
                        <div>Date: {plannedHandover.date} ({plannedHandover.time})</div>
                        {plannedHandover.note && <div className="text-[11px] text-stone-600 font-normal">"{plannedHandover.note}"</div>}
                      </div>
                    )}

                    <button
                      onClick={() => completeExchange(listing.id)}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-[12px] text-xs shadow-xs transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Completed</span>
                    </button>
                  </div>
                )}

                {listing.status === 'COMPLETED' && (
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-center space-y-2">
                    <p className="text-xs font-bold text-emerald-800">Exchange Completed Successfully!</p>
                    <button
                      onClick={() => setIsFeedbackModalOpen(true)}
                      className="text-xs text-amber-700 font-bold hover:underline"
                    >
                      Give Feedback to Buyer
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-stone-200">
                  <button
                    onClick={() => {
                      deleteListing(listing.id);
                      router.push('/marketplace');
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Listing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isInterestModalOpen && <InterestModal listing={listing} onClose={() => setIsInterestModalOpen(false)} />}
      {isHandoverModalOpen && selectedInterestForHandover && (
        <HandoverModal
          listingId={listing.id}
          interestId={selectedInterestForHandover}
          onClose={() => setIsHandoverModalOpen(false)}
        />
      )}
      {isFeedbackModalOpen && acceptedInterest && (
        <FeedbackModal
          exchangeId={listing.id}
          toUserId={acceptedInterest.student_id}
          toUserName={acceptedInterest.student?.name || 'Student'}
          onClose={() => setIsFeedbackModalOpen(false)}
        />
      )}
      {isReportModalOpen && (
        <ReportModal
          targetType="listing"
          targetId={listing.id}
          targetTitle={listing.title}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
}
