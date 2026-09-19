import { supabase, isSupabaseConfigured, generateUUID } from './supabase';

export const STORAGE_BUCKET = 'listing-images';
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file for type and maximum size
 */
export const validateImageFile = (file: File): ValidationResult => {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  // Check file type
  const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const isExtValid = ALLOWED_EXTENSIONS.includes(extension);

  if (!isMimeValid && !isExtValid) {
    return {
      valid: false,
      error: 'Invalid file format. Please upload a JPG, JPEG, PNG, or WEBP photo.',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeInMB} MB). Maximum allowed size is 5 MB.`,
    };
  }

  return { valid: true };
};

/**
 * Uploads an image file to Supabase Storage under the listing-images bucket
 * Organizes files into: listings/{userId}/{listingId}/{timestamp}_{uuid}_{filename}
 */
export const uploadListingImage = async (
  file: File,
  userId: string,
  listingId?: string
): Promise<{ publicUrl: string; path: string }> => {
  // Validate first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  // Sanitize file name
  const cleanExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const uniqueId = generateUUID().substring(0, 8);
  const folder = listingId ? `${userId}/${listingId}` : `${userId}/drafts`;
  const filePath = `${folder}/${timestamp}_${uniqueId}.${cleanExt}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    console.error('[storage] Upload error details:', error);
    if (error.message.includes('bucket') || error.message.includes('not found') || error.message.includes('violates row-level security')) {
      throw new Error(`Upload failed: Storage bucket or permission issue (${error.message}). Please ensure 'listing-images' bucket is created in Supabase.`);
    }
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Retrieve public URL
  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  if (!publicUrlData || !publicUrlData.publicUrl) {
    throw new Error('Failed to retrieve public URL for uploaded photo.');
  }

  return {
    publicUrl: publicUrlData.publicUrl,
    path: data.path,
  };
};

/**
 * Checks if a given URL belongs to our Supabase Storage listing-images bucket
 */
export const isListingStorageUrl = (url: string): boolean => {
  if (!url) return false;
  return url.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
};

/**
 * Extracts storage object path from public URL
 */
export const extractStoragePathFromUrl = (url: string): string | null => {
  if (!isListingStorageUrl(url)) return null;
  const parts = url.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`);
  return parts[1] ? decodeURIComponent(parts[1]) : null;
};

/**
 * Deletes an image file from Supabase Storage
 */
export const deleteListingImage = async (urlOrPath: string): Promise<boolean> => {
  if (!isSupabaseConfigured || !urlOrPath) return false;

  const path = urlOrPath.startsWith('http')
    ? extractStoragePathFromUrl(urlOrPath)
    : urlOrPath;

  if (!path) {
    // Not a storage URL (e.g. Unsplash preset), skip safe deletion
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) {
      console.warn('[storage] Delete warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[storage] Delete exception:', err);
    return false;
  }
};
