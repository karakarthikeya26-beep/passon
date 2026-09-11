'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { Category, Condition, ExchangeMode } from '../../../types';
import { PlusCircle, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateListingPage() {
  const router = useRouter();
  const { createListing } = useApp();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Academic');
  const [condition, setCondition] = useState<Condition>('Good');
  const [mode, setMode] = useState<ExchangeMode>('Exchange');
  const [price, setPrice] = useState<number>(500);
  const [exchangePreference, setExchangePreference] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?w=800'
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

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

  const conditions: Condition[] = ['New', 'Like New', 'Good', 'Fair'];
  const modes: ExchangeMode[] = ['Sell', 'Exchange', 'Donate', 'Hand Over'];

  const sampleImagePresets = [
    'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e48b?w=800', // Calculator
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800', // Books
    'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800', // Arduino
    'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=800', // Lab coat
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800', // Laptop stand
  ];

  const handleAddPresetImage = (url: string) => {
    if (!images.includes(url)) {
      setImages([...images, url]);
    }
  };

  const handleAddCustomImage = () => {
    if (newImageUrl.trim() && !images.includes(newImageUrl.trim())) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!title.trim() || !description.trim()) return;

    const finalPrice = mode === 'Donate' || mode === 'Hand Over' ? 0 : price;

    createListing({
      owner_id: currentUser.id,
      title: title.trim(),
      category,
      condition,
      mode,
      price: finalPrice,
      exchange_preference: exchangePreference.trim(),
      description: description.trim(),
      images: images.length > 0 ? images : [sampleImagePresets[0]],
    });

    router.push('/marketplace');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#292524] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Marketplace</span>
      </Link>

      <div className="bg-white border border-[#E7E5E4] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-[#292524] tracking-tight flex items-center gap-2">
            <PlusCircle className="w-7 h-7 text-[#E9784B]" />
            List something useful.
          </h1>
          <p className="text-xs text-stone-500 font-medium">
            Pass on what you no longer need to another VNR student.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Item Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Casio Scientific Calculator FX-991EX"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-[#292524] placeholder-stone-400 focus:outline-none focus:border-[#E9784B] font-semibold"
              required
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as Condition)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold"
              >
                {conditions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exchange Mode & Mode Rules */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-2">Exchange Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {modes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      mode === m
                        ? 'bg-[#E9784B] text-white border-[#E9784B] shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode specific fields */}
            {mode === 'Sell' && (
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  Expected Price (₹)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="e.g. 600"
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold"
                  min={0}
                />
                <p className="text-[11px] text-stone-500 font-medium">
                  Price is informational for campus peer exchange. No payment gateways are processed on PassOn.
                </p>
              </div>
            )}

            {mode === 'Exchange' && (
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  Exchange Preference / Expected Item or Value
                </label>
                <input
                  type="text"
                  value={exchangePreference}
                  onChange={(e) => setExchangePreference(e.target.value)}
                  placeholder="e.g. Exchange for S5 CSE handbook or ₹600"
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold"
                />
              </div>
            )}

            {mode === 'Donate' && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 font-semibold">
                ❤️ <strong>Donation Mode:</strong> This item will be handed over to another VNR student completely free of cost.
              </div>
            )}

            {mode === 'Hand Over' && (
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  Handover Note / Location Preference
                </label>
                <input
                  type="text"
                  value={exchangePreference}
                  onChange={(e) => setExchangePreference(e.target.value)}
                  placeholder="e.g. Hand over near library entrance after 1:30 PM"
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold"
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, included accessories, usage history..."
              rows={4}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-[#292524] placeholder-stone-400 focus:outline-none focus:border-[#E9784B] font-medium"
              required
            />
          </div>

          {/* Image Upload & Previews */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-stone-700">Item Images</label>

            {/* Current Image Previews */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-stone-200 group bg-stone-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-white/90 text-rose-600 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Image Preset or Custom URL */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3">
              <span className="text-xs text-stone-500 font-bold block">Select demo sample photo:</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {sampleImagePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPresetImage(preset)}
                    className="w-14 h-14 rounded-lg overflow-hidden border border-stone-200 shrink-0 hover:scale-105 transition-transform"
                  >
                    <img src={preset} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Or paste image URL (https://...)"
                  className="flex-1 bg-white border border-stone-200 rounded-xl p-2.5 text-xs text-[#292524] focus:outline-none font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddCustomImage}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-3.5 py-2 rounded-xl text-xs font-bold"
                >
                  Add Photo
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <Link
              href="/marketplace"
              className="px-5 py-3 rounded-[12px] text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white font-bold px-6 py-3 rounded-[12px] text-xs shadow-xs transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish to PassOn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
