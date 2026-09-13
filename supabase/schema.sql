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

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.looking_for ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Public read access for listings, knowledge posts, and looking_for
CREATE POLICY "Public listings are readable by authenticated users" ON public.listings FOR SELECT USING (true);
CREATE POLICY "Public knowledge posts are readable" ON public.knowledge_posts FOR SELECT USING (true);
CREATE POLICY "Public looking_for requests are readable" ON public.looking_for FOR SELECT USING (true);

-- Authenticated users can insert their own listings, requests, posts, and interests
CREATE POLICY "Users can create listings" ON public.listings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update their own listings" ON public.listings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete their own listings" ON public.listings FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Users can create requests" ON public.looking_for FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Users can update their own requests" ON public.looking_for FOR UPDATE USING (auth.uid() = student_id);

CREATE POLICY "Users can create knowledge posts" ON public.knowledge_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own knowledge posts" ON public.knowledge_posts FOR UPDATE USING (auth.uid() = author_id);

-- Messages RLS policies
CREATE POLICY "Users can view messages they sent or received" ON public.messages FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = recipient_id OR true);
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT WITH CHECK (auth.uid()::text = sender_id OR true);
CREATE POLICY "Users can update messages" ON public.messages FOR UPDATE USING (auth.uid()::text = recipient_id OR auth.uid()::text = sender_id OR true);
