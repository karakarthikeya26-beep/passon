'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { validateImageFile, MAX_FILE_SIZE_BYTES } from '../lib/storage';

export interface SelectedImageItem {
  id: string;
  file?: File;
  previewUrl: string;
  isPreset?: boolean;
}

interface ImageUploadProps {
  images: SelectedImageItem[];
  onChange: (images: SelectedImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 4,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const sampleImagePresets = [
    { label: 'Books & Notes', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800' },
    { label: 'Electronics', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800' },
    { label: 'Lab Equipment', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800' },
  ];

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0 || disabled) return;
    setValidationError(null);

    const newItems: SelectedImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateImageFile(file);

      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid image file.');
        return;
      }

      if (images.length + newItems.length >= maxImages) {
        setValidationError(`You can upload a maximum of ${maxImages} photos per listing.`);
        break;
      }

      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        previewUrl,
        isPreset: false,
      });
    }

    if (newItems.length > 0) {
      onChange([...images, ...newItems]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    if (disabled) return;
    const itemToRemove = images[index];
    if (itemToRemove && itemToRemove.file && itemToRemove.previewUrl.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      } catch {
        // Ignore revoke errors
      }
    }
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
    setValidationError(null);
  };

  const handleAddPreset = (url: string) => {
    if (disabled) return;
    if (images.length >= maxImages) {
      setValidationError(`You can upload a maximum of ${maxImages} photos per listing.`);
      return;
    }
    if (images.some((img) => img.previewUrl === url)) {
      return;
    }
    onChange([
      ...images,
      {
        id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        previewUrl: url,
        isPreset: true,
      },
    ]);
    setValidationError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handleFileSelect(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-stone-700">
            Product Photos <span className="text-rose-500">*</span>
          </label>
          <p className="text-[11px] text-stone-500 font-medium">
            Upload from your device (JPG, PNG, WEBP — up to 5MB)
          </p>
        </div>
        <span className="text-[11px] font-bold text-stone-400">
          {images.length} / {maxImages} photos
        </span>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple={maxImages > 1}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Image Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((item, idx) => (
            <div
              key={item.id}
              className="relative aspect-square rounded-2xl overflow-hidden border-2 border-stone-200 bg-stone-100 group shadow-xs"
            >
              <img
                src={item.previewUrl}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Badge for Primary / Cover Photo */}
              {idx === 0 && (
                <div className="absolute top-2 left-2 bg-[#292524]/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#E9784B]" />
                  Cover Photo
                </div>
              )}

              {/* Action Buttons: Remove & Change */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => fileInputRef.current?.click()}
                  title="Change photo"
                  className="p-1.5 bg-white text-stone-800 rounded-xl hover:bg-stone-100 transition-transform hover:scale-105 shadow-sm text-[11px] font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleRemove(idx)}
                  title="Remove photo"
                  className="p-1.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-transform hover:scale-105 shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* File details banner */}
              {item.file && (
                <div className="absolute bottom-0 inset-x-0 bg-stone-900/80 text-white text-[9px] p-1 px-2 truncate font-medium backdrop-blur-xs">
                  {item.file.name} ({(item.file.size / 1024).toFixed(0)} KB)
                </div>
              )}
            </div>
          ))}

          {/* Add more button tile if under max limit */}
          {images.length < maxImages && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#E9784B] bg-stone-50/70 hover:bg-[#FFF1E8]/40 flex flex-col items-center justify-center gap-1 text-stone-500 hover:text-[#E9784B] transition-all cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              <span className="text-[11px] font-bold">Add Photo</span>
            </button>
          )}
        </div>
      )}

      {/* Main Drop / Upload Area when no images selected */}
      {images.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            dragOver
              ? 'border-[#E9784B] bg-[#FFF1E8]/50 scale-101'
              : 'border-stone-300 bg-stone-50/70 hover:border-[#E9784B] hover:bg-stone-50'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-[#E9784B] shadow-xs">
            <Upload className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-[#292524]">
              Click to upload photo from your device
            </div>
            <p className="text-xs text-stone-500 font-medium">
              or drag and drop your image file here
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            <span>JPG</span> • <span>PNG</span> • <span>WEBP</span> • <span>Max 5 MB</span>
          </div>
          <button
            type="button"
            disabled={disabled}
            className="mt-1 bg-[#E9784B] hover:bg-[#d8673a] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-transform hover:scale-102 flex items-center gap-1.5 pointer-events-none"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Select Photo</span>
          </button>
        </div>
      )}

      {/* Optional demo sample presets for testing */}
      <div className="pt-2 border-t border-stone-200/70">
        <span className="text-[11px] font-bold text-stone-500 block mb-2">
          Or pick a sample campus preset photo:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {sampleImagePresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => handleAddPreset(preset.url)}
              className="flex items-center gap-2 bg-white border border-stone-200 hover:border-[#E9784B] rounded-xl p-1.5 pr-3 text-xs text-stone-700 font-semibold shrink-0 hover:bg-stone-50 transition-colors shadow-2xs disabled:opacity-50"
            >
              <img
                src={preset.url}
                alt={preset.label}
                className="w-8 h-8 rounded-lg object-cover"
              />
              <span className="text-[11px] font-medium">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
