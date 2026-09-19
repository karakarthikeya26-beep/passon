'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { Category, Condition, ExchangeMode } from '../../../types';
import { PlusCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload, SelectedImageItem } from '../../../components/image-upload';
import { uploadListingImage } from '../../../lib/storage';

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
  
  // Selected images state from ImageUpload
  const [selectedImages, setSelectedImages] = useState<SelectedImageItem[]>([]);
  
  // Upload and submission state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please enter an item title.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Please provide a description of the item.');
      return;
    }

    if (selectedImages.length === 0) {
      setErrorMessage('Please upload or select at least one photo for your listing.');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      const finalImageUrls: string[] = [];

      // Upload each file to Supabase Storage
      for (let i = 0; i < selectedImages.length; i++) {
        const item = selectedImages[i];
        if (item.file) {
          setUploadStatus(`Uploading photo ${i + 1} of ${selectedImages.length} to Supabase Storage...`);
          const result = await uploadListingImage(item.file, currentUser.id);
          finalImageUrls.push(result.publicUrl);
        } else if (item.previewUrl) {
          // Preset image or existing URL
          finalImageUrls.push(item.previewUrl);
        }
      }

      setUploadStatus('Publishing listing to PassOn...');

      const finalPrice = mode === 'Donate' || mode === 'Hand Over' ? 0 : price;

      await createListing({
        owner_id: currentUser.id,
        title: title.trim(),
        category,
        condition,
        mode,
        price: finalPrice,
        exchange_preference: exchangePreference.trim(),
        description: description.trim(),
        images: finalImageUrls,
      });

      router.push('/marketplace');
    } catch (err: any) {
      console.error('[CreateListing] Submission error:', err);
      setErrorMessage(err.message || 'Failed to upload photo or create listing. Please try again.');
      setIsUploading(false);
      setUploadStatus('');
    }
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

        {/* Global Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Error creating listing</p>
              <p className="font-normal text-rose-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Item Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              disabled={isUploading}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Casio Scientific Calculator FX-991EX"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-[#292524] placeholder-stone-400 focus:outline-none focus:border-[#E9784B] font-semibold disabled:opacity-60"
              required
            />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">Category</label>
              <select
                value={category}
                disabled={isUploading}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold disabled:opacity-60"
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
                disabled={isUploading}
                onChange={(e) => setCondition(e.target.value as Condition)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold disabled:opacity-60"
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
                    disabled={isUploading}
                    onClick={() => setMode(m)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      mode === m
                        ? 'bg-[#E9784B] text-white border-[#E9784B] shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    } disabled:opacity-60`}
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
                  disabled={isUploading}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="e.g. 600"
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold disabled:opacity-60"
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
                  disabled={isUploading}
                  onChange={(e) => setExchangePreference(e.target.value)}
                  placeholder="e.g. Exchange for S5 CSE handbook or ₹600"
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold disabled:opacity-60"
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
                  disabled={isUploading}
                  onChange={(e) => setExchangePreference(e.target.value)}
                  placeholder="e.g. Hand over near library entrance after 1:30 PM"
                  className="w-full bg-white border border-stone-200 rounded-xl p-3 text-sm text-[#292524] focus:outline-none focus:border-[#E9784B] font-semibold disabled:opacity-60"
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
              disabled={isUploading}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe condition, included accessories, usage history..."
              rows={4}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-sm text-[#292524] placeholder-stone-400 focus:outline-none focus:border-[#E9784B] font-medium disabled:opacity-60"
              required
            />
          </div>

          {/* Device Image Upload Component (Replaces old URL input) */}
          <div className="pt-2">
            <ImageUpload
              images={selectedImages}
              onChange={setSelectedImages}
              disabled={isUploading}
              maxImages={4}
            />
          </div>

          {/* Actions & Submit */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <Link
              href="/marketplace"
              className="px-5 py-3 rounded-[12px] text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white font-bold px-6 py-3 rounded-[12px] text-xs shadow-xs transition-all hover:scale-102 disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{uploadStatus || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Publish to PassOn</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
