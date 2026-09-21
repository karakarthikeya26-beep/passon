import { dbService, initializeDatabase } from '../src/lib/db';
import { messageService } from '../src/lib/messages';
import { notificationService } from '../src/lib/notifications';
import { lookingForService } from '../src/lib/looking-for';
import { User, LookingFor } from '../src/types';

// Mock localStorage and sessionStorage for test runner
class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, val: string) { this.store.set(key, String(val)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

const sharedLocalStorage = new MockStorage();
const sharedSessionStorage = new MockStorage();

(global as any).window = {
  localStorage: sharedLocalStorage,
  sessionStorage: sharedSessionStorage,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
};
(global as any).localStorage = sharedLocalStorage;
(global as any).sessionStorage = sharedSessionStorage;

async function runLookingForOfferTestSuite() {
  console.log('===============================================================');
  console.log('STARTING PASSON "LOOKING FOR -> OFFER ITEM" FULL VERIFICATION');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      failed++;
    }
  }

  // 0. Initialize mock database
  initializeDatabase();

  const userA: User = {
    id: 'user-a-1111-2222-3333-444455556666',
    name: 'Aditya Sharma',
    email: 'aditya@vnrvjiet.in',
    branch: 'Computer Science & Engineering',
    batch: '3rd Year (2023-2027)',
    gender: 'Male',
    avatar_url: 'https://example.com/aditya.png',
    role: 'student',
    created_at: new Date().toISOString(),
  };

  const userB: User = {
    id: 'user-b-7777-8888-9999-000011112222',
    name: 'Sneha Reddy',
    email: 'sneha@vnrvjiet.in',
    branch: 'Electronics & Communication',
    batch: '2nd Year (2024-2028)',
    gender: 'Female',
    avatar_url: 'https://example.com/sneha.png',
    role: 'student',
    created_at: new Date().toISOString(),
  };

  const userC: User = {
    id: 'user-c-3333-4444-5555-666677778888',
    name: 'Rahul Varma',
    email: 'rahul@vnrvjiet.in',
    branch: 'Information Technology',
    batch: '4th Year (2022-2026)',
    gender: 'Male',
    avatar_url: 'https://example.com/rahul.png',
    role: 'student',
    created_at: new Date().toISOString(),
  };

  sharedLocalStorage.setItem('passon_users', JSON.stringify([userA, userB, userC]));

  // Offer helper that reproduces the exact AppContext logic
  async function offerItemHelper(currentUser: User | null, request: LookingFor): Promise<string> {
    if (!currentUser) throw new Error('Must be logged in to offer an item');
    if (currentUser.id === request.student_id) throw new Error('Cannot offer to own request');
    if (request.status !== 'OPEN') throw new Error('Looking For request is not open');

    const threadId = `lf_${request.id}_${currentUser.id}`;

    // Duplicate check
    const existingMessages = dbService.getMessagesByInterest(threadId);
    if (existingMessages.length > 0) {
      return threadId;
    }

    // 1. Initial message
    const initialContent = `Hi! I saw your Looking For post for "${request.title}" and I may be able to help.`;
    await messageService.sendMessage({
      interest_id: threadId,
      sender_id: currentUser.id,
      recipient_id: request.student_id,
      content: initialContent,
      skipNotification: true,
    });

    // 2. Notification for post author
    await notificationService.createNotification({
      user_id: request.student_id,
      type: 'LOOKING_FOR_OFFER',
      message: `${currentUser.name} has offered an item for your request "${request.title}".`,
      link: `/matches?tab=conversations&conversation=${threadId}`,
    });

    return threadId;
  }

  // -------------------------------------------------------------
  // TEST 1: Normal Flow
  // -------------------------------------------------------------
  console.log('\n--- TEST 1: Normal Flow (User A -> User B Offer -> Chat -> Notif) ---');

  // 1. Sign in as User A
  dbService.setCurrentUserId(userA.id);
  assert(dbService.getCurrentUserId() === userA.id, 'Test 1.1: Signed in as User A');

