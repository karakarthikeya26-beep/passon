import { dbService, initializeDatabase } from '../src/lib/db';
import { listingService } from '../src/lib/listings';
import { User, Listing } from '../src/types';

// Mock browser environments for simulated tabs
class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, val: string) { this.store.set(key, String(val)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

// Global window mock with separate session storages
const sharedLocalStorage = new MockStorage();

function setupTab(tabName: string, sessionStorage: MockStorage) {
  const listeners: Record<string, Function[]> = {};
  (global as any).window = {
    localStorage: sharedLocalStorage,
    sessionStorage: sessionStorage,
    addEventListener: (event: string, fn: Function) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    },
    removeEventListener: (event: string, fn: Function) => {
      listeners[event] = (listeners[event] || []).filter(f => f !== fn);
    },
    dispatchEvent: (event: any) => {
      const type = event.type || event;
      (listeners[type] || []).forEach(fn => fn(event));
      return true;
    }
  };
  (global as any).localStorage = sharedLocalStorage;
  (global as any).sessionStorage = sessionStorage;
}

async function runTests() {
  console.log('========================================');
  console.log('RUNNING PASSON SYSTEM VERIFICATION TESTS');
  console.log('========================================\n');

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

  // Initial seed setup
  const tab1Session = new MockStorage();
  setupTab('Tab1', tab1Session);
  initializeDatabase();

  const userA: User = {
    id: 'user-a-1111-2222-3333-444455556666',
    name: 'Alice User A',
    email: 'alice@vnrvjiet.in',
    branch: 'CSE',
    batch: '2024-2028',
    gender: 'Female',
    avatar_url: 'https://example.com/alice.png',
    role: 'student',
    created_at: new Date().toISOString()
  };

  const userB: User = {
    id: 'user-b-7777-8888-9999-000011112222',
    name: 'Bob User B',
    email: 'bob@vnrvjiet.in',
    branch: 'ECE',
    batch: '2024-2028',
    gender: 'Male',
    avatar_url: 'https://example.com/bob.png',
    role: 'student',
    created_at: new Date().toISOString()
  };

  sharedLocalStorage.setItem('passon_users', JSON.stringify([userA, userB]));

  // ----------------------------------------------------
  // SCENARIO A: Logout must remain logged out
  // ----------------------------------------------------
  console.log('\n--- SCENARIO A: Logout ---');
  // 1. Login as User A
  dbService.setCurrentUserId(userA.id);
  assert(dbService.getCurrentUserId() === userA.id, 'Scenario A1: Logged in as User A');

  // 2. Logout
  dbService.setCurrentUserId('');
  assert(dbService.getCurrentUserId() === '', 'Scenario A2: Logged out (current user ID empty)');

  // 3. Refresh tab (re-read from tab1Session)
  assert(dbService.getCurrentUserId() === '', 'Scenario A3: Refresh tab keeps user logged out');

  // 4. Close/reopen tab (new tab session storage)
  const reopenedTabSession = new MockStorage();
  setupTab('ReopenedTab', reopenedTabSession);
  assert(dbService.getCurrentUserId() === '', 'Scenario A4: Fresh/reopened tab remains logged out');
  assert(sharedLocalStorage.getItem('passon_current_user_id') === null, 'Scenario A5: No auto-login key in localStorage');

  // ----------------------------------------------------
  // SCENARIO B: Listing persistence after logout/login
  // ----------------------------------------------------
  console.log('\n--- SCENARIO B: Listing Persistence ---');
  setupTab('Tab1', tab1Session);
  // 1. Login as User A
  dbService.setCurrentUserId(userA.id);
  // 2. Create listing
  const createdListing = await listingService.createListing({
    owner_id: userA.id,
    title: 'Engineering Mechanics Textbook (Persisted)',
    category: 'Books & Notes',
    condition: 'Like New',
    mode: 'DONATE',
    price: 0,
    description: 'First year textbook in great condition',
    images: ['https://example.com/book.jpg']
  });
  assert(Boolean(createdListing.id), 'Scenario B1: Created listing has ID', createdListing.id);

  // 3. Logout
  dbService.setCurrentUserId('');
  assert(dbService.getCurrentUserId() === '', 'Scenario B2: User logged out');

  // 4. Login again
  dbService.setCurrentUserId(userA.id);

  // 5. Fetch listings
  const listingsAfterLogin = await listingService.fetchListings();
  const foundListing = listingsAfterLogin.find(l => l.id === createdListing.id);
  assert(Boolean(foundListing), 'Scenario B3: Listing persists after logout and re-login');
  assert(foundListing?.title === 'Engineering Mechanics Textbook (Persisted)', 'Scenario B4: Listing content intact');

  // ----------------------------------------------------
  // SCENARIO C: Declined requests show correct status
  // ----------------------------------------------------
  console.log('\n--- SCENARIO C: Declined Requests ---');
  // 1. User A has listing (createdListing)
  // 2. User B requests it
  setupTab('Tab2', new MockStorage());
  dbService.setCurrentUserId(userB.id);
  const interest = dbService.createInterest(createdListing.id, userB.id, 'Can I collect this tomorrow?');
  assert(interest.status === 'PENDING', 'Scenario C1: Request starts as PENDING');

  // 3. User A declines request
  setupTab('Tab1', tab1Session);
  dbService.setCurrentUserId(userA.id);
  const declinedInterest = dbService.updateInterestStatus(interest.id, 'DECLINED');
  assert(declinedInterest.status === 'DECLINED', 'Scenario C2: Request status stored as DECLINED');

  // 4. User B views it
  setupTab('Tab2', new MockStorage());
  dbService.setCurrentUserId(userB.id);
  const userBInterests = dbService.getInterests().filter(i => i.student_id === userB.id);
  const userBInterestOnListing = userBInterests.find(i => i.listing_id === createdListing.id);
  assert(userBInterestOnListing?.status === 'DECLINED', 'Scenario C3: User B sees interest status as DECLINED');

  // 5. Listing reverts to AVAILABLE for other students
  const listingAfterDecline = dbService.getListingById(createdListing.id);
  assert(listingAfterDecline?.status === 'AVAILABLE', 'Scenario C4: Listing reverts to AVAILABLE after decline');

  // 6. Notification generated
  const notifs = dbService.getNotifications(userB.id);
  const declineNotif = notifs.find(n => n.type === 'INTEREST_DECLINED');
  assert(Boolean(declineNotif), 'Scenario C5: INTEREST_DECLINED notification delivered to User B');

  // ----------------------------------------------------
  // SCENARIO D: "Mark as Complete" is owner-only
  // ----------------------------------------------------
  console.log('\n--- SCENARIO D: Owner Authorization ---');
  // 1. User A creates listing
  setupTab('Tab1', tab1Session);
  dbService.setCurrentUserId(userA.id);
  const listingD = await listingService.createListing({
    owner_id: userA.id,
    title: 'Lab Coat Chemistry',
    category: 'Lab Equipment',
    condition: 'Good',
    mode: 'DONATE',
    price: 0,
    description: 'Size M lab coat'
  });

  // 2. User B views it - verify UI permission flag
  setupTab('Tab2', new MockStorage());
  dbService.setCurrentUserId(userB.id);
  const isUserBOwner = listingD.owner_id === userB.id;
  assert(!isUserBOwner, 'Scenario D1: User B is NOT the owner of the listing');

  // 3. Programmatic unauthorized attempt by User B
  let unauthorizedErrorCaught = false;
  try {
    await listingService.updateListingStatus(listingD.id, 'COMPLETED', userB.id);
  } catch (err: any) {
    unauthorizedErrorCaught = true;
    assert(err.message.includes('Unauthorized'), 'Scenario D2: Programmatic update by User B rejected with Unauthorized error');
  }
  assert(unauthorizedErrorCaught, 'Scenario D3: Non-owner cannot update listing status to COMPLETED');

  // Also test dbService.completeHandover direct authorization check
  let handoverUnauthorizedCaught = false;
  try {
    dbService.completeHandover(listingD.id, userB.id);
  } catch (err: any) {
    handoverUnauthorizedCaught = true;
    assert(err.message.includes('Unauthorized'), 'Scenario D4: Direct completeHandover by User B rejected');
  }
  assert(handoverUnauthorizedCaught, 'Scenario D5: completeHandover protected against non-owner');

  // 4. User A (the owner) marks as complete
  setupTab('Tab1', tab1Session);
  dbService.setCurrentUserId(userA.id);
  const completedListing = await listingService.updateListingStatus(listingD.id, 'COMPLETED', userA.id);
  assert(completedListing.status === 'COMPLETED', 'Scenario D6: Owner (User A) successfully marks listing as COMPLETED');

  // ----------------------------------------------------
  // SCENARIO E: Multiple accounts in multiple tabs
  // ----------------------------------------------------
  console.log('\n--- SCENARIO E: Multiple Tabs / Accounts ---');
  const sessionTabA = new MockStorage();
  const sessionTabB = new MockStorage();

  // Tab 1 -> User A
  setupTab('Tab1', sessionTabA);
  dbService.setCurrentUserId(userA.id);

  // Tab 2 -> User B
  setupTab('Tab2', sessionTabB);
  dbService.setCurrentUserId(userB.id);

  // Refresh Tab 1
  setupTab('Tab1', sessionTabA);
  assert(dbService.getCurrentUserId() === userA.id, 'Scenario E1: Tab 1 retains User A after refresh');

  // Refresh Tab 2
  setupTab('Tab2', sessionTabB);
  assert(dbService.getCurrentUserId() === userB.id, 'Scenario E2: Tab 2 retains User B after refresh');

  // Logout User A in Tab 1
  setupTab('Tab1', sessionTabA);
  dbService.setCurrentUserId('');
  assert(dbService.getCurrentUserId() === '', 'Scenario E3: Tab 1 logged out');

  // Check Tab 2 is unaffected
  setupTab('Tab2', sessionTabB);
  assert(dbService.getCurrentUserId() === userB.id, 'Scenario E4: Tab 2 (User B) remains completely unaffected');

  // ----------------------------------------------------
  // SCENARIO F: Real-time listing synchronization
  // ----------------------------------------------------
  console.log('\n--- SCENARIO F: Real-time Listing Synchronization ---');
  let receivedMessage: any = null;
  // Mock BroadcastChannel for same-origin broadcast
  class MockBroadcastChannel {
    name: string;
    constructor(name: string) { this.name = name; }
    postMessage(msg: any) { receivedMessage = msg; }
    close() {}
  }
  (global as any).BroadcastChannel = MockBroadcastChannel;
  (global as any).window.BroadcastChannel = MockBroadcastChannel;

  // Broadcast listing insert
  listingService.broadcastChange('INSERT', listingD);
  assert(receivedMessage !== null, 'Scenario F1: Broadcast event sent');
  assert(receivedMessage?.type === 'INSERT', 'Scenario F2: Broadcast event type is INSERT');
  assert(receivedMessage?.payload?.id === listingD.id, 'Scenario F3: Broadcast payload matches listing');

  // Broadcast listing update
  listingService.broadcastChange('UPDATE', completedListing);
  assert(receivedMessage?.type === 'UPDATE', 'Scenario F4: Broadcast event type is UPDATE');
  assert(receivedMessage?.payload?.status === 'COMPLETED', 'Scenario F5: Broadcast updated status is COMPLETED');

  // ----------------------------------------------------
  // SCENARIO G: Refresh synchronization retrieves current state
  // ----------------------------------------------------
  console.log('\n--- SCENARIO G: Refresh Synchronization ---');
  // Create another listing as User A
  setupTab('Tab1', sessionTabA);
  dbService.setCurrentUserId(userA.id);
  const syncListing = await listingService.createListing({
    owner_id: userA.id,
    title: 'Scientific Calculator fx-991EX',
    category: 'Electronics',
    condition: 'Excellent',
    mode: 'BORROW',
    price: 0,
    description: 'Needed for engineering exam'
  });

  // Switch to User B in Tab 2 and refresh listings
  setupTab('Tab2', sessionTabB);
  const refreshedListings = await listingService.fetchListings();
  const foundSync = refreshedListings.find(l => l.id === syncListing.id);
  assert(Boolean(foundSync), 'Scenario G1: User B sees latest listing on refresh');
  assert(foundSync?.title === 'Scientific Calculator fx-991EX', 'Scenario G2: Refreshed listing title verified');

  console.log('\n========================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
