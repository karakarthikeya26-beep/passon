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
 * Enforces path structure: {userId}/{listingId}/{timestamp}_{uuid}.{ext}
 * so that the first path segment strictly matches auth.uid() for Storage RLS policy enforcement.
 */
export const uploadListingImage = async (
  file: File,
  userId: string,
  listingId?: string
): Promise<{ publicUrl: string; path: string }> => {
  // 1. Validate file format and size limit (5MB)
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image file.');
  }

  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  // 2. Resolve authenticated user ID from Supabase Auth session if available
  let authenticatedUserId = userId;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) {
      authenticatedUserId = user.id;
    }
  } catch (err) {
    console.warn('[storage] Note retrieving session user:', err);
  }

  // 3. Ensure listing ID exists so path is strictly {userId}/{listingId}/{filename}
  const targetListingId = listingId || generateUUID();
  const cleanExt = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const uniqueId = generateUUID().substring(0, 8);

  // Secure path format: {userId}/{listingId}/{uniqueFileName}
  const filePath = `${authenticatedUserId}/${targetListingId}/${timestamp}_${uniqueId}.${cleanExt}`;

  // 4. Perform upload into 'listing-images' bucket
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    console.error('[storage] Supabase Storage upload error:', error);
    if (error.message.includes('row-level security') || (error as any).statusCode === '403') {
      throw new Error(
        `Storage permission denied (${error.message}). Please ensure the 'listing-images' bucket and RLS policies in 'supabase/storage_setup.sql' are applied in Supabase, and you are signed in.`
      );
    }
    if (error.message.includes('bucket') || error.message.includes('not found')) {
      throw new Error(
        `Storage bucket 'listing-images' not found. Please run the SQL in 'supabase/storage_setup.sql' in your Supabase SQL Editor to create the bucket.`
      );
    }
    throw new Error(`Upload failed: ${error.message}`);
  }

  // 5. Retrieve public accessible URL
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