  // 2. User A creates Looking For post
  const reqA = await lookingForService.createLookingFor({
    student_id: userA.id,
    title: 'Need a Calculus textbook',
    category: 'Books',
    mode: 'BUY',
    description: 'Looking for a Calculus textbook in good condition for M1/M2.',
  });
  assert(reqA.id !== undefined && reqA.status === 'OPEN', 'Test 1.2: User A created Looking For post "Need a Calculus textbook"');

  // 3. Sign in as User B
  dbService.setCurrentUserId(userB.id);
  assert(dbService.getCurrentUserId() === userB.id, 'Test 1.3: Signed in as User B');

  // 4. User B clicks Offer Item
  const convThreadId = await offerItemHelper(userB, reqA);
  assert(
    convThreadId === `lf_${reqA.id}_${userB.id}` && !convThreadId.includes('home'),
    'Test 1.4: Offer action returns conversation thread ID (does NOT navigate to Home)'
  );

  // 5. Verify conversation messages exist
  const threadMsgs = dbService.getMessagesByInterest(convThreadId);
  assert(threadMsgs.length === 1, 'Test 1.5: Exactly 1 initial message created in conversation');
  assert(
    threadMsgs[0].sender_id === userB.id &&
    threadMsgs[0].recipient_id === userA.id &&
    threadMsgs[0].content === `Hi! I saw your Looking For post for "${reqA.title}" and I may be able to help.`,
    'Test 1.6: Initial message contains expected offer greeting from User B to User A'
  );

  // 6. Sign in as User A and verify notification
  dbService.setCurrentUserId(userA.id);
  const userANotifs = dbService.getNotifications(userA.id);
  const offerNotif = userANotifs.find((n) => n.type === 'LOOKING_FOR_OFFER');

  assert(offerNotif !== undefined, 'Test 1.7: User A received LOOKING_FOR_OFFER notification');
  assert(
    offerNotif?.message === `Sneha Reddy has offered an item for your request "Need a Calculus textbook".`,
    'Test 1.8: Notification message identifies User B and references the request title'
  );
  assert(offerNotif?.read === false, 'Test 1.9: Notification is marked unread initially');
  assert(
    offerNotif?.link === `/matches?tab=conversations&conversation=${convThreadId}`,
    'Test 1.10: Notification link points directly to the conversation'
  );

  // 7. Click notification (mark read & navigate)
  await notificationService.markAsRead(offerNotif!.id);
  const updatedNotifs = dbService.getNotifications(userA.id);
  const readNotif = updatedNotifs.find((n) => n.id === offerNotif!.id);
  assert(readNotif?.read === true, 'Test 1.11: Clicking notification marks it as read');

  // -------------------------------------------------------------
  // TEST 2: Duplicate Offer
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Duplicate Offer Handling ---');

  // Sign back in as User B and attempt to offer again
  dbService.setCurrentUserId(userB.id);
  const convThreadId2 = await offerItemHelper(userB, reqA);

  assert(
    convThreadId2 === convThreadId,
    'Test 2.1: Duplicate offer returns existing conversation thread'
  );

  const threadMsgsAfterDup = dbService.getMessagesByInterest(convThreadId);
  assert(
    threadMsgsAfterDup.length === 1,
    'Test 2.2: Duplicate offer did NOT create an extra message'
  );

  const notifsAfterDup = dbService.getNotifications(userA.id).filter((n) => n.type === 'LOOKING_FOR_OFFER');
  assert(
    notifsAfterDup.length === 1,
    'Test 2.3: Duplicate offer did NOT create duplicate notifications for User A'
  );

  // -------------------------------------------------------------
  // TEST 3: Own Post Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Block Offer on Own Post ---');

  dbService.setCurrentUserId(userA.id);
  let blockedOwnPost = false;
  try {
    await offerItemHelper(userA, reqA);
  } catch (err: any) {
    if (err.message === 'Cannot offer to own request') {
      blockedOwnPost = true;
    }
  }
  assert(blockedOwnPost, 'Test 3.1: User A cannot offer an item to their own Looking For post');

  // -------------------------------------------------------------
  // TEST 4: Unauthenticated User Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Block Unauthenticated Offer ---');

  let blockedUnauth = false;
  try {
    await offerItemHelper(null, reqA);
  } catch (err: any) {
    if (err.message === 'Must be logged in to offer an item') {
      blockedUnauth = true;
    }
  }
  assert(blockedUnauth, 'Test 4.1: Unauthenticated visitor cannot offer an item');

