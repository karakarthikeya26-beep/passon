'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../context/AppContext';
import { Search, X, Package, SearchCode, BookOpen, ArrowRight } from 'lucide-react';

interface SearchModalProps {
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ onClose }) => {
  const { listings, lookingFor, knowledgePosts } = useApp();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'marketplace' | 'looking-for' | 'knowledge'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const q = query.trim().toLowerCase();

  const filteredListings = listings.filter(
    (l) =>
      q === '' ||
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.category.toLowerCase().includes(q)
  );

  const filteredRequests = lookingFor.filter(
    (r) =>
      q === '' ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
  );

  const filteredKnowledge = knowledgePosts.filter(
    (k) =>
      q === '' ||
      k.title.toLowerCase().includes(q) ||
      k.content.toLowerCase().includes(q) ||
      k.tags.some((t) => t.toLowerCase().includes(q))
  );

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-start justify-center pt-12 sm:pt-20 px-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[80vh] text-stone-900">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-stone-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#E9784B] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, calculators, lab items, project equipment, placement notes..."
            className="w-full bg-transparent text-[#292524] placeholder-stone-400 focus:outline-none text-base font-semibold"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-stone-400 hover:text-stone-700 p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="bg-stone-100 hover:bg-stone-200 text-stone-600 px-3 py-1.5 rounded-xl text-xs font-bold">
            ESC
          </button>
        </div>

        {/* Search Filter Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-stone-100 bg-stone-50 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'all' ? 'bg-[#E9784B] text-white font-bold' : 'text-stone-600 hover:text-[#292524]'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'marketplace' ? 'bg-[#E9784B] text-white font-bold' : 'text-stone-600 hover:text-[#292524]'
            }`}
          >
            Marketplace ({filteredListings.length})
          </button>
          <button
            onClick={() => setActiveTab('looking-for')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'looking-for' ? 'bg-[#E9784B] text-white font-bold' : 'text-stone-600 hover:text-[#292524]'
            }`}
          >
            Looking For ({filteredRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeTab === 'knowledge' ? 'bg-[#E9784B] text-white font-bold' : 'text-stone-600 hover:text-[#292524]'
            }`}
          >
            Knowledge ({filteredKnowledge.length})
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
          {q === '' && (
            <p className="text-xs text-stone-500 text-center py-4 font-medium">
              Type keywords above to search across VNR Marketplace, Looking For requests, and Knowledge Shelf.
            </p>
          )}

          {/* Marketplace Results */}
          {(activeTab === 'all' || activeTab === 'marketplace') && filteredListings.length > 0 && (
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-600" /> Marketplace Listings
              </div>
              <div className="space-y-2">
                {filteredListings.slice(0, 4).map((l) => (
                  <Link
                    key={l.id}
                    href={`/marketplace/${l.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-[#FFF1E8] border border-stone-200 hover:border-[#F6C7A9] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={l.images[0]} alt={l.title} className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                      <div>
                        <div className="text-sm font-bold text-[#292524] group-hover:text-[#E9784B]">{l.title}</div>
                        <div className="text-xs text-stone-500">
                          {l.category} • {l.mode} • {l.price ? `₹${l.price}` : 'Free'}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#E9784B] transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Looking For Results */}
          {(activeTab === 'all' || activeTab === 'looking-for') && filteredRequests.length > 0 && (
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <SearchCode className="w-3.5 h-3.5 text-sky-600" /> Looking For Requests
              </div>
              <div className="space-y-2">
                {filteredRequests.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    href="/looking-for"
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-sky-50 border border-stone-200 hover:border-sky-200 transition-all group"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#292524] group-hover:text-sky-700">{r.title}</div>
                      <div className="text-xs text-stone-500">
                        {r.category} • Seeking: {r.mode} • Status: {r.status}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-sky-600 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Shelf Results */}
          {(activeTab === 'all' || activeTab === 'knowledge') && filteredKnowledge.length > 0 && (
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Knowledge Shelf Posts
              </div>
              <div className="space-y-2">
                {filteredKnowledge.slice(0, 4).map((k) => (
                  <Link
                    key={k.id}
                    href={`/knowledge/${k.id}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 hover:bg-indigo-50 border border-stone-200 hover:border-indigo-200 transition-all group"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#292524] group-hover:text-indigo-700">{k.title}</div>
                      <div className="text-xs text-stone-500">
                        {k.category} • {k.author?.name} • Useful: {k.useful_count}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {q !== '' &&
            filteredListings.length === 0 &&
            filteredRequests.length === 0 &&
            filteredKnowledge.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm text-stone-700 font-bold">Nothing matched your search for "{query}".</p>
                <p className="text-xs text-stone-500 mt-1 font-medium">
                  Try searching for keywords like "calculator", "drawing set", "placement", or "lab".
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
