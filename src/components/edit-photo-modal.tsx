'use client';

import React, { useState } from 'react';
import { X, Camera, Loader2, AlertCircle, Check } from 'lucide-react';
import { Listing } from '../types';
import { useApp } from '../context/AppContext';
import { ImageUpload, SelectedImageItem } from './image-upload';
import { uploadListingImage } from '../lib/storage';

interface EditPhotoModalProps {
  listing: Listing;
  onClose: () => void;
}

export const EditPhotoModal: React.FC<EditPhotoModalProps> = ({ listing, onClose }) => {
  const { updateListing } = useApp();

  // Initialize with existing listing photos
  const [images, setImages] = useState<SelectedImageItem[]>(() =>
    (listing.images || []).map((url, idx) => ({
      id: `existing_${idx}_${Date.now()}`,
      previewUrl: url,
      isPreset: false,
    }))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (images.length === 0) {
      setErrorMessage('A listing must have at least one photo.');
      return;
    }

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const finalImageUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (item.file) {
          setStatusMessage(`Uploading photo ${i + 1} of ${images.length}...`);
          const result = await uploadListingImage(item.file, listing.owner_id, listing.id);
          finalImageUrls.push(result.publicUrl);
        } else if (item.previewUrl) {
          finalImageUrls.push(item.previewUrl);
        }
      }

      setStatusMessage('Saving listing changes...');
      await updateListing(listing.id, { images: finalImageUrls });

      onClose();
    } catch (err: any) {
      console.error('[EditPhotoModal] Save error:', err);
      setErrorMessage(err.message || 'Failed to update listing photos.');
      setIsSaving(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-stone-200 max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isSaving}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#292524] flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#E9784B]" />
            Manage Listing Photos
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Upload new photos from your device, change order, or remove outdated photos.
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <ImageUpload
            images={images}
            onChange={setImages}
            disabled={isSaving}
            maxImages={4}
          />

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-500 hover:text-stone-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-xs transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusMessage || 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Photo Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
