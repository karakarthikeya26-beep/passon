-- ====================================================================
-- PASSON DATABASE SECURITY REMEDIATION MIGRATION (PHASE 1 - REVISED)
-- Description:
-- 1. Strips all unconditional authorization bypasses (OR true, WITH CHECK (true), etc.)
-- 2. Enforces strict auth.uid() ownership across all user-owned tables
-- 3. Enables RLS on previously unprotected tables (saved_listings, saved_knowledge, feedback, matches)
-- 4. Restricts public.messages so students can only read, send, and update their own messages
-- 5. Restricts public.notifications to strict self-ownership (auth.uid() = user_id)
-- 6. Revokes dangerous blanket write grants from the anon role
-- 7. Adds hardened profile sync trigger from auth.users -> public.users
--    (forces role = 'student', fixed search_path = public, pg_temp)
-- ====================================================================

-- --------------------------------------------------------------------
-- STEP 1: REVOKE BLANKET ANONYMOUS PERMISSIONS & RESTRICT GRANTS
-- --------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Anonymous visitors may only SELECT from public marketplace tables
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.listing_images TO anon;
GRANT SELECT ON public.knowledge_posts TO anon;
GRANT SELECT ON public.looking_for TO anon;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.feedback TO anon;

-- Authenticated students receive standard operations governed by RLS
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- --------------------------------------------------------------------
-- STEP 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- STEP 3: DROP INSECURE & EXISTING POLICIES
-- --------------------------------------------------------------------
-- users
DROP POLICY IF EXISTS "Public user profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;

-- listings
DROP POLICY IF EXISTS "Public listings are readable by everyone" ON public.listings;
DROP POLICY IF EXISTS "Users can create listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can update their own listings" ON public.listings;
DROP POLICY IF EXISTS "Owners can delete their own listings" ON public.listings;

-- listing_images
DROP POLICY IF EXISTS "Listing images are readable by everyone" ON public.listing_images;
DROP POLICY IF EXISTS "Users can insert listing images" ON public.listing_images;
DROP POLICY IF EXISTS "Owners can update listing images" ON public.listing_images;
DROP POLICY IF EXISTS "Owners can delete listing images" ON public.listing_images;

-- interests
DROP POLICY IF EXISTS "Interests are viewable by participants" ON public.interests;
DROP POLICY IF EXISTS "Users can express interest" ON public.interests;
DROP POLICY IF EXISTS "Owners and students can update interest status" ON public.interests;
DROP POLICY IF EXISTS "Participants can delete interest" ON public.interests;

-- handovers
DROP POLICY IF EXISTS "Handovers are viewable by participants" ON public.handovers;
DROP POLICY IF EXISTS "Owners can plan and complete handovers" ON public.handovers;
DROP POLICY IF EXISTS "Owners can update handovers" ON public.handovers;
DROP POLICY IF EXISTS "Owners can delete handovers" ON public.handovers;

-- looking_for
DROP POLICY IF EXISTS "Public looking_for requests are readable" ON public.looking_for;
DROP POLICY IF EXISTS "Users can create requests" ON public.looking_for;
DROP POLICY IF EXISTS "Users can update their own requests" ON public.looking_for;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.looking_for;

-- knowledge_posts
DROP POLICY IF EXISTS "Public knowledge posts are readable" ON public.knowledge_posts;
DROP POLICY IF EXISTS "Users can create knowledge posts" ON public.knowledge_posts;
DROP POLICY IF EXISTS "Users can update their own knowledge posts" ON public.knowledge_posts;
DROP POLICY IF EXISTS "Users can delete their own knowledge posts" ON public.knowledge_posts;

-- messages
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete messages" ON public.messages;

-- saved_listings
DROP POLICY IF EXISTS "Users can view their own saved listings" ON public.saved_listings;
DROP POLICY IF EXISTS "Users can save listings" ON public.saved_listings;
DROP POLICY IF EXISTS "Users can update their own saved listings" ON public.saved_listings;
DROP POLICY IF EXISTS "Users can remove their own saved listings" ON public.saved_listings;

-- saved_knowledge
DROP POLICY IF EXISTS "Users can view their own saved knowledge" ON public.saved_knowledge;
DROP POLICY IF EXISTS "Users can save knowledge posts" ON public.saved_knowledge;
DROP POLICY IF EXISTS "Users can update their own saved knowledge" ON public.saved_knowledge;
DROP POLICY IF EXISTS "Users can remove their own saved knowledge" ON public.saved_knowledge;

