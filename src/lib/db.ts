import {
  User, Listing, LookingFor, KnowledgePost, Interest, Handover,
  SavedListing, SavedKnowledge, Feedback, Report, Notification, Match, Message
} from '../types';
import { MOCK_USERS, MOCK_LISTINGS, MOCK_LOOKING_FOR, MOCK_KNOWLEDGE_POSTS, MOCK_INTERESTS, MOCK_NOTIFICATIONS } from './mock-data';
import { calculateMatches } from './matcher';
import { generateUUID } from './supabase';

const STORAGE_KEYS = {
  USERS: 'passon_users',
  LISTINGS: 'passon_listings',
  LOOKING_FOR: 'passon_looking_for',
  KNOWLEDGE: 'passon_knowledge',
  INTERESTS: 'passon_interests',
  MESSAGES: 'passon_messages',
  HANDOVERS: 'passon_handovers',
  SAVED_LISTINGS: 'passon_saved_listings',
  SAVED_KNOWLEDGE: 'passon_saved_knowledge',
  FEEDBACK: 'passon_feedback',
  REPORTS: 'passon_reports',
  NOTIFICATIONS: 'passon_notifications',
  CURRENT_USER: 'passon_current_user_id',
  VERSION: 'passon_db_v4',
};

// Helper for safe localStorage access
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('passon_db_change'));
  } catch (err) {
    console.error(`Error writing ${key} to localStorage`, err);
  }
}

