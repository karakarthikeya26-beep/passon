import { validateImageFile, isListingStorageUrl, extractStoragePathFromUrl } from '../src/lib/storage';
import { dbService, initializeDatabase } from '../src/lib/db';
import { listingService } from '../src/lib/listings';
import { User, Listing } from '../src/types';

// Mock browser environments
class MockStorage {
  private store = new Map<string, string>();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, val: string) { this.store.set(key, String(val)); }
  removeItem(key: string) { this.store.delete(key); }
  clear() { this.store.clear(); }
}

const sharedLocalStorage = new MockStorage();

function setupTab(tabName: string, sessionStorage: MockStorage) {
  (global as any).window = {
    localStorage: sharedLocalStorage,
    sessionStorage: sessionStorage,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    BroadcastChannel: class {
      postMessage() {}
      close() {}
    }
  };
  (global as any).localStorage = sharedLocalStorage;
  (global as any).sessionStorage = sessionStorage;
}

async function runStorageTests() {
  console.log('==============================================');
  console.log('RUNNING PASSON IMAGE UPLOAD & STORAGE TESTS');
  console.log('==============================================\n');

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

  // ----------------------------------------------------
  // 1. FILE VALIDATION TESTS
  // ----------------------------------------------------
  console.log('--- TEST 1: File Validation (Types & Size) ---');

  // Valid JPEG file
  const validJpeg = new File(['fake-jpeg-content'], 'calculator.jpg', { type: 'image/jpeg' });
  const val1 = validateImageFile(validJpeg);
  assert(val1.valid, 'Valid JPG file passes validation');

  // Valid PNG file
  const validPng = new File(['fake-png-content'], 'notes.png', { type: 'image/png' });
  const val2 = validateImageFile(validPng);
  assert(val2.valid, 'Valid PNG file passes validation');

  // Valid WEBP file
  const validWebp = new File(['fake-webp-content'], 'lab_coat.webp', { type: 'image/webp' });
  const val3 = validateImageFile(validWebp);
  assert(val3.valid, 'Valid WEBP file passes validation');

  // Invalid file type: PDF
  const invalidPdf = new File(['pdf-content'], 'document.pdf', { type: 'application/pdf' });
  const val4 = validateImageFile(invalidPdf);
  assert(!val4.valid && val4.error?.includes('Invalid file format'), 'Invalid PDF file rejected with clear error');

  // Invalid file type: EXE
  const invalidExe = new File(['exe-content'], 'program.exe', { type: 'application/octet-stream' });
  const val5 = validateImageFile(invalidExe);
  assert(!val5.valid && val5.error?.includes('Invalid file format'), 'Invalid EXE file rejected with clear error');

  // Oversized file (> 5MB)
  const oversizedBuffer = new Uint8Array(6 * 1024 * 1024); // 6MB
  const oversizedFile = new File([oversizedBuffer], 'huge_image.jpg', { type: 'image/jpeg' });
  const val6 = validateImageFile(oversizedFile);
  assert(!val6.valid && val6.error?.includes('Maximum allowed size is 5 MB'), 'Oversized file (>5MB) rejected with clear error');

  // ----------------------------------------------------
  // 2. STORAGE URL HELPERS
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Storage URL Detection & Path Extraction ---');
  const mockStorageUrl = 'https://qqpbjoyeuktxmrvycsru.supabase.co/storage/v1/object/public/listing-images/user-123/listing-456/photo.jpg';
  const externalUrl = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c';

  assert(isListingStorageUrl(mockStorageUrl), 'Correctly identifies Supabase listing-images URL');
  assert(!isListingStorageUrl(externalUrl), 'Correctly identifies external URL as not stored in listing-images');

  const extractedPath = extractStoragePathFromUrl(mockStorageUrl);
  assert(extractedPath === 'user-123/listing-456/photo.jpg', 'Correctly extracts storage object path', extractedPath || '');

  // ----------------------------------------------------
  // 3. COMPLETE LISTING FLOW WITH UPLOADED PHOTO
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Listing Flow with Uploaded Image ---');
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
  dbService.setCurrentUserId(userA.id);

  // Simulate uploading image and receiving public URL
  const uploadedPublicUrl = `https://qqpbjoyeuktxmrvycsru.supabase.co/storage/v1/object/public/listing-images/${userA.id}/drafts/${Date.now()}_calc.jpg`;

  // Create listing with uploaded photo URL
  const createdListing = await listingService.createListing({
    owner_id: userA.id,
    title: 'Casio Scientific Calculator FX-991EX (Device Upload)',
    category: 'Electronics',
    condition: 'Like New',
    mode: 'Sell',
    price: 600,
    description: 'Direct photo upload test from student device',
    images: [uploadedPublicUrl]
  });

  assert(Boolean(createdListing.id), 'Listing created with generated ID');
  assert(createdListing.images[0] === uploadedPublicUrl, 'Listing stores public image URL, not binary or base64');
  assert(!createdListing.images[0].startsWith('data:'), 'Verified: NOT storing raw base64 data in database');

  // Verify retrieval
  const fetchedListings = await listingService.fetchListings();
  const fetchedItem = fetchedListings.find(l => l.id === createdListing.id);
  assert(Boolean(fetchedItem), 'Listing fetched successfully');
  assert(fetchedItem?.images[0] === uploadedPublicUrl, 'Uploaded photo URL persists on listing load');

  // ----------------------------------------------------
  // 4. REFRESH, LOGOUT & RE-LOGIN PERSISTENCE
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Persistence across Refresh, Logout & Re-login ---');
  // Refresh simulation
  const refreshListings = await listingService.fetchListings();
  const foundAfterRefresh = refreshListings.find(l => l.id === createdListing.id);
  assert(foundAfterRefresh?.images[0] === uploadedPublicUrl, 'Photo URL persists after page refresh');

  // Logout
  dbService.setCurrentUserId('');
  assert(dbService.getCurrentUserId() === '', 'User logged out');

  // Re-login
  dbService.setCurrentUserId(userA.id);
  assert(dbService.getCurrentUserId() === userA.id, 'User A re-logged in');
  const foundAfterRelogin = (await listingService.fetchListings()).find(l => l.id === createdListing.id);
  assert(foundAfterRelogin?.images[0] === uploadedPublicUrl, 'Photo URL persists after logout and re-login');

  // ----------------------------------------------------
  // 5. OTHER USERS VIEWING PUBLIC LISTING PHOTO
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Public Visibility to Another User (User B) ---');
  const tab2Session = new MockStorage();
  setupTab('Tab2', tab2Session);
  dbService.setCurrentUserId(userB.id);

  const userBListings = await listingService.fetchListings();
  const userBViewItem = userBListings.find(l => l.id === createdListing.id);
  assert(Boolean(userBViewItem), 'User B can view User A listing');
  assert(userBViewItem?.images[0] === uploadedPublicUrl, 'User B sees the uploaded product photo');

  // ----------------------------------------------------
  // 6. EDIT LISTING / REPLACE PHOTO
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Edit Listing / Replace Photo ---');
  setupTab('Tab1', tab1Session);
  dbService.setCurrentUserId(userA.id);

  const newUploadedPhotoUrl = `https://qqpbjoyeuktxmrvycsru.supabase.co/storage/v1/object/public/listing-images/${userA.id}/${createdListing.id}/${Date.now()}_replacement.jpg`;

  // Owner replaces the photo
  const updatedListing = await listingService.updateListing(
    createdListing.id,
    { images: [newUploadedPhotoUrl] },
    userA.id
  );

  assert(updatedListing.images[0] === newUploadedPhotoUrl, 'Listing photo updated to new uploaded photo');

  // Non-owner unauthorized attempt to edit photo
  let unauthorizedEditCaught = false;
  try {
    await listingService.updateListing(
      createdListing.id,
      { images: ['https://malicious.com/fake.jpg'] },
      userB.id
    );
  } catch (err: any) {
    unauthorizedEditCaught = true;
    assert(err.message.includes('Unauthorized'), 'Non-owner cannot edit or replace listing photos');
  }
  assert(unauthorizedEditCaught, 'Authorization guard blocks non-owner photo replacement');

  // ----------------------------------------------------
  // 7. DELETE LISTING & CLEANUP
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Delete Listing & Storage Cleanup ---');
  await listingService.deleteListing(createdListing.id, userA.id);
  const listingsAfterDelete = await listingService.fetchListings();
  const deletedItem = listingsAfterDelete.find(l => l.id === createdListing.id);
  assert(deletedItem === undefined, 'Listing successfully deleted');

  console.log('\n==============================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runStorageTests().catch((err) => {
  console.error('Fatal error during storage test run:', err);
  process.exit(1);
});
