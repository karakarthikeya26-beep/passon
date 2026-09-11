'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { KnowledgeCategory } from '../../../types';
import { BookOpen, ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateKnowledgePage() {
  const router = useRouter();
  const { createKnowledgePost } = useApp();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<KnowledgeCategory>('Placement');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('Placement, Interview, DSA');

  const categories: KnowledgeCategory[] = [
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!title.trim() || !content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const post = createKnowledgePost({
      author_id: currentUser.id,
      title: title.trim(),
      category,
      content: content.trim(),
      tags,
    });

    router.push(`/knowledge/${post.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Knowledge Shelf</span>
      </Link>

      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-[#E9784B]" />
            Share Knowledge
          </h1>
          <p className="text-xs text-stone-500">
            Pass forward your academic, placement, project, or campus experience to juniors.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. How I prepared for placement coding rounds & tech interviews"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as KnowledgeCategory)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Knowledge Content & Guidance <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share structured experience: What I did, What worked, Mistakes I made, Resources, Advice for juniors..."
              rows={10}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors leading-relaxed"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tags <span className="text-stone-400 font-normal">(Comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Placement, Interview, DSA, CSE"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <Link
              href="/knowledge"
              className="px-5 py-3 rounded-2xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-sm transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish to Knowledge Shelf</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
