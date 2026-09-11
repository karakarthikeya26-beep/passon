'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { MatchCard } from '../../components/match-card';
import { Sparkles, SearchCode, ArrowRight } from 'lucide-react';

export default function MatchesPage() {
  const { matches, lookingFor } = useApp();
  const { currentUser } = useAuth();

  const userRequests = currentUser ? lookingFor.filter((r) => r.student_id === currentUser.id) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200 space-y-2">
        <div className="inline-flex items-center gap-2 bg-[#FFF1E8] border border-[#F6C7A9] text-[#E9784B] text-xs font-bold px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>PassOn Transparent Demand Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
          My Demand & Supply Matches
        </h1>
        <p className="text-xs text-stone-500">
          PassOn automatically matches your active Looking For requests with available campus listings using category, keywords, and exchange compatibility.
        </p>
      </div>

      {/* Matches List */}
      {matches.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-3xl p-16 text-center space-y-4 shadow-sm">
          <SearchCode className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">No active matches found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {userRequests.length === 0
              ? "You haven't posted any Looking For requests yet. Post a request and PassOn will scan available campus listings for matches!"
              : "We're monitoring active VNR listings. When a matching item is listed by a senior or student, it will appear here."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/looking-for/new"
              className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
            >
              Post a Request
            </Link>
            <Link
              href="/marketplace"
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
            >
              Browse All Listings
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-xs font-semibold text-[#E9784B]">
            Found {matches.length} candidate match{matches.length > 1 ? 'es' : ''} for your requests:
          </div>

          <div className="space-y-4">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
