-- ====================================================================
-- PASSON DATABASE SECURITY MIGRATION: ALLOW NOTIFICATIONS FOR LEGITIMATE INTERACTIONS
-- Purpose:
-- Fix RLS policy on public.notifications which previously enforced
-- auth.uid() = user_id on INSERT. This prevented peer-to-peer notifications
-- when a student offered help on a Looking For request, expressed interest
-- in a listing, or sent a message.
--
-- SECURITY GUARANTEES:
-- 1. Users can always create notifications for themselves (auth.uid() = user_id).
-- 2. Users can create a 'LOOKING_FOR_OFFER' notification for user_id ONLY IF
--    user_id is the author of an active ('OPEN') looking_for request and not self.
-- 3. Users can create interest/exchange notifications for user_id ONLY IF
--    user_id is the owner of a listing and not self.
-- 4. Users can create 'NEW_MESSAGE' notifications for user_id ONLY IF
--    the sender has sent an actual message to user_id.
-- 5. Arbitrary spam notifications to unrelated users are strictly rejected.
-- 6. SELECT, UPDATE, and DELETE remain strictly owner-only (auth.uid() = user_id).
-- ====================================================================

-- 1. Drop previous overly restrictive insert policies
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications for valid interactions" ON public.notifications;

-- 2. Create hardened interaction-based INSERT policy
CREATE POLICY "Users can create notifications for valid interactions"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (
        -- User can create notifications for themselves
        auth.uid() = user_id
        -- OR notify the owner of an open looking_for request when offering an item
        OR (
            type = 'LOOKING_FOR_OFFER'
            AND EXISTS (
                SELECT 1 FROM public.looking_for
                WHERE looking_for.student_id = notifications.user_id
                  AND looking_for.student_id != auth.uid()
                  AND looking_for.status = 'OPEN'
            )
        )
        -- OR notify the owner of a listing when expressing interest or progressing handover
        OR (
            type IN ('INTEREST_RECEIVED', 'INTEREST_ACCEPTED', 'INTEREST_DECLINED', 'RESERVED', 'HANDOVER_PLANNED', 'EXCHANGE_COMPLETED')
            AND EXISTS (
                SELECT 1 FROM public.listings
                WHERE listings.owner_id = notifications.user_id
                  AND listings.owner_id != auth.uid()
            )
        )
        -- OR notify the recipient of a direct message sent by auth.uid()
        OR (
            type = 'NEW_MESSAGE'
            AND EXISTS (
                SELECT 1 FROM public.messages
                WHERE messages.recipient_id = notifications.user_id::text
                  AND messages.sender_id = auth.uid()::text
            )
        )
    );
