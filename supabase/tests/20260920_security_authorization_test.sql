-- ====================================================================
-- PASSON SECURITY AUTHORIZATION TEST SUITE (PHASE 1 - COMPREHENSIVE)
-- Purpose:
-- Formally verifies RLS policies and table privilege grants against
-- unauthorized access, spoofing, and privilege escalation.
--
-- TESTS COVERED:
-- TEST A: User A cannot read User B's private saved data
-- TEST B: User A cannot update User B's listing
-- TEST C: User A cannot delete User B's listing
-- TEST D: User A cannot create a listing using User B's owner_id
-- TEST E: User A cannot send a message pretending to be User B
-- TEST F: User A cannot read User B's private messages
-- TEST G: User A cannot create a notification belonging to User B
-- TEST H: Anonymous user cannot INSERT into protected tables
-- TEST I: Anonymous user cannot UPDATE protected tables
-- TEST J: Anonymous user cannot DELETE protected tables
--
-- SAFETY GUARANTEE:
-- This script runs entirely within a single TRANSACTION that terminates in ROLLBACK.
-- Zero production data is created, altered, or deleted permanently.
-- ====================================================================

BEGIN;

DO $$
DECLARE
    v_user_a UUID := '00000000-0000-0000-0000-00000000000a'::uuid;
    v_user_b UUID := '00000000-0000-0000-0000-00000000000b'::uuid;
    v_user_c UUID := '00000000-0000-0000-0000-00000000000c'::uuid;
    v_listing_b UUID := '00000000-0000-0000-0000-00000000001b'::uuid;
    v_msg_bc UUID := '00000000-0000-0000-0000-00000000002b'::uuid;
    v_saved_b UUID := '00000000-0000-0000-0000-00000000003b'::uuid;
    v_notif_b UUID := '00000000-0000-0000-0000-00000000004b'::uuid;

    v_rows INT;
    v_count INT;
    v_passed INT := 0;
    v_failed INT := 0;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'STARTING PASSON SECURITY AUTHORIZATION VERIFICATION';
    RAISE NOTICE '=======================================================';

    -- ----------------------------------------------------------------
    -- SETUP TEST FIXTURES (Runs as postgres / superuser)
    -- ----------------------------------------------------------------
    INSERT INTO public.users (id, name, email, branch, batch, role)
    VALUES 
        (v_user_a, 'Student User A', 'usera@vnrvjiet.in', 'CSE', '2024-2028', 'student'),
        (v_user_b, 'Student User B', 'userb@vnrvjiet.in', 'ECE', '2024-2028', 'student'),
        (v_user_c, 'Student User C', 'userc@vnrvjiet.in', 'IT', '2024-2028', 'student')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.listings (id, owner_id, title, category, condition, mode, price, description)
    VALUES (v_listing_b, v_user_b, 'User B Mechanics Textbook', 'Books', 'Good', 'Donate', 0, 'Original listing by User B')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.saved_listings (id, user_id, listing_id)
    VALUES (v_saved_b, v_user_b, v_listing_b)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.messages (id, interest_id, sender_id, recipient_id, content)
    VALUES (v_msg_bc, 'interest-bc-123', v_user_b::text, v_user_c::text, 'Confidential communication')
    ON CONFLICT (id) DO NOTHING;

    -- ================================================================
    -- SECTION 1: AUTHENTICATED CROSS-USER AUTHORIZATION TESTS (USER A)
    -- ================================================================
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claim.sub', v_user_a::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

    -- TEST A: User A cannot read User B's private saved data
    SELECT COUNT(*) INTO v_count FROM public.saved_listings WHERE user_id = v_user_b;
    IF v_count = 0 THEN
        RAISE NOTICE '✅ [TEST A PASSED] User A cannot read User B private saved data (DENIED / Filtered to 0)';
        v_passed := v_passed + 1;
    ELSE
        RAISE WARNING '❌ [TEST A FAILED] User A read User B private saved data! Count: %', v_count;
        v_failed := v_failed + 1;
    END IF;

    -- TEST B: User A cannot update User B's listing
    UPDATE public.listings SET title = 'HACKED BY USER A' WHERE id = v_listing_b;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RAISE NOTICE '✅ [TEST B PASSED] User A cannot update User B listing (DENIED / 0 rows affected)';
        v_passed := v_passed + 1;
    ELSE
        RAISE WARNING '❌ [TEST B FAILED] User A updated User B listing! Rows: %', v_rows;
        v_failed := v_failed + 1;
    END IF;

    -- TEST C: User A cannot delete User B's listing
    DELETE FROM public.listings WHERE id = v_listing_b;
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    IF v_rows = 0 THEN
        RAISE NOTICE '✅ [TEST C PASSED] User A cannot delete User B listing (DENIED / 0 rows affected)';
        v_passed := v_passed + 1;
    ELSE
        RAISE WARNING '❌ [TEST C FAILED] User A deleted User B listing! Rows: %', v_rows;
        v_failed := v_failed + 1;
    END IF;

    -- TEST D: User A cannot create a listing using User B's owner_id
    BEGIN
        INSERT INTO public.listings (id, owner_id, title, category, condition, mode, price, description)
        VALUES ('00000000-0000-0000-0000-00000000004a'::uuid, v_user_b, 'Spoofed Listing', 'Lab', 'New', 'Sell', 100, 'Desc');
        RAISE WARNING '❌ [TEST D FAILED] User A created listing with User B owner_id!';
        v_failed := v_failed + 1;
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE '✅ [TEST D PASSED] User A cannot create listing with User B owner_id (DENIED with check_violation)';
        v_passed := v_passed + 1;
    END;

    -- TEST E: User A cannot send a message pretending to be User B
    BEGIN
        INSERT INTO public.messages (id, interest_id, sender_id, recipient_id, content)
        VALUES ('00000000-0000-0000-0000-00000000005a'::uuid, 'int-1', v_user_b::text, v_user_c::text, 'Forged sender');
        RAISE WARNING '❌ [TEST E FAILED] User A impersonated User B in messages table!';
        v_failed := v_failed + 1;
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE '✅ [TEST E PASSED] User A cannot send message pretending to be User B (DENIED with check_violation)';
        v_passed := v_passed + 1;
    END;

    -- TEST F: User A cannot read User B's private messages
    SELECT COUNT(*) INTO v_count FROM public.messages
    WHERE sender_id = v_user_b::text AND recipient_id = v_user_c::text;
    IF v_count = 0 THEN
        RAISE NOTICE '✅ [TEST F PASSED] User A cannot read private messages between B and C (DENIED / Filtered to 0)';
        v_passed := v_passed + 1;
    ELSE
        RAISE WARNING '❌ [TEST F FAILED] User A read private messages between B and C! Count: %', v_count;
        v_failed := v_failed + 1;
    END IF;

    -- TEST G: User A cannot create a notification belonging to User B
    BEGIN
        INSERT INTO public.notifications (id, user_id, type, message)
        VALUES (v_notif_b, v_user_b, 'SPAM_NOTIF', 'Injected notification into User B inbox');
        RAISE WARNING '❌ [TEST G FAILED] User A created a notification belonging to User B!';
        v_failed := v_failed + 1;
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE '✅ [TEST G PASSED] User A cannot create notification for User B (DENIED with check_violation)';
        v_passed := v_passed + 1;
    END;

    -- ================================================================
    -- SECTION 2: ANONYMOUS ROLE RESTRICTION TESTS (ANON)
    -- ================================================================
    PERFORM set_config('role', 'anon', true);
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('request.jwt.claim.role', 'anon', true);

    -- TEST H: Anonymous user cannot INSERT into protected tables (public.listings)
    BEGIN
        INSERT INTO public.listings (id, owner_id, title, category, condition, mode, price, description)
        VALUES ('00000000-0000-0000-0000-000000000099'::uuid, v_user_b, 'Anon Injected Item', 'Books', 'Fair', 'Donate', 0, 'Desc');
        RAISE WARNING '❌ [TEST H FAILED] Anonymous user successfully inserted into public.listings!';
        v_failed := v_failed + 1;
    EXCEPTION WHEN insufficient_privilege OR check_violation THEN
        RAISE NOTICE '✅ [TEST H PASSED] Anonymous user cannot INSERT into public.listings (DENIED by grant/RLS)';
        v_passed := v_passed + 1;
    END;

    -- TEST I: Anonymous user cannot UPDATE protected tables (public.listings)
    BEGIN
        UPDATE public.listings SET title = 'Anon Deface' WHERE id = v_listing_b;
        GET DIAGNOSTICS v_rows = ROW_COUNT;
        IF v_rows = 0 THEN
            RAISE NOTICE '✅ [TEST I PASSED] Anonymous user cannot UPDATE public.listings (DENIED / 0 rows affected)';
            v_passed := v_passed + 1;
        ELSE
            RAISE WARNING '❌ [TEST I FAILED] Anonymous user successfully updated public.listings!';
            v_failed := v_failed + 1;
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE '✅ [TEST I PASSED] Anonymous user cannot UPDATE public.listings (DENIED with insufficient_privilege)';
        v_passed := v_passed + 1;
    END;

    -- TEST J: Anonymous user cannot DELETE from protected tables (public.listings)
    BEGIN
        DELETE FROM public.listings WHERE id = v_listing_b;
        GET DIAGNOSTICS v_rows = ROW_COUNT;
        IF v_rows = 0 THEN
            RAISE NOTICE '✅ [TEST J PASSED] Anonymous user cannot DELETE from public.listings (DENIED / 0 rows affected)';
            v_passed := v_passed + 1;
        ELSE
            RAISE WARNING '❌ [TEST J FAILED] Anonymous user successfully deleted from public.listings!';
            v_failed := v_failed + 1;
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE '✅ [TEST J PASSED] Anonymous user cannot DELETE from public.listings (DENIED with insufficient_privilege)';
        v_passed := v_passed + 1;
    END;

    -- ----------------------------------------------------------------
    -- TEST RESULTS CONSOLIDATION
    -- ----------------------------------------------------------------
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'RESULTS: %/10 TESTS PASSED, % FAILED', v_passed, v_failed;
    RAISE NOTICE '=======================================================';

    IF v_failed > 0 THEN
        RAISE EXCEPTION 'Security test suite detected failures! Rolling back.';
    END IF;
END $$;

ROLLBACK;
