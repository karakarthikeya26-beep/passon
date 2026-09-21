-- PassOn Database Schema for PostgreSQL / Supabase
-- VNR VJIET Student-to-Student Resource & Knowledge Exchange

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    branch TEXT NOT NULL,
    batch TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Academic', 'Books', 'Electronics', 'Project', 'Lab', 'Hostel', 'Furniture', 'Other')),
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair')),
    mode TEXT NOT NULL CHECK (mode IN ('Sell', 'Exchange', 'Donate', 'Hand Over')),
    price NUMERIC DEFAULT 0,
    exchange_preference TEXT,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'INTERESTED', 'RESERVED', 'HANDOVER_PLANNED', 'COMPLETED', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. LISTING IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.listing_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INTERESTS TABLE
CREATE TABLE IF NOT EXISTS public.interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. HANDOVERS TABLE
CREATE TABLE IF NOT EXISTS public.handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'COMPLETED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LOOKING FOR TABLE
CREATE TABLE IF NOT EXISTS public.looking_for (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Academic', 'Books', 'Electronics', 'Project', 'Lab', 'Hostel', 'Furniture', 'Other')),
    description TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('BUY', 'EXCHANGE', 'DONATE', 'ANY')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'MATCHED', 'CLOSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    request_id UUID NOT NULL REFERENCES public.looking_for(id) ON DELETE CASCADE,
    match_score INT NOT NULL,
    match_reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DISMISSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. KNOWLEDGE POSTS TABLE
CREATE TABLE IF NOT EXISTS public.knowledge_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Placement', 'Academics', 'Projects', 'Hackathons', 'Campus Life', 'Hostel', 'Clubs', 'Internships', 'General Advice')),
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    useful_count INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. SAVED LISTINGS TABLE
CREATE TABLE IF NOT EXISTS public.saved_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
);

-- 10. SAVED KNOWLEDGE TABLE
CREATE TABLE IF NOT EXISTS public.saved_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    knowledge_post_id UUID NOT NULL REFERENCES public.knowledge_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, knowledge_post_id)
);

-- 11. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exchange_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    from_user UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    to_user UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'user', 'knowledge')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('Inappropriate content', 'Misleading information', 'Spam', 'Suspicious activity', 'Other')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'DISMISSED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interest_id TEXT NOT NULL,
    listing_id TEXT,
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. GRANT PRIVILEGES TO anon AND authenticated ROLES
-- Revoke blanket write privileges from anon role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Anonymous users may only SELECT from public marketplace tables
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.listing_images TO anon;
GRANT SELECT ON public.knowledge_posts TO anon;
GRANT SELECT ON public.looking_for TO anon;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.feedback TO anon;

-- Authenticated students receive standard operations controlled by RLS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.looking_for ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 1. Users policies
CREATE POLICY "Public user profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON public.users FOR DELETE TO authenticated USING (auth.uid() = id);

-- 2. Listings policies
CREATE POLICY "Public listings are readable by everyone" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Users can create listings" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update their own listings" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their own listings" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- 3. Listing images policies
CREATE POLICY "Listing images are readable by everyone" ON public.listing_images FOR SELECT USING (true);
CREATE POLICY "Users can insert listing images" ON public.listing_images FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = listing_images.listing_id
          AND listings.owner_id = auth.uid()
    )
);
CREATE POLICY "Owners can update listing images" ON public.listing_images FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = listing_images.listing_id
          AND listings.owner_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = listing_images.listing_id
          AND listings.owner_id = auth.uid()
    )
);
CREATE POLICY "Owners can delete listing images" ON public.listing_images FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = listing_images.listing_id
          AND listings.owner_id = auth.uid()
    )
);

-- 4. Interests policies
CREATE POLICY "Interests are viewable by participants" ON public.interests FOR SELECT TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = interests.listing_id
          AND listings.owner_id = auth.uid()
    )
);
CREATE POLICY "Users can express interest" ON public.interests FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Owners and students can update interest status" ON public.interests FOR UPDATE TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = interests.listing_id
          AND listings.owner_id = auth.uid()
    )
) WITH CHECK (
    auth.uid() = student_id
    OR EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = interests.listing_id
          AND listings.owner_id = auth.uid()
    )
);
CREATE POLICY "Participants can delete interest" ON public.interests FOR DELETE TO authenticated USING (
    auth.uid() = student_id
    OR EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = interests.listing_id
          AND listings.owner_id = auth.uid()
    )
);

-- 5. Handovers policies
CREATE POLICY "Handovers are viewable by participants" ON public.handovers FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = handovers.listing_id
          AND listings.owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.interests
        WHERE interests.id = handovers.interest_id
          AND interests.student_id = auth.uid()
    )
);
CREATE POLICY "Owners can plan and complete handovers" ON public.handovers FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = handovers.listing_id
          AND listings.owner_id = auth.uid()
    )
);
CREATE POLICY "Owners can update handovers" ON public.handovers FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = handovers.listing_id
          AND listings.owner_id = auth.uid()
        )
    OR EXISTS (
        SELECT 1 FROM public.interests
        WHERE interests.id = handovers.interest_id
          AND interests.student_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = handovers.listing_id
          AND listings.owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.interests
        WHERE interests.id = handovers.interest_id
          AND interests.student_id = auth.uid()
    )
);
CREATE POLICY "Owners can delete handovers" ON public.handovers FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = handovers.listing_id
          AND listings.owner_id = auth.uid()
    )
);

-- 6. Looking for requests policies
CREATE POLICY "Public looking_for requests are readable" ON public.looking_for FOR SELECT USING (true);
CREATE POLICY "Users can create requests" ON public.looking_for FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Users can update their own requests" ON public.looking_for FOR UPDATE TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Users can delete their own requests" ON public.looking_for FOR DELETE TO authenticated USING (auth.uid() = student_id);

