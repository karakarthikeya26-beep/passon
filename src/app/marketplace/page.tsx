'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { ListingCard } from '../../components/listing-card';
import { Category, Condition, ExchangeMode, ListingStatus } from '../../types';
import { Search, SlidersHorizontal, PlusCircle, Package } from 'lucide-react';
import Link from 'next/link';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const initialCat = searchParams.get('category') as Category | null;
  const initialQuery = searchParams.get('search') || '';

  const { listings } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>(initialCat || 'All');
  const [selectedCondition, setSelectedCondition] = useState<Condition | 'All'>('All');
  const [selectedMode, setSelectedMode] = useState<ExchangeMode | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<ListingStatus | 'ActiveOnly'>('ActiveOnly');
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high'>('newest');

  useEffect(() => {
    if (initialCat) setSelectedCategory(initialCat);
    if (initialQuery) setSearchQuery(initialQuery);
  }, [initialCat, initialQuery]);

  const categories: (Category | 'All')[] = [
    'All',
    'Academic',
    'Books',
    'Electronics',
    'Project',
    'Lab',
    'Hostel',
    'Furniture',
    'Other',
  ];

  const conditions: (Condition | 'All')[] = ['All', 'New', 'Like New', 'Good', 'Fair'];
  const modes: (ExchangeMode | 'All')[] = ['All', 'Sell', 'Exchange', 'Donate', 'Hand Over'];

  const filteredListings = listings.filter((l) => {
    // Availability Filter
    if (selectedStatus === 'ActiveOnly' && l.status === 'COMPLETED') return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = l.title.toLowerCase().includes(q);
      const matchDesc = l.description.toLowerCase().includes(q);
      const matchCat = l.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    // Category filter
    if (selectedCategory !== 'All' && l.category !== selectedCategory) return false;

    // Condition filter
    if (selectedCondition !== 'All' && l.condition !== selectedCondition) return false;

    // Mode filter
    if (selectedMode !== 'All' && l.mode !== selectedMode) return false;

    return true;
  });

  // Sorting
  const sortedListings = [...filteredListings].sort((a, b) => {
    if (sortBy === 'price_low') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-8">
      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#E9784B] text-white shadow-xs'
                : 'bg-white border border-[#E7E5E4] text-stone-700 hover:bg-stone-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Controls & Secondary Filters */}
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, description..."
            className="w-full bg-stone-50 border border-stone-200 focus:border-[#E9784B] text-[#292524] placeholder-stone-400 text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none font-semibold"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Exchange Mode */}
          <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-stone-500 font-bold">Mode:</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value as any)}
              className="bg-transparent text-xs text-[#292524] font-bold focus:outline-none cursor-pointer"
            >
              {modes.map((m) => (
                <option key={m} value={m} className="bg-white text-stone-900">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-stone-500 font-bold">Condition:</span>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value as any)}
              className="bg-transparent text-xs text-[#292524] font-bold focus:outline-none cursor-pointer"
            >
              {conditions.map((c) => (
                <option key={c} value={c} className="bg-white text-stone-900">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#E9784B]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-[#292524] font-bold focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-white text-stone-900">
                Newest First
              </option>
              <option value="price_low" className="bg-white text-stone-900">
                Lowest Value
              </option>
              <option value="price_high" className="bg-white text-stone-900">
                Highest Value
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-stone-500 font-semibold">
          <span>Showing {sortedListings.length} marketplace items</span>
          {(selectedCategory !== 'All' || selectedMode !== 'All' || selectedCondition !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedMode('All');
                setSelectedCondition('All');
                setSearchQuery('');
              }}
              className="text-[#E9784B] font-bold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {sortedListings.length === 0 ? (
          <div className="bg-white border border-[#E7E5E4] rounded-3xl p-16 text-center space-y-3 shadow-xs">
            <Package className="w-12 h-12 text-stone-400 mx-auto" />
            <h3 className="text-base font-bold text-[#292524]">Nothing found here yet.</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium">
              Your next useful discovery might be just around the corner. Try adjusting your filters or post a request on Looking For.
            </p>
            <Link
              href="/looking-for/new"
              className="inline-block mt-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs"
            >
              Post a Request on Looking For
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-3xl font-black text-[#292524] tracking-tight flex items-center gap-2.5">
            <Package className="w-8 h-8 text-[#E9784B]" />
            VNR Student Marketplace
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Find useful things from students around you.
          </p>
        </div>

        <Link
          href="/listing/new"
          className="flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white font-bold px-5 py-3 rounded-[12px] text-xs shadow-xs transition-all hover:scale-102"
        >
          <PlusCircle className="w-4 h-4" />
          <span>List Something Useful</span>
        </Link>
      </div>

      <Suspense fallback={<div className="text-xs text-stone-400 py-10 text-center font-medium">Loading marketplace...</div>}>
        <MarketplaceContent />
      </Suspense>
    </div>
  );
}
