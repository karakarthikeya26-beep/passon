'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { KnowledgeCard } from '../../components/knowledge-card';
import { KnowledgeCategory } from '../../types';
import { BookOpen, Search, PlusCircle, Sparkles } from 'lucide-react';

export default function KnowledgeShelfPage() {
  const { knowledgePosts } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: (KnowledgeCategory | 'All')[] = [
    'All',
    'Placement',
    'Academics',
    'Projects',
    'Hackathons',
    'Campus Life',
    'Hostel',
    'Clubs',
    'Internships',
    'General Advice',
  ];

  const filteredPosts = knowledgePosts.filter((post) => {
    if (selectedCategory !== 'All' && post.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      const matchTags = post.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchContent && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#FFF1E8] border border-[#F6C7A9] text-[#E9784B] text-xs font-bold px-3 py-1 rounded-full mb-2">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Senior Knowledge Repository</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-8 h-8 text-[#E9784B]" />
            Knowledge Shelf
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            What seniors learned. What juniors can use. Persistent advice that doesn't disappear in WhatsApp chats.
          </p>
        </div>

        <Link
          href="/knowledge/new"
          className="flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold px-5 py-3 rounded-2xl text-xs shadow-sm transition-all hover:scale-[1.02]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Share Knowledge</span>
        </Link>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-[#E9784B] text-white font-bold shadow-sm'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search placement tips, project ideas, hackathons, subjects..."
          className="w-full bg-white border border-stone-200 focus:border-[#E9784B] text-stone-900 placeholder-stone-400 text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none shadow-sm transition-colors"
        />
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white border border-stone-200/80 rounded-3xl p-16 text-center space-y-3 shadow-sm">
          <BookOpen className="w-12 h-12 text-stone-400 mx-auto" />
          <h3 className="text-base font-bold text-stone-800">Knowledge Shelf is waiting for the next great tip.</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            No posts found for this category or search term.
          </p>
          <Link
            href="/knowledge/new"
            className="inline-block mt-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
          >
            Be the first to share guidance
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <KnowledgeCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