// Initializer to ensure clean database state exists on first run
export function initializeDatabase() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.VERSION)) {
    localStorage.setItem(STORAGE_KEYS.VERSION, '4.0');
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOOKING_FOR)) {
    localStorage.setItem(STORAGE_KEYS.LOOKING_FOR, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.KNOWLEDGE)) {
    localStorage.setItem(STORAGE_KEYS.KNOWLEDGE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.INTERESTS)) {
    localStorage.setItem(STORAGE_KEYS.INTERESTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.HANDOVERS)) {
    localStorage.setItem(STORAGE_KEYS.HANDOVERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SAVED_LISTINGS)) {
    localStorage.setItem(STORAGE_KEYS.SAVED_LISTINGS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SAVED_KNOWLEDGE)) {
    localStorage.setItem(STORAGE_KEYS.SAVED_KNOWLEDGE, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.FEEDBACK)) {
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.REPORTS)) {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify([]));
  }
  // Remove legacy shared CURRENT_USER from localStorage to guarantee tab isolation
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export const dbService = {
  // USERS
  getUsers: (): User[] => getStored(STORAGE_KEYS.USERS, []),
  getUserById: (id: string): User | undefined => {
    const users = dbService.getUsers();
    return users.find((u) => u.id === id);
  },
  getCurrentUserId: (): string => {
    if (typeof window === 'undefined') return '';
    try {
      const tabId = sessionStorage.getItem('passon_tab_user_id');
      if (tabId !== null) {
        return JSON.parse(tabId);
      }
      return '';
    } catch {
      return '';
    }
  },
  setCurrentUserId: (id: string) => {
    if (typeof window === 'undefined') return;
    try {
      if (!id) {
        sessionStorage.removeItem('passon_tab_user_id');
      } else {
        sessionStorage.setItem('passon_tab_user_id', JSON.stringify(id));
      }
      // Ensure shared localStorage key is removed so tabs never interfere with each other
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      window.dispatchEvent(new Event('passon_db_change'));
    } catch (err) {
      console.error('Error setting current user id', err);
    }
  },
  updateProfile: (userId: string, data: Partial<User>): User => {
    const users = dbService.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');
    const updated = { ...users[index], ...data };
    users[index] = updated;
    setStored(STORAGE_KEYS.USERS, users);
    return updated;
  },

  // LISTINGS
  getListings: (): Listing[] => {
    const listings = getStored<Listing[]>(STORAGE_KEYS.LISTINGS, []);
    const users = dbService.getUsers();
    return listings.map((l) => ({
      ...l,
      owner: users.find((u) => u.id === l.owner_id) || l.owner,
    }));
  },
  getListingById: (id: string): Listing | undefined => {
    const listings = dbService.getListings();
    return listings.find((l) => l.id === id);
  },
  createListing: (newListing: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'> & { id?: string }): Listing => {
    const listings = getStored<Listing[]>(STORAGE_KEYS.LISTINGS, []);
    const listing: Listing = {
      ...newListing,
      id: newListing.id || generateUUID(),
      status: 'AVAILABLE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updatedListings = [listing, ...listings];
    setStored(STORAGE_KEYS.LISTINGS, updatedListings);
    return listing;
  },
  updateListingStatus: (id: string, status: Listing['status']): Listing => {
    const listings = getStored<Listing[]>(STORAGE_KEYS.LISTINGS, []);
    const index = listings.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Listing not found');
    listings[index].status = status;
    listings[index].updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.LISTINGS, listings);
    return listings[index];
  },
  updateListing: (id: string, updates: Partial<Listing>): Listing => {
    const listings = getStored<Listing[]>(STORAGE_KEYS.LISTINGS, []);
    const index = listings.findIndex((l) => l.id === id);
    if (index === -1) throw new Error('Listing not found');
    const updated = {
      ...listings[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    listings[index] = updated;
    setStored(STORAGE_KEYS.LISTINGS, listings);
    return updated;
  },
  deleteListing: (id: string) => {
    const listings = getStored<Listing[]>(STORAGE_KEYS.LISTINGS, []);
    const filtered = listings.filter((l) => l.id !== id);
    setStored(STORAGE_KEYS.LISTINGS, filtered);
  },

  // INTERESTS
  getInterests: (): Interest[] => {
    const interests = getStored<Interest[]>(STORAGE_KEYS.INTERESTS, []);
    const listings = dbService.getListings();
    const users = dbService.getUsers();
    return interests.map((i) => ({
      ...i,
      listing: listings.find((l) => l.id === i.listing_id),
      student: users.find((u) => u.id === i.student_id),
    }));
  },
  createInterest: (listing_id: string, student_id: string, message?: string): Interest => {
    const interests = getStored<Interest[]>(STORAGE_KEYS.INTERESTS, []);
    const existing = interests.find((i) => i.listing_id === listing_id && i.student_id === student_id);
    if (existing) return existing;

    const interest: Interest = {
      id: generateUUID(),
      listing_id,
      student_id,
      message,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.INTERESTS, [interest, ...interests]);

    // Update listing status to INTERESTED if currently AVAILABLE
    const listing = dbService.getListingById(listing_id);
    if (listing && listing.status === 'AVAILABLE') {
      dbService.updateListingStatus(listing_id, 'INTERESTED');
    }

    // Record initial message if provided
    if (message && message.trim() && listing) {
      dbService.createMessage(
        interest.id,
        student_id,
        listing.owner_id,
        message.trim(),
        listing_id,
        false
      );
    }

    // Notify owner with direct link to conversation
    if (listing) {
      const student = dbService.getUserById(student_id);
      dbService.createNotification(
        listing.owner_id,
        'INTEREST_RECEIVED',
        `${student?.name || 'A student'} expressed interest in your ${listing.title}.`,
        `/matches?conversation=${interest.id}`
      );
    }

    return interest;
  },
  updateInterestStatus: (id: string, status: 'ACCEPTED' | 'DECLINED'): Interest => {
    const interests = getStored<Interest[]>(STORAGE_KEYS.INTERESTS, []);
    const index = interests.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Interest not found');

    interests[index].status = status;
    interests[index].updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.INTERESTS, interests);

    const interest = interests[index];
    const listing = dbService.getListingById(interest.listing_id);

    if (status === 'ACCEPTED' && listing) {
      // Transition listing to RESERVED
      dbService.updateListingStatus(listing.id, 'RESERVED');

      // Decline other pending interests for this listing
      interests.forEach((other) => {
        if (other.listing_id === listing.id && other.id !== id && other.status === 'PENDING') {
          other.status = 'DECLINED';
        }
      });
      setStored(STORAGE_KEYS.INTERESTS, interests);

      // Record system event in conversation
      dbService.createMessage(
        interest.id,
        listing.owner_id,
        interest.student_id,
        `Interest accepted! Listing is now reserved. Handover can be planned.`,
        listing.id,
        true
      );

      // Notify interested student with direct link to conversation
      dbService.createNotification(
        interest.student_id,
        'INTEREST_ACCEPTED',
        `Your interest in "${listing.title}" was accepted! Handover can now be planned.`,
        `/matches?conversation=${interest.id}`
      );
    } else if (status === 'DECLINED' && listing) {
      // Revert listing to AVAILABLE if no other accepted or pending interest exists
      const hasOtherPending = interests.some((other) => other.listing_id === listing.id && other.id !== id && other.status === 'PENDING');
      const hasOtherAccepted = interests.some((other) => other.listing_id === listing.id && other.status === 'ACCEPTED');
      if (!hasOtherPending && !hasOtherAccepted && listing.status === 'INTERESTED') {
        dbService.updateListingStatus(listing.id, 'AVAILABLE');
      }

      // Record system event in conversation
      dbService.createMessage(
        interest.id,
        listing.owner_id,
        interest.student_id,
        `Interest request was declined by the owner.`,
        listing.id,
        true
      );

      // Notify student
      dbService.createNotification(
        interest.student_id,
        'INTEREST_DECLINED',
        `Your request for "${listing.title}" was declined by the owner.`,
        `/marketplace/${listing.id}`
      );
    }

    return interest;
  },

  // HANDOVERS
  getHandovers: (): Handover[] => getStored<Handover[]>(STORAGE_KEYS.HANDOVERS, []),
  createHandover: (listing_id: string, interest_id: string, date: string, time: string, location: string, note?: string): Handover => {
    const handovers = dbService.getHandovers();
    const handover: Handover = {
      id: generateUUID(),
      listing_id,
      interest_id,
      date,
      time,
      location,
      note,
      status: 'PLANNED',
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.HANDOVERS, [handover, ...handovers]);

    dbService.updateListingStatus(listing_id, 'HANDOVER_PLANNED');

    // Record system event in conversation
    const interest = dbService.getInterests().find((i) => i.id === interest_id);
    const listing = dbService.getListingById(listing_id);
    if (interest && listing) {
      dbService.createMessage(
        interest_id,
        listing.owner_id,
        interest.student_id,
        `Campus handover planned at ${location} on ${date} (${time}).${note ? ` Note: "${note}"` : ''}`,
        listing_id,
        true
      );

      // Notify interested student
      dbService.createNotification(
        interest.student_id,
        'HANDOVER_PLANNED',
        `Campus handover planned for "${listing.title}" at ${location} on ${date} (${time}).`,
        `/matches?conversation=${interest_id}`
      );
    }

    return handover;
  },
  completeHandover: (listing_id: string, actorUserId?: string): void => {
    const listing = dbService.getListingById(listing_id);
    if (!listing) throw new Error('Listing not found');
    if (actorUserId && listing.owner_id !== actorUserId) {
      throw new Error('Unauthorized: Only the listing owner can mark it as complete.');
    }

    dbService.updateListingStatus(listing_id, 'COMPLETED');
    const handovers = dbService.getHandovers();
    const index = handovers.findIndex((h) => h.listing_id === listing_id);
    if (index !== -1) {
      handovers[index].status = 'COMPLETED';
      setStored(STORAGE_KEYS.HANDOVERS, handovers);
    }

    const interest = dbService.getInterests().find((i) => i.listing_id === listing_id && i.status === 'ACCEPTED');
    if (listing && interest) {
      // Record system event in conversation
      dbService.createMessage(
        interest.id,
        listing.owner_id,
        interest.student_id,
        `Exchange for "${listing.title}" marked as completed. Thank you!`,
        listing_id,
        true
      );

      // Notify buyer to leave feedback
      dbService.createNotification(
        interest.student_id,
        'EXCHANGE_COMPLETED',
        `Exchange for "${listing.title}" marked as completed. Tap to leave feedback for the owner.`,
        `/matches?conversation=${interest.id}`
      );
    }
  },

  // LOOKING FOR
  getLookingFor: (): LookingFor[] => {
    const requests = getStored<LookingFor[]>(STORAGE_KEYS.LOOKING_FOR, []);
    const users = dbService.getUsers();
    return requests.map((r) => ({
      ...r,
      student: users.find((u) => u.id === r.student_id),
    }));
  },
  createLookingFor: (newReq: Omit<LookingFor, 'id' | 'created_at' | 'updated_at' | 'status'>): LookingFor => {
    const requests = getStored<LookingFor[]>(STORAGE_KEYS.LOOKING_FOR, []);
    const req: LookingFor = {
      ...newReq,
      id: generateUUID(),
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.LOOKING_FOR, [req, ...requests]);
    return req;
  },
  updateLookingForStatus: (id: string, status: LookingFor['status']): LookingFor => {
    const requests = getStored<LookingFor[]>(STORAGE_KEYS.LOOKING_FOR, []);
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Request not found');
    requests[index].status = status;
    requests[index].updated_at = new Date().toISOString();
    setStored(STORAGE_KEYS.LOOKING_FOR, requests);
    return requests[index];
  },

  // MATCHES
  getMatchesForUser: (userId: string): Match[] => {
    const requests = dbService.getLookingFor().filter((r) => r.student_id === userId);
    const listings = dbService.getListings();
    return calculateMatches(requests, listings);
  },

  // KNOWLEDGE POSTS
  getKnowledgePosts: (): KnowledgePost[] => {
    const posts = getStored<KnowledgePost[]>(STORAGE_KEYS.KNOWLEDGE, []);
    const users = dbService.getUsers();
    return posts.map((p) => ({
      ...p,
      author: users.find((u) => u.id === p.author_id),
    }));
  },
  getKnowledgePostById: (id: string): KnowledgePost | undefined => {
    const posts = dbService.getKnowledgePosts();
    return posts.find((p) => p.id === id);
  },
  createKnowledgePost: (newPost: Omit<KnowledgePost, 'id' | 'created_at' | 'updated_at' | 'status' | 'useful_count'>): KnowledgePost => {
    const posts = getStored<KnowledgePost[]>(STORAGE_KEYS.KNOWLEDGE, []);
    const post: KnowledgePost = {
      ...newPost,
      id: generateUUID(),
      useful_count: 0,
      status: 'PUBLISHED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.KNOWLEDGE, [post, ...posts]);
    return post;
  },
  incrementUsefulCount: (id: string): number => {
    const posts = getStored<KnowledgePost[]>(STORAGE_KEYS.KNOWLEDGE, []);
    const index = posts.findIndex((p) => p.id === id);
    if (index === -1) return 0;
    posts[index].useful_count += 1;
    setStored(STORAGE_KEYS.KNOWLEDGE, posts);
    return posts[index].useful_count;
  },

  // SAVED ITEMS
  getSavedListings: (userId: string): SavedListing[] => {
    const saved = getStored<SavedListing[]>(STORAGE_KEYS.SAVED_LISTINGS, []);
    const listings = dbService.getListings();
    return saved.filter((s) => s.user_id === userId).map((s) => ({
      ...s,
      listing: listings.find((l) => l.id === s.listing_id),
    }));
  },
  toggleSaveListing: (userId: string, listing_id: string): boolean => {
    const saved = getStored<SavedListing[]>(STORAGE_KEYS.SAVED_LISTINGS, []);
    const index = saved.findIndex((s) => s.user_id === userId && s.listing_id === listing_id);
    if (index !== -1) {
      saved.splice(index, 1);
      setStored(STORAGE_KEYS.SAVED_LISTINGS, saved);
      return false; // unsaved
    } else {
      saved.push({
        id: generateUUID(),
        user_id: userId,
        listing_id,
        created_at: new Date().toISOString(),
      });
      setStored(STORAGE_KEYS.SAVED_LISTINGS, saved);
      return true; // saved
    }
  },

  getSavedKnowledge: (userId: string): SavedKnowledge[] => {
    const saved = getStored<SavedKnowledge[]>(STORAGE_KEYS.SAVED_KNOWLEDGE, []);
    const posts = dbService.getKnowledgePosts();
    return saved.filter((s) => s.user_id === userId).map((s) => ({
      ...s,
      post: posts.find((p) => p.id === s.knowledge_post_id),
    }));
  },
  toggleSaveKnowledge: (userId: string, knowledge_post_id: string): boolean => {
    const saved = getStored<SavedKnowledge[]>(STORAGE_KEYS.SAVED_KNOWLEDGE, []);
    const index = saved.findIndex((s) => s.user_id === userId && s.knowledge_post_id === knowledge_post_id);
    if (index !== -1) {
      saved.splice(index, 1);
      setStored(STORAGE_KEYS.SAVED_KNOWLEDGE, saved);
      return false; // unsaved
    } else {
      saved.push({
        id: generateUUID(),
        user_id: userId,
        knowledge_post_id,
        created_at: new Date().toISOString(),
      });
      setStored(STORAGE_KEYS.SAVED_KNOWLEDGE, saved);
      return true; // saved
    }
  },

  // FEEDBACK
  getFeedbacks: (): Feedback[] => {
    const feedbacks = getStored<Feedback[]>(STORAGE_KEYS.FEEDBACK, []);
    const users = dbService.getUsers();
    return feedbacks.map((f) => ({
      ...f,
      from_student: users.find((u) => u.id === f.from_user),
    }));
  },
  createFeedback: (exchange_id: string, from_user: string, to_user: string, rating: number, comment?: string): Feedback => {
    const feedbacks = dbService.getFeedbacks();
    const feedback: Feedback = {
      id: generateUUID(),
      exchange_id,
      from_user,
      to_user,
      rating,
      comment,
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.FEEDBACK, [feedback, ...feedbacks]);
    return feedback;
  },

  // REPORTS
  getReports: (): Report[] => {
    const reports = getStored<Report[]>(STORAGE_KEYS.REPORTS, []);
    const users = dbService.getUsers();
    return reports.map((r) => ({
      ...r,
      reporter: users.find((u) => u.id === r.reporter_id),
    }));
  },
  createReport: (reporter_id: string, target_type: 'listing' | 'user' | 'knowledge', target_id: string, reason: Report['reason'], description?: string): Report => {
    const reports = dbService.getReports();
    const report: Report = {
      id: generateUUID(),
      reporter_id,
      target_type,
      target_id,
      reason,
      description,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.REPORTS, [report, ...reports]);
    return report;
  },
  updateReportStatus: (id: string, status: Report['status']): Report => {
    const reports = dbService.getReports();
    const index = reports.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Report not found');
    reports[index].status = status;
    setStored(STORAGE_KEYS.REPORTS, reports);
    return reports[index];
  },

  // NOTIFICATIONS
  getNotifications: (userId: string): Notification[] => {
    const notifs = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifs.filter((n) => n.user_id === userId);
  },
  createNotification: (user_id: string, type: Notification['type'], message: string, link?: string): Notification => {
    const notifs = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const notif: Notification = {
      id: generateUUID(),
      user_id,
      type,
      message,
      link,
      read: false,
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.NOTIFICATIONS, [notif, ...notifs]);
    return notif;
  },
  markNotificationRead: (id: string): void => {
    const notifs = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    const index = notifs.findIndex((n) => n.id === id);
    if (index !== -1) {
      notifs[index].read = true;
      setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
    }
  },
  markAllNotificationsRead: (userId: string): void => {
    const notifs = getStored<Notification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
    notifs.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    setStored(STORAGE_KEYS.NOTIFICATIONS, notifs);
  },

  // MESSAGES
  getMessages: (): Message[] => {
    const messages = getStored<Message[]>(STORAGE_KEYS.MESSAGES, []);
    const users = dbService.getUsers();
    return messages.map((m) => ({
      ...m,
      sender: users.find((u) => u.id === m.sender_id),
      recipient: users.find((u) => u.id === m.recipient_id),
    }));
  },
  getMessagesByInterest: (interestId: string): Message[] => {
    const all = dbService.getMessages();
    return all
      .filter((m) => m.interest_id === interestId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },
  createMessage: (
    interest_id: string,
    sender_id: string,
    recipient_id: string,
    content: string,
    listing_id?: string,
    system_event?: boolean
  ): Message => {
    const messages = getStored<Message[]>(STORAGE_KEYS.MESSAGES, []);
    const msg: Message = {
      id: generateUUID(),
      interest_id,
      listing_id,
      sender_id,
      recipient_id,
      content,
      read: false,
      system_event: system_event || false,
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.MESSAGES, [...messages, msg]);
    return msg;
  },
  createOrMergeMessage: (msg: Message): void => {
    const messages = getStored<Message[]>(STORAGE_KEYS.MESSAGES, []);
    const exists = messages.some((m) => m.id === msg.id);
    if (!exists) {
      setStored(STORAGE_KEYS.MESSAGES, [...messages, msg]);
    }
  },
  markMessagesAsRead: (interestId: string, recipientId: string): void => {
    const messages = getStored<Message[]>(STORAGE_KEYS.MESSAGES, []);
    let changed = false;
    messages.forEach((m) => {
      if (m.interest_id === interestId && m.recipient_id === recipientId && !m.read) {
        m.read = true;
        changed = true;
      }
    });
    if (changed) {
      setStored(STORAGE_KEYS.MESSAGES, messages);
    }
  },
  getUnreadMessageCount: (userId: string): number => {
    const messages = getStored<Message[]>(STORAGE_KEYS.MESSAGES, []);
    return messages.filter((m) => m.recipient_id === userId && !m.read && !m.system_event).length;
  },
};
