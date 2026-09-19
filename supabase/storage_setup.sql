-- ====================================================================
-- PASSON: SUPABASE STORAGE SETUP FOR PRODUCT / LISTING IMAGES
-- Bucket: listing-images
-- Path structure: {user_id}/{listing_id}/{filename}
-- ====================================================================

-- 1. Create the 'listing-images' bucket if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'listing-images',
    'listing-images',
    true,
    5242880, -- 5 MB max per file
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Enable Row Level Security on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Grant basic privileges to roles so RLS policies can evaluate
GRANT ALL ON storage.buckets TO postgres, service_role, authenticated;
GRANT SELECT ON storage.buckets TO anon;

GRANT ALL ON storage.objects TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- 4. Clean up any existing policies on listing-images to avoid conflicts
DROP POLICY IF EXISTS "Public read access to listing images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Listing Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload listing images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their listing images" ON storage.objects;

-- 5. SELECT Policy: Anyone (authenticated and public students) can view listing images
CREATE POLICY "Public read access to listing images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'listing-images'
);

-- 6. INSERT Policy: Authenticated users can upload strictly to their own user folder:
--    Path: {user_id}/{listing_id}/{filename} -> (storage.foldername(name))[1] = auth.uid()::text
CREATE POLICY "Authenticated users can upload listing images to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. UPDATE Policy: Authenticated owners can update files strictly within their own user folder
CREATE POLICY "Users can update their own listing images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 8. DELETE Policy: Authenticated owners can delete files strictly within their own user folder
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);