-- feedback
DROP POLICY IF EXISTS "Feedback is viewable by everyone" ON public.feedback;
DROP POLICY IF EXISTS "Users can submit feedback for exchanges" ON public.feedback;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Users can delete their own feedback" ON public.feedback;

-- matches
DROP POLICY IF EXISTS "Matches are viewable by participants" ON public.matches;
DROP POLICY IF EXISTS "Matches can be inserted by participants" ON public.matches;
DROP POLICY IF EXISTS "Matches can be updated by participants" ON public.matches;
DROP POLICY IF EXISTS "Matches can be deleted by participants" ON public.matches;

-- reports
DROP POLICY IF EXISTS "Reporters can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can submit reports" ON public.reports;
DROP POLICY IF EXISTS "Reporters can update their own reports" ON public.reports;
DROP POLICY IF EXISTS "Reporters can delete their own reports" ON public.reports;

-- notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- --------------------------------------------------------------------
-- STEP 4: CREATE RIGOROUS, SECURE ROW LEVEL SECURITY POLICIES
-- --------------------------------------------------------------------

-- 1. USERS TABLE POLICIES
-- Public profiles: names, branch, batch, bio, avatar for marketplace browsing
CREATE POLICY "Public user profiles are viewable by everyone"
    ON public.users FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
    ON public.users FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- 2. LISTINGS TABLE POLICIES
CREATE POLICY "Public listings are readable by everyone"
    ON public.listings FOR SELECT
    USING (true);

CREATE POLICY "Users can create listings"
    ON public.listings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own listings"
    ON public.listings FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own listings"
    ON public.listings FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- 3. LISTING IMAGES POLICIES
CREATE POLICY "Listing images are readable by everyone"
    ON public.listing_images FOR SELECT
    USING (true);

CREATE POLICY "Users can insert listing images"
    ON public.listing_images FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = listing_images.listing_id
              AND listings.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update listing images"
    ON public.listing_images FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = listing_images.listing_id
              AND listings.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = listing_images.listing_id
              AND listings.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete listing images"
    ON public.listing_images FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = listing_images.listing_id
              AND listings.owner_id = auth.uid()
        )
    );

-- 4. INTERESTS POLICIES
CREATE POLICY "Interests are viewable by participants"
    ON public.interests FOR SELECT
    TO authenticated
    USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = interests.listing_id
              AND listings.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can express interest"
    ON public.interests FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Owners and students can update interest status"
    ON public.interests FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = interests.listing_id
              AND listings.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = interests.listing_id
              AND listings.owner_id = auth.uid()
        )
    );

CREATE POLICY "Participants can delete interest"
    ON public.interests FOR DELETE
    TO authenticated
    USING (
        auth.uid() = student_id
        OR EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = interests.listing_id
              AND listings.owner_id = auth.uid()
        )
    );

-- 5. HANDOVERS POLICIES
CREATE POLICY "Handovers are viewable by participants"
    ON public.handovers FOR SELECT
    TO authenticated
    USING (
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

CREATE POLICY "Owners can plan and complete handovers"
    ON public.handovers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = handovers.listing_id
              AND listings.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update handovers"
    ON public.handovers FOR UPDATE
    TO authenticated
    USING (
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
    )
    WITH CHECK (
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

CREATE POLICY "Owners can delete handovers"
    ON public.handovers FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.listings
            WHERE listings.id = handovers.listing_id
              AND listings.owner_id = auth.uid()
        )
    );

-- 6. LOOKING FOR REQUESTS POLICIES
CREATE POLICY "Public looking_for requests are readable"
    ON public.looking_for FOR SELECT
    USING (true);

CREATE POLICY "Users can create requests"
    ON public.looking_for FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own requests"
    ON public.looking_for FOR UPDATE
    TO authenticated
    USING (auth.uid() = student_id)
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can delete their own requests"
    ON public.looking_for FOR DELETE
    TO authenticated
    USING (auth.uid() = student_id);

-- 7. KNOWLEDGE POSTS POLICIES
CREATE POLICY "Public knowledge posts are readable"
    ON public.knowledge_posts FOR SELECT
    USING (status = 'PUBLISHED' OR auth.uid() = author_id);

CREATE POLICY "Users can create knowledge posts"
    ON public.knowledge_posts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own knowledge posts"
    ON public.knowledge_posts FOR UPDATE
    TO authenticated
    USING (auth.uid() = author_id)
    WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own knowledge posts"
    ON public.knowledge_posts FOR DELETE
    TO authenticated
    USING (auth.uid() = author_id);

