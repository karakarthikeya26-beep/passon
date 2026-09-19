'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Listing, Interest, Handover, LookingFor, Match, KnowledgePost,
  SavedListing, SavedKnowledge, Notification, Report, Feedback, Message
} from '../types';
import { dbService, initializeDatabase } from '../lib/db';
import { listingService } from '../lib/listings';
import { messageService } from '../lib/messages';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  listings: Listing[];
  interests: Interest[];
  handovers: Handover[];
  lookingFor: LookingFor[];
  matches: Match[];
  knowledgePosts: KnowledgePost[];
  savedListings: SavedListing[];
  savedKnowledge: SavedKnowledge[];
  notifications: Notification[];
  messages: Message[];
  unreadMessageCount: number;
  reports: Report[];
  feedbacks: Feedback[];
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Actions
  createListing: (data: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<Listing> | Listing;
  updateListing: (id: string, data: Partial<Listing>) => Promise<Listing | void>;
  updateListingStatus: (id: string, status: Listing['status']) => Promise<void> | void;
  deleteListing: (id: string) => Promise<void> | void;

  expressInterest: (listingId: string, message?: string) => Interest;
  acceptInterest: (interestId: string) => void;
  declineInterest: (interestId: string) => void;

  planHandover: (listingId: string, interestId: string, date: string, time: string, location: string, note?: string) => Handover;
  completeExchange: (listingId: string) => Promise<void> | void;

  sendMessage: (interestId: string, recipientId: string, content: string, listingId?: string) => Promise<Message>;
  markConversationRead: (interestId: string) => Promise<void>;
  getConversationMessages: (interestId: string) => Message[];

  createLookingFor: (data: Omit<LookingFor, 'id' | 'created_at' | 'updated_at' | 'status'>) => LookingFor;
  updateLookingForStatus: (id: string, status: LookingFor['status']) => void;

  createKnowledgePost: (data: Omit<KnowledgePost, 'id' | 'created_at' | 'updated_at' | 'status' | 'useful_count'>) => KnowledgePost;
  markKnowledgeUseful: (id: string) => void;

  toggleSaveListing: (listingId: string) => void;
  toggleSaveKnowledge: (postId: string) => void;

  submitFeedback: (exchangeId: string, toUserId: string, rating: number, comment?: string) => void;
  submitReport: (targetType: 'listing' | 'user' | 'knowledge', targetId: string, reason: Report['reason'], description?: string) => void;
  updateReportStatus: (id: string, status: Report['status']) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [knowledgePosts, setKnowledgePosts] = useState<KnowledgePost[]>([]);
  const [savedListings, setSavedListings] = useState<SavedListing[]>([]);
  const [savedKnowledge, setSavedKnowledge] = useState<SavedKnowledge[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState<number>(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const refreshData = useCallback(() => {
    initializeDatabase();
    setListings(dbService.getListings());
    setInterests(dbService.getInterests());
    setHandovers(dbService.getHandovers());
    setLookingFor(dbService.getLookingFor());
    setKnowledgePosts(dbService.getKnowledgePosts());
    setReports(dbService.getReports());
    setFeedbacks(dbService.getFeedbacks());
    setMessages(dbService.getMessages());

    // Asynchronously fetch fresh persistent listings from Supabase
    listingService.fetchListings().then((fetched) => {
      if (fetched && fetched.length > 0) {
        setListings(fetched);
      }
    }).catch(console.warn);

    if (currentUser) {
      setSavedListings(dbService.getSavedListings(currentUser.id));
      setSavedKnowledge(dbService.getSavedKnowledge(currentUser.id));
      setNotifications(dbService.getNotifications(currentUser.id));
      setMatches(dbService.getMatchesForUser(currentUser.id));
      setUnreadMessageCount(dbService.getUnreadMessageCount(currentUser.id));
    } else {
      setSavedListings([]);
      setSavedKnowledge([]);
      setNotifications([]);
      setMatches([]);
      setUnreadMessageCount(0);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();

    // 1. Listen for local database storage changes
    const handleDbChange = () => refreshData();
    window.addEventListener('passon_db_change', handleDbChange);

    // 2. Cross-tab browser broadcast channel for zero-latency multi-tab sync
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('passon_listings_sync');
        bc.onmessage = (event) => {
          const { type, payload } = event.data || {};
          if (type === 'INSERT' && payload) {
            setListings((prev) => {
              if (prev.some((l) => l.id === payload.id)) return prev;
              return [payload, ...prev];
            });
          } else if (type === 'UPDATE' && payload) {
            setListings((prev) =>
              prev.map((l) => (l.id === payload.id ? { ...l, ...payload } : l))
            );
          } else if (type === 'DELETE' && payload) {
            setListings((prev) => prev.filter((l) => l.id !== payload.id));
          }
        };
      } catch (e) {
        console.warn('[AppContext] BroadcastChannel error:', e);
      }
    }

    // 3. Supabase Realtime channel for cross-browser & backend database events
    let supabaseChannel: any = null;
    if (isSupabaseConfigured) {
      try {
        supabaseChannel = supabase
          .channel('passon_listings_realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'listings' },
            (payload: any) => {
              console.log('[AppContext] Realtime postgres_changes event:', payload);
              if (payload.eventType === 'INSERT') {
                listingService.fetchListings().then(setListings).catch(console.warn);
              } else if (payload.eventType === 'UPDATE') {
                setListings((prev) =>
                  prev.map((l) => (l.id === payload.new.id ? { ...l, ...payload.new } : l))
                );
              } else if (payload.eventType === 'DELETE') {
                setListings((prev) => prev.filter((l) => l.id !== payload.old.id));
              }
            }
          )
          .on('broadcast', { event: 'listing_changed' }, (msg: any) => {
            const { type, payload } = msg.payload || {};
            if (type === 'INSERT' && payload) {
              setListings((prev) => {
                if (prev.some((l) => l.id === payload.id)) return prev;
                return [payload, ...prev];
              });
            } else if (type === 'UPDATE' && payload) {
              setListings((prev) =>
                prev.map((l) => (l.id === payload.id ? { ...l, ...payload } : l))
              );
            } else if (type === 'DELETE' && payload) {
              setListings((prev) => prev.filter((l) => l.id !== payload.id));
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('[AppContext] Supabase Realtime subscribe note:', err);
      }
    }

    return () => {
      window.removeEventListener('passon_db_change', handleDbChange);
      if (bc) bc.close();
      if (supabaseChannel && isSupabaseConfigured) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, [refreshData]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const createListing = async (data: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    const newListing = await listingService.createListing(data);
    setListings((prev) => [newListing, ...prev.filter((l) => l.id !== newListing.id)]);
    refreshData();
    showToast('Your item is now live on PassOn!', 'success');
    return newListing;
  };

  const updateListingStatus = async (id: string, status: Listing['status']) => {
    try {
      const updated = await listingService.updateListingStatus(id, status, currentUser?.id);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      refreshData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update listing status.', 'error');
    }
  };

  const updateListing = async (id: string, data: Partial<Listing>) => {
    try {
      const updated = await listingService.updateListing(id, data, currentUser?.id);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      refreshData();
      showToast('Listing updated successfully.', 'success');
      return updated;
    } catch (err: any) {
      showToast(err.message || 'Failed to update listing.', 'error');
      throw err;
    }
  };

  const deleteListing = async (id: string) => {
    try {
      await listingService.deleteListing(id, currentUser?.id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      refreshData();
      showToast('Listing removed successfully.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete listing.', 'error');
    }
  };

  const expressInterest = (listingId: string, message?: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    const interest = dbService.createInterest(listingId, currentUser.id, message);
    refreshData();
    showToast('Interest Sent! The owner has been notified.', 'success');
    return interest;
  };

  const acceptInterest = (interestId: string) => {
    dbService.updateInterestStatus(interestId, 'ACCEPTED');
    refreshData();
    showToast('Interest request accepted. Listing reserved!', 'success');
  };

  const declineInterest = (interestId: string) => {
    dbService.updateInterestStatus(interestId, 'DECLINED');
    refreshData();
    showToast('Interest request declined.', 'info');
  };

  const planHandover = (listingId: string, interestId: string, date: string, time: string, location: string, note?: string) => {
    const handover = dbService.createHandover(listingId, interestId, date, time, location, note);
    refreshData();
    showToast(`Campus handover planned at ${location}!`, 'success');
    return handover;
  };

  const completeExchange = async (listingId: string) => {
    const listing = listings.find((l) => l.id === listingId) || dbService.getListingById(listingId);
    if (!listing) {
      showToast('Listing not found.', 'error');
      return;
    }

    // Owner-only restriction: verify authenticated user against listing owner ID
    if (!currentUser || listing.owner_id !== currentUser.id) {
      showToast('Unauthorized: Only the listing owner can mark it as complete.', 'error');
      throw new Error('Unauthorized: Only the listing owner can mark it as complete.');
    }

    try {
      dbService.completeHandover(listingId, currentUser.id);
      await listingService.updateListingStatus(listingId, 'COMPLETED', currentUser.id);
      refreshData();
      showToast('Exchange marked as completed!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to mark exchange as complete.', 'error');
      throw err;
    }
  };

  const createLookingFor = (data: Omit<LookingFor, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    const req = dbService.createLookingFor(data);
    refreshData();
    showToast('Your request is live on Looking For.', 'success');
    return req;
  };

  const updateLookingForStatus = (id: string, status: LookingFor['status']) => {
    dbService.updateLookingForStatus(id, status);
    refreshData();
    showToast(`Request status updated to ${status}.`, 'info');
  };

  const createKnowledgePost = (data: Omit<KnowledgePost, 'id' | 'created_at' | 'updated_at' | 'status' | 'useful_count'>) => {
    const post = dbService.createKnowledgePost(data);
    refreshData();
    showToast('Published to Knowledge Shelf!', 'success');
    return post;
  };

  const markKnowledgeUseful = (id: string) => {
    dbService.incrementUsefulCount(id);
    refreshData();
    showToast('Marked as useful! Thank you for the feedback.', 'success');
  };

  const toggleSaveListing = (listingId: string) => {
    if (!currentUser) {
      showToast('Please log in to save items.', 'error');
      return;
    }
    const isSaved = dbService.toggleSaveListing(currentUser.id, listingId);
    refreshData();
    showToast(isSaved ? 'Item saved to your activity.' : 'Item removed from saved items.', 'info');
  };

  const toggleSaveKnowledge = (postId: string) => {
    if (!currentUser) {
      showToast('Please log in to save posts.', 'error');
      return;
    }
    const isSaved = dbService.toggleSaveKnowledge(currentUser.id, postId);
    refreshData();
    showToast(isSaved ? 'Knowledge post saved.' : 'Knowledge post unsaved.', 'info');
  };

  const submitFeedback = (exchangeId: string, toUserId: string, rating: number, comment?: string) => {
    if (!currentUser) return;
    dbService.createFeedback(exchangeId, currentUser.id, toUserId, rating, comment);
    refreshData();
    showToast('Thank you for rating your campus exchange experience!', 'success');
  };

  const submitReport = (targetType: 'listing' | 'user' | 'knowledge', targetId: string, reason: Report['reason'], description?: string) => {
    if (!currentUser) return;
    dbService.createReport(currentUser.id, targetType, targetId, reason, description);
    refreshData();
    showToast('Thanks. This has been sent for review.', 'info');
  };

  const updateReportStatus = (id: string, status: Report['status']) => {
    dbService.updateReportStatus(id, status);
    refreshData();
    showToast(`Report updated to ${status}.`, 'info');
  };

  const sendMessage = useCallback(async (interestId: string, recipientId: string, content: string, listingId?: string) => {
    if (!currentUser) throw new Error('Must be logged in');
    const msg = await messageService.sendMessage({
      interest_id: interestId,
      listing_id: listingId,
      sender_id: currentUser.id,
      recipient_id: recipientId,
      content,
    });
    refreshData();
    return msg;
  }, [currentUser, refreshData]);

  const markConversationRead = useCallback(async (interestId: string) => {
    if (!currentUser) return;
    await messageService.markAsRead(interestId, currentUser.id);
    refreshData();
  }, [currentUser, refreshData]);

  const getConversationMessages = (interestId: string) => {
    return messages
      .filter((m) => m.interest_id === interestId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const markNotificationRead = (id: string) => {
    dbService.markNotificationRead(id);
    refreshData();
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    dbService.markAllNotificationsRead(currentUser.id);
    refreshData();
    showToast('All notifications marked as read.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        listings,
        interests,
        handovers,
        lookingFor,
        matches,
        knowledgePosts,
        savedListings,
        savedKnowledge,
        notifications,
        messages,
        unreadMessageCount,
        reports,
        feedbacks,
        toasts,
        showToast,
        removeToast,
        createListing,
        updateListing,
        updateListingStatus,
        deleteListing,
        expressInterest,
        acceptInterest,
        declineInterest,
        planHandover,
        completeExchange,
        sendMessage,
        markConversationRead,
        getConversationMessages,
        createLookingFor,
        updateLookingForStatus,
        createKnowledgePost,
        markKnowledgeUseful,
        toggleSaveListing,
        toggleSaveKnowledge,
        submitFeedback,
        submitReport,
        updateReportStatus,
        markNotificationRead,
        markAllNotificationsRead,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
