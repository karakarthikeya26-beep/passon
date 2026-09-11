'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ListingCard } from '../components/listing-card';
import { LookingForCard } from '../components/looking-for-card';
import { KnowledgeCard } from '../components/knowledge-card';
import {
  Package, SearchCode, BookOpen, ArrowRight, Search, Sparkles,
  Handshake, CheckCircle2, MessageSquare, Repeat
} from 'lucide-react';
import { Category } from '../types';

export default function HomePage() {
  const router = useRouter();
  const { listings, lookingFor, knowledgePosts } = useApp();
  const [heroSearch, setHeroSearch] = useState('');

  const categories: Category[] = [
    'Academic',
    'Books',
    'Electronics',
    'Project',
    'Lab',
    'Hostel',
    'Other',
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  const activeListings = listings.filter((l) => l.status === 'AVAILABLE').slice(0, 4);
  const activeRequests = lookingFor.filter((r) => r.status === 'OPEN').slice(0, 3);
  const recentKnowledge = knowledgePosts.slice(0, 3);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#E7E5E4] bg-[#FFFCF8]">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#FFF1E8] border border-[#F6C7A9] text-[#E9784B] text-xs font-extrabold px-4 py-1.5 rounded-full shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>VNR VJIET Student Community Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#292524] tracking-tight leading-tight uppercase">
            PASS IT FORWARD<span className="text-[#E9784B]">.</span>
          </h1>

          <div className="space-y-2">
            <p className="text-xl sm:text-2xl font-bold text-[#E9784B]">
              “What you don't need. What someone else does.”
            </p>
            <p className="text-sm sm:text-base text-[#78716C] max-w-2xl mx-auto font-medium leading-relaxed">
              Exchange useful things, find what you need, and share knowledge with the students who come after you.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white font-bold px-6 py-3.5 rounded-[12px] text-sm shadow-sm transition-all hover:scale-102"
            >
              <Package className="w-4 h-4" />
              <span>Browse Marketplace</span>
            </Link>

            <Link
              href="/looking-for/new"
              className="flex items-center gap-2 bg-white hover:bg-stone-50 text-[#292524] border border-[#E7E5E4] font-bold px-6 py-3.5 rounded-[12px] text-sm transition-all hover:scale-102 shadow-xs"
            >
              <SearchCode className="w-4 h-4 text-sky-600" />
              <span>Post What You're Looking For</span>
            </Link>

            <Link
              href="/knowledge"
              className="flex items-center gap-2 bg-white hover:bg-stone-50 text-[#292524] border border-[#E7E5E4] font-bold px-6 py-3.5 rounded-[12px] text-sm transition-all hover:scale-102 shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Explore Knowledge Shelf</span>
            </Link>
          </div>

          {/* Hero Search Box */}
          <div className="pt-6 max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                placeholder="Search books, calculators, lab items, project equipment..."
                className="w-full bg-white border border-[#E7E5E4] focus:border-[#E9784B] text-[#292524] placeholder-stone-400 pl-12 pr-28 py-4 rounded-2xl text-sm font-semibold shadow-sm focus:outline-none transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 bg-[#E9784B] hover:bg-[#d8673a] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
              >
                Search
              </button>
            </form>

            {/* Category Chips */}
            <div className="flex items-center justify-center flex-wrap gap-2 mt-4">
              <span className="text-xs text-stone-500 font-medium mr-1">Categories:</span>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/marketplace?category=${encodeURIComponent(cat)}`}
                  className="bg-white hover:bg-[#FFF1E8] text-stone-700 hover:text-[#E9784B] border border-[#E7E5E4] text-xs font-semibold px-3 py-1 rounded-full transition-all"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recently Listed Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#292524] tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-[#E9784B]" />
              Recently Listed on Campus
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1">Useful items made available by VNR students around you</p>
          </div>
          <Link
            href="/marketplace"
            className="flex items-center gap-1.5 text-xs font-bold text-[#E9784B] hover:underline transition-colors"
          >
            <span>View All ({listings.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {activeListings.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-3xl p-10 text-center space-y-2">
            <Package className="w-10 h-10 text-stone-400 mx-auto" />
            <p className="text-sm font-bold text-[#292524]">Nothing listed yet.</p>
            <p className="text-xs text-stone-500">Your next useful discovery might be just around the corner.</p>
            <Link
              href="/listing/new"
              className="inline-block mt-3 bg-[#E9784B] text-white font-bold text-xs px-4 py-2 rounded-xl"
            >
              List Something Useful
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {activeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* Students are Looking For Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#292524] tracking-tight flex items-center gap-2.5">
              <SearchCode className="w-6 h-6 text-sky-600" />
              Students are Looking For
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1">Can't find what you need? Post a request for the VNR community</p>
          </div>
          <Link
            href="/looking-for"
            className="flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:underline transition-colors"
          >
            <span>Explore All Needs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {activeRequests.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-3xl p-10 text-center space-y-2">
            <SearchCode className="w-10 h-10 text-stone-400 mx-auto" />
            <p className="text-sm font-bold text-[#292524]">Can't find what you need?</p>
            <p className="text-xs text-stone-500">Post a request and let the VNR community know.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeRequests.map((request) => (
              <LookingForCard key={request.id} request={request} />
            ))}
          </div>
        )}
      </section>

      {/* From the Knowledge Shelf Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[#292524] tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              From the Knowledge Shelf
            </h2>
            <p className="text-xs text-stone-500 font-medium mt-1">What seniors learned. What juniors can use.</p>
          </div>
          <Link
            href="/knowledge"
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline transition-colors"
          >
            <span>Browse Knowledge Shelf</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentKnowledge.map((post) => (
            <KnowledgeCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {/* How PassOn Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-[#FFF1E8]/70 border border-[#F6C7A9] rounded-3xl p-8 sm:p-12 space-y-8 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#292524]">How PassOn Works</h2>
            <p className="text-xs text-stone-600 font-medium">Simple, trusted student-to-student exchange on campus</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl space-y-2 text-center shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#FFF1E8] text-[#E9784B] flex items-center justify-center font-extrabold text-base mx-auto">
                1
              </div>
              <h3 className="font-bold text-sm text-[#292524]">List or ask</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                List unused gear or post a request on Looking For.
              </p>
            </div>

            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl space-y-2 text-center shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-extrabold text-base mx-auto">
                2
              </div>
              <h3 className="font-bold text-sm text-[#292524]">Find a match</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                PassOn engine surfaces strong matches automatically.
              </p>
            </div>

            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl space-y-2 text-center shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-extrabold text-base mx-auto">
                3
              </div>
              <h3 className="font-bold text-sm text-[#292524]">Connect</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Express interest and message the owner.
              </p>
            </div>

            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl space-y-2 text-center shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-base mx-auto">
                4
              </div>
              <h3 className="font-bold text-sm text-[#292524]">Hand it over</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Arrange a handover at VNR library or canteen.
              </p>
            </div>

            <div className="bg-white border border-[#E7E5E4] p-5 rounded-2xl space-y-2 text-center shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-extrabold text-base mx-auto">
                5
              </div>
              <h3 className="font-bold text-sm text-[#292524]">Pass it forward</h3>
              <p className="text-xs text-stone-500 leading-relaxed font-normal">
                Complete exchange & share experience on Knowledge Shelf.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