-- 7. Knowledge posts policies
CREATE POLICY "Public knowledge posts are readable" ON public.knowledge_posts FOR SELECT USING (status = 'PUBLISHED' OR auth.uid() = author_id);
CREATE POLICY "Users can create knowledge posts" ON public.knowledge_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own knowledge posts" ON public.knowledge_posts FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete their own knowledge posts" ON public.knowledge_posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- 8. Messages policies
CREATE POLICY "Users can view messages they sent or received" ON public.messages FOR SELECT TO authenticated USING (
    auth.uid()::text = sender_id OR auth.uid()::text = recipient_id
);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
    auth.uid()::text = sender_id
);
CREATE POLICY "Users can update messages" ON public.messages FOR UPDATE TO authenticated USING (
    auth.uid()::text = recipient_id OR auth.uid()::text = sender_id
) WITH CHECK (
    auth.uid()::text = recipient_id OR auth.uid()::text = sender_id
);
CREATE POLICY "Users can delete messages" ON public.messages FOR DELETE TO authenticated USING (
    auth.uid()::text = sender_id
);

-- 9. Saved listings policies
CREATE POLICY "Users can view their own saved listings" ON public.saved_listings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save listings" ON public.saved_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved listings" ON public.saved_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own saved listings" ON public.saved_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. Saved knowledge policies
CREATE POLICY "Users can view their own saved knowledge" ON public.saved_knowledge FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can save knowledge posts" ON public.saved_knowledge FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own saved knowledge" ON public.saved_knowledge FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own saved knowledge" ON public.saved_knowledge FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 11. Feedback policies
CREATE POLICY "Feedback is viewable by everyone" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Users can submit feedback for exchanges" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user);
CREATE POLICY "Users can update their own feedback" ON public.feedback FOR UPDATE TO authenticated USING (auth.uid() = from_user) WITH CHECK (auth.uid() = from_user);
CREATE POLICY "Users can delete their own feedback" ON public.feedback FOR DELETE TO authenticated USING (auth.uid() = from_user);

-- 12. Matches policies
CREATE POLICY "Matches are viewable by participants" ON public.matches FOR SELECT TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = matches.listing_id
          AND listings.owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.looking_for
        WHERE looking_for.id = matches.request_id
          AND looking_for.student_id = auth.uid()
    )
);
CREATE POLICY "Matches can be inserted by participants" ON public.matches FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = matches.listing_id
          AND listings.owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.looking_for
        WHERE looking_for.id = matches.request_id
          AND looking_for.student_id = auth.uid()
    )
);
CREATE POLICY "Matches can be updated by participants" ON public.matches FOR UPDATE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = matches.listing_id
          AND listings.owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.looking_for
        WHERE looking_for.id = matches.request_id
          AND looking_for.student_id = auth.uid()
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = matches.listing_id
          AND listings.owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.looking_for
        WHERE looking_for.id = matches.request_id
          AND looking_for.student_id = auth.uid()
    )
);
CREATE POLICY "Matches can be deleted by participants" ON public.matches FOR DELETE TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.listings
        WHERE listings.id = matches.listing_id
          AND listings.owner_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.looking_for
        WHERE looking_for.id = matches.request_id
          AND looking_for.student_id = auth.uid()
    )
);

-- 13. Reports policies
CREATE POLICY "Reporters can view their own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Users can submit reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporters can update their own reports" ON public.reports FOR UPDATE TO authenticated USING (auth.uid() = reporter_id) WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Reporters can delete their own reports" ON public.reports FOR DELETE TO authenticated USING (auth.uid() = reporter_id);

-- 14. Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 15. Profile sync trigger from auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.users (id, name, email, branch, batch, avatar_url, bio, role)
    VALUES (
        NEW.id,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'branch'), ''), 'Computer Science & Engineering'),
        COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'batch'), ''), '2nd Year (2024-2028)'),
        NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
        COALESCE(NEW.raw_user_meta_data->>'bio', ''),
        'student' -- ALWAYS 'student', never taken from raw_user_meta_data
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(NULLIF(TRIM(EXCLUDED.name), ''), public.users.name),
        role = public.users.role; -- NEVER privilege-escalate role on conflict
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- REALTIME PUBLICATION SETUP
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'listings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.listings;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'interests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.interests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

ALTER TABLE public.listings REPLICA IDENTITY FULL;
ALTER TABLE public.interests REPLICA IDENTITY FULL;

-- ==========================================================
-- SUPABASE STORAGE: listing-images BUCKET & RLS POLICIES
-- ==========================================================

-- 1. Create or update the 'listing-images' storage bucket (Public, 5MB limit, allowed image MIME types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'listing-images',
    'listing-images',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Grant basic privileges so roles can evaluate RLS
GRANT ALL ON storage.buckets TO postgres, service_role, authenticated;
GRANT SELECT ON storage.buckets TO anon;
GRANT ALL ON storage.objects TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;

-- Clean up any existing policies on listing-images to avoid conflicts
DROP POLICY IF EXISTS "Public read access to listing images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Listing Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload listing images to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their listing images" ON storage.objects;

-- SELECT Policy: Anyone (authenticated students and public users) can view listing images
CREATE POLICY "Public read access to listing images"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'listing-images'
);

-- INSERT Policy: Authenticated users can upload strictly to their own user folder:
-- Path format: {user_id}/{listing_id}/{filename} -> (storage.foldername(name))[1] = auth.uid()::text
CREATE POLICY "Authenticated users can upload listing images to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE Policy: Authenticated owners can update files strictly within their own user folder
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

-- DELETE Policy: Authenticated owners can delete files strictly within their own user folder
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);


