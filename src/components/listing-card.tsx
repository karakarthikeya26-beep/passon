'use client';

import React from 'react';
import Link from 'next/link';
import { Listing } from '../types';
import { ListingStatusBadge } from './listing-status-badge';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Tag, ArrowRight } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing }) => {
  const { savedListings, toggleSaveListing } = useApp();
  const { currentUser } = useAuth();

  const isSaved = currentUser
    ? savedListings.some((s) => s.listing_id === listing.id)
    : false;

  const ownerName = listing.owner?.name || 'VNR Student';
  const ownerBranch = listing.owner?.branch ? listing.owner.branch.split(' ')[0] : 'VNR';
  const ownerBatch = listing.owner?.batch ? listing.owner.batch.split(' ')[0] : '';

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group">
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={listing.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800'}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <ListingStatusBadge status={listing.status} size="sm" />
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSaveListing(listing.id);
            }}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
              isSaved
                ? 'bg-[#E9784B] text-white border-[#E9784B] shadow-sm'
                : 'bg-white/90 text-stone-600 hover:text-[#E9784B] border-stone-200 hover:bg-white'
            }`}
            title={isSaved ? 'Unsave item' : 'Save item'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Bottom Mode & Price Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-stone-800">
          <span className="bg-white/90 border border-stone-200/80 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 shadow-xs">
            <Tag className="w-3 h-3 text-[#E9784B]" />
            {listing.mode}
          </span>
          <span className="font-extrabold text-xs text-[#E9784B] bg-[#FFF1E8] px-2.5 py-1 rounded-lg border border-[#F6C7A9]">
            {listing.mode === 'Donate' || listing.mode === 'Hand Over' || listing.price === 0
              ? 'Free'
              : `₹${listing.price}`}
          </span>
        </div>
      </div>

      {/* Details Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-semibold">
            <span className="text-[#E9784B]">{listing.category}</span>
            <span>•</span>
            <span>{listing.condition} condition</span>
          </div>

          <h3 className="font-bold text-base text-[#292524] group-hover:text-[#E9784B] transition-colors line-clamp-1">
            {listing.title}
          </h3>

          <p className="text-xs text-[#78716C] line-clamp-2 leading-relaxed font-normal">
            {listing.description}
          </p>
        </div>

        {/* Owner context & Action */}
        <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
          <div className="text-xs text-stone-600 truncate font-medium">
            <span className="font-bold text-[#292524]">{ownerName.split(' ')[0]}</span>
            <span className="text-stone-300 mx-1">•</span>
            <span className="text-stone-500 text-[11px]">{ownerBranch} {ownerBatch}</span>
          </div>

          <Link
            href={`/marketplace/${listing.id}`}
            className="flex items-center gap-1 bg-[#FFF1E8] hover:bg-[#E9784B] text-[#E9784B] hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border border-[#F6C7A9]/60 hover:border-[#E9784B]"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