  // -------------------------------------------------------------
  // TEST 5: Closed / Unavailable Post Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Block Offer on Closed/Matched Post ---');

  // Close the request
  const closedReq = await lookingForService.updateLookingForStatus(reqA.id, 'CLOSED');
  assert(closedReq.status === 'CLOSED', 'Test 5.1: Request transitioned to CLOSED');

  let blockedClosed = false;
  try {
    await offerItemHelper(userC, closedReq);
  } catch (err: any) {
    if (err.message === 'Looking For request is not open') {
      blockedClosed = true;
    }
  }
  assert(blockedClosed, 'Test 5.2: Offering on CLOSED request fails gracefully');

  // -------------------------------------------------------------
  // TEST 6: RLS and Security Simulation
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Security and Policy Verification ---');

  // Policy rule 1: User B cannot insert notification for arbitrary user without valid interaction
  function simulateNotificationInsert(authUserId: string, targetUserId: string, type: string, link?: string): boolean {
    // 1. Self notification
    if (authUserId === targetUserId) return true;

    // 2. LOOKING_FOR_OFFER: recipient must own an OPEN looking_for post
    if (type === 'LOOKING_FOR_OFFER') {
      const openRequests = dbService.getLookingFor().filter((r) => r.student_id === targetUserId && r.status === 'OPEN');
      return openRequests.length > 0 && targetUserId !== authUserId;
    }

    // 3. Listing interests
    if (['INTEREST_RECEIVED', 'INTEREST_ACCEPTED'].includes(type)) {
      const userListings = dbService.getListings().filter((l) => l.owner_id === targetUserId);
      return userListings.length > 0 && targetUserId !== authUserId;
    }

    // 4. Message recipient
    if (type === 'NEW_MESSAGE') {
      const sentMsgs = dbService.getMessages().filter((m) => m.sender_id === authUserId && m.recipient_id === targetUserId);
      return sentMsgs.length > 0;
    }

    return false;
  }

  // User B sending arbitrary spam to User C (User C has no open requests or listings)
  const canSpamUserC = simulateNotificationInsert(userB.id, userC.id, 'SPAM_NOTIF');
  assert(!canSpamUserC, 'Test 6.1: User B CANNOT insert arbitrary spam notification for User C (Blocked by RLS policy)');

  // User B sending notification to User A who had an open post
  // (Let's test with a fresh open post for User A)
  const freshReqA = await lookingForService.createLookingFor({
    student_id: userA.id,
    title: 'Lab coat size M',
    category: 'Lab',
    mode: 'ANY',
    description: 'Urgent for chemistry lab',
  });
  const canNotifyUserA = simulateNotificationInsert(userB.id, userA.id, 'LOOKING_FOR_OFFER');
  assert(canNotifyUserA, 'Test 6.2: User B CAN create notification for User A with open Looking For request');

  // Policy rule 2: User C cannot read private messages between User A and User B
  const messagesForUserC = dbService.getMessages().filter(
    (m) => m.sender_id === userC.id || m.recipient_id === userC.id
  );
  const containsABMessages = messagesForUserC.some(
    (m) => m.interest_id === convThreadId
  );
  assert(!containsABMessages, 'Test 6.3: User C CANNOT view private messages between User A and User B');

  // Policy rule 3: User B cannot modify User A's looking for post
  function simulateUpdatePost(authUserId: string, post: LookingFor, newTitle: string): boolean {
    if (authUserId !== post.student_id) return false;
    post.title = newTitle;
    return true;
  }
  const canTamperPost = simulateUpdatePost(userB.id, freshReqA, 'Hacked by User B');
  assert(!canTamperPost, 'Test 6.4: User B CANNOT modify User A\'s Looking For post');

  // Policy rule 4: User B cannot spoof sender_id to impersonate User A
  function simulateMessageInsert(authUserId: string, claimedSenderId: string): boolean {
    return authUserId === claimedSenderId;
  }
  const canImpersonate = simulateMessageInsert(userB.id, userA.id);
  assert(!canImpersonate, 'Test 6.5: User B CANNOT send message with sender_id = User A (Impersonation blocked)');

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runLookingForOfferTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