-- 8. MESSAGES POLICIES (sender_id and recipient_id are stored as TEXT)
CREATE POLICY "Users can view messages they sent or received"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        auth.uid()::text = sender_id
        OR auth.uid()::text = recipient_id
    );

CREATE POLICY "Users can insert messages"
    ON public.messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid()::text = sender_id
    );

CREATE POLICY "Users can update messages"
    ON public.messages FOR UPDATE
    TO authenticated
    USING (
        auth.uid()::text = recipient_id
        OR auth.uid()::text = sender_id
    )
    WITH CHECK (
        auth.uid()::text = recipient_id
        OR auth.uid()::text = sender_id
    );

CREATE POLICY "Users can delete messages"
    ON public.messages FOR DELETE
    TO authenticated
    USING (
        auth.uid()::text = sender_id
    );

-- 9. SAVED LISTINGS POLICIES
CREATE POLICY "Users can view their own saved listings"
    ON public.saved_listings FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings"
    ON public.saved_listings FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved listings"
    ON public.saved_listings FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own saved listings"
    ON public.saved_listings FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 10. SAVED KNOWLEDGE POLICIES
CREATE POLICY "Users can view their own saved knowledge"
    ON public.saved_knowledge FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save knowledge posts"
    ON public.saved_knowledge FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved knowledge"
    ON public.saved_knowledge FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own saved knowledge"
    ON public.saved_knowledge FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 11. FEEDBACK POLICIES
CREATE POLICY "Feedback is viewable by everyone"
    ON public.feedback FOR SELECT
    USING (true);

CREATE POLICY "Users can submit feedback for exchanges"
    ON public.feedback FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can update their own feedback"
    ON public.feedback FOR UPDATE
    TO authenticated
    USING (auth.uid() = from_user)
    WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can delete their own feedback"
    ON public.feedback FOR DELETE
    TO authenticated
    USING (auth.uid() = from_user);

-- 12. MATCHES POLICIES
CREATE POLICY "Matches are viewable by participants"
    ON public.matches FOR SELECT
    TO authenticated
    USING (
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

CREATE POLICY "Matches can be inserted by participants"
    ON public.matches FOR INSERT
    TO authenticated
    WITH CHECK (
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

CREATE POLICY "Matches can be updated by participants"
    ON public.matches FOR UPDATE
    TO authenticated
    USING (
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
    )
    WITH CHECK (
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

CREATE POLICY "Matches can be deleted by participants"
    ON public.matches FOR DELETE
    TO authenticated
    USING (
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

-- 13. REPORTS POLICIES
-- Strictly restricted to the submitting reporter; admin view deferred to Phase 2
CREATE POLICY "Reporters can view their own reports"
    ON public.reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id);

CREATE POLICY "Users can submit reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can update their own reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (auth.uid() = reporter_id)
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can delete their own reports"
    ON public.reports FOR DELETE
    TO authenticated
    USING (auth.uid() = reporter_id);

-- 14. NOTIFICATIONS POLICIES
-- Strictly owner-only: users can only view, insert, update, or delete their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notifications"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- --------------------------------------------------------------------
-- STEP 5: HARDENED PROFILE CREATION TRIGGER & EXISTING DATA BACKFILL
-- --------------------------------------------------------------------
-- Security properties:
-- 1. Uses safe, fixed search_path = public, pg_temp
-- 2. Ignores any attempt in raw_user_meta_data to set role = 'admin'
-- 3. Always forces role = 'student' on insert
-- 4. On conflict update, role remains unchanged (role = public.users.role)
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

-- Backfill any existing auth users into public.users with role 'student'
INSERT INTO public.users (id, name, email, branch, batch, avatar_url, bio, role)
SELECT 
    id,
    COALESCE(NULLIF(TRIM(raw_user_meta_data->>'name'), ''), split_part(email, '@', 1)),
    email,
    COALESCE(NULLIF(TRIM(raw_user_meta_data->>'branch'), ''), 'Computer Science & Engineering'),
    COALESCE(NULLIF(TRIM(raw_user_meta_data->>'batch'), ''), '2nd Year (2024-2028)'),
    NULLIF(TRIM(raw_user_meta_data->>'avatar_url'), ''),
    COALESCE(raw_user_meta_data->>'bio', ''),
    'student'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
