'use client';

import React from 'react';
import Link from 'next/link';
import { Match } from '../types';
import { Sparkles, ArrowRight, CheckCircle2, Tag } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const listing = match.listing;
  const request = match.request;

  if (!listing || !request) return null;

  const ownerName = listing.owner?.name || 'VNR Student';
  const ownerBranch = listing.owner?.branch ? listing.owner.branch.split(' ')[0] : 'VNR';

  return (
    <div className="bg-[#FFF1E8]/70 border border-[#F6C7A9] rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header Match Reason Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#F6C7A9]/60">
        <div className="flex items-center gap-2">
          <span className="bg-[#E9784B] text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            STRONG MATCH ({match.match_score}%)
          </span>
        </div>

        <span className="text-xs text-[#E9784B] font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {match.match_reason}
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Your Request side */}
        <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-1">
          <div className="text-[10px] uppercase font-extrabold tracking-wider text-sky-700">You're Looking For</div>
          <div className="text-sm font-bold text-[#292524]">{request.title}</div>
          <div className="text-xs text-stone-500">{request.category} • Seeking: {request.mode}</div>
        </div>

        {/* Available Listing side */}
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center gap-3">
          <img
            src={listing.images[0] || 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?w=300'}
            alt={listing.title}
            className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
          />
          <div className="flex-1 truncate">
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-700 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Available Listing
            </div>
            <div className="text-sm font-bold text-[#292524] truncate">{listing.title}</div>
            <div className="text-xs text-stone-600 flex items-center justify-between mt-0.5">
              <span>{listing.category} • {listing.condition}</span>
              <span className="text-[#E9784B] font-extrabold">{listing.price ? `₹${listing.price}` : 'Free'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-2 flex items-center justify-between text-xs">
        <div className="text-stone-600 font-medium">
          Listed by <span className="text-[#292524] font-bold">{ownerName}</span> ({ownerBranch})
        </div>

        <Link
          href={`/marketplace/${listing.id}`}
          className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white px-4 py-2 rounded-xl font-bold shadow-xs transition-all hover:scale-102"
        >
          <span>View Listing & Express Interest</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
