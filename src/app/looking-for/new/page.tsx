'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { Category, RequestMode } from '../../../types';
import { SearchCode, ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function CreateLookingForPage() {
  const router = useRouter();
  const { createLookingFor } = useApp();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Academic');
  const [mode, setMode] = useState<RequestMode>('ANY');
  const [description, setDescription] = useState('');

  const categories: Category[] = [
    'Academic',
    'Books',
    'Electronics',
    'Project',
    'Lab',
    'Hostel',
    'Furniture',
    'Other',
  ];

  const modes: RequestMode[] = ['ANY', 'BUY', 'EXCHANGE', 'DONATE'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!title.trim() || !description.trim()) return;

    await createLookingFor({
      student_id: currentUser.id,
      title: title.trim(),
      category,
      mode,
      description: description.trim(),
    });

    router.push('/matches');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/looking-for"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Looking For</span>
      </Link>

      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <SearchCode className="w-7 h-7 text-[#E9784B]" />
            Post a Request on Looking For
          </h1>
          <p className="text-xs text-stone-500">
            Can't find what you need? Describe what you're seeking and let the VNR community help.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Need Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Looking for a used scientific calculator for next semester"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
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
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Preferred Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as RequestMode)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
              >
                {modes.map((m) => (
                  <option key={m} value={m}>
                    {m === 'ANY' ? 'Any Mode (Buy / Exchange / Donate)' : m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Specify requirements, preferred models, urgency, or acceptable alternatives..."
              rows={4}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
              required
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <Link
              href="/looking-for"
              className="px-5 py-3 rounded-2xl text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-sm transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
