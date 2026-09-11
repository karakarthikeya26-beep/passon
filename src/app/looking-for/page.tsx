'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { LookingForCard } from '../../components/looking-for-card';
import { Category, RequestStatus } from '../../types';
import { SearchCode, PlusCircle, Sparkles } from 'lucide-react';

export default function LookingForPage() {
  const { lookingFor } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus | 'All'>('OPEN');

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

  const filteredRequests = lookingFor.filter((r) => {
    if (selectedCategory !== 'All' && r.category !== selectedCategory) return false;
    if (selectedStatus !== 'All' && r.status !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-3xl font-black text-[#292524] tracking-tight flex items-center gap-2.5">
            <SearchCode className="w-8 h-8 text-sky-600" />
            Can't find what you need? Ask for it.
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Describe what you are seeking and let the VNR community help you find it.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/matches"
            className="flex items-center gap-2 bg-[#FFF1E8] border border-[#F6C7A9] text-[#E9784B] font-bold px-4 py-3 rounded-[12px] text-xs transition-all hover:bg-[#FFE8D9]"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>My Matches</span>
          </Link>

          <Link
            href="/looking-for/new"
            className="flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white font-bold px-5 py-3 rounded-[12px] text-xs shadow-xs transition-all hover:scale-102"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Post a Looking For Request</span>
          </Link>
        </div>
      </div>

      {/* Category Chips */}
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

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setSelectedStatus('OPEN')}
          className={`px-3 py-1.5 rounded-lg border ${
            selectedStatus === 'OPEN'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-white border-stone-200 text-stone-600'
          }`}
        >
          Open Requests
        </button>
        <button
          onClick={() => setSelectedStatus('MATCHED')}
          className={`px-3 py-1.5 rounded-lg border ${
            selectedStatus === 'MATCHED'
              ? 'bg-purple-50 text-purple-800 border-purple-200'
              : 'bg-white border-stone-200 text-stone-600'
          }`}
        >
          Matched Requests
        </button>
        <button
          onClick={() => setSelectedStatus('All')}
          className={`px-3 py-1.5 rounded-lg border ${
            selectedStatus === 'All'
              ? 'bg-stone-200 text-stone-900 border-stone-300'
              : 'bg-white border-stone-200 text-stone-600'
          }`}
        >
          All Requests
        </button>
      </div>

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-[#E7E5E4] rounded-3xl p-16 text-center space-y-3 shadow-xs">
          <SearchCode className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-[#292524]">No requests yet</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium">
            Post what you're looking for and let the VNR community help.
          </p>
          <Link
            href="/looking-for/new"
            className="inline-block mt-2 bg-[#E9784B] hover:bg-[#d8673a] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all"
          >
            Post a Request
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <LookingForCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
