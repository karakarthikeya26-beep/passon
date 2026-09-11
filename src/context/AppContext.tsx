'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Listing, Interest, Handover, LookingFor, Match, KnowledgePost,
  SavedListing, SavedKnowledge, Notification, Report, Feedback
} from '../types';
import { dbService, initializeDatabase } from '../lib/db';
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
  reports: Report[];
  feedbacks: Feedback[];
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Actions
  createListing: (data: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'>) => Listing;
  updateListingStatus: (id: string, status: Listing['status']) => void;
  deleteListing: (id: string) => void;

  expressInterest: (listingId: string, message?: string) => Interest;
  acceptInterest: (interestId: string) => void;
  declineInterest: (interestId: string) => void;

  planHandover: (listingId: string, interestId: string, date: string, time: string, location: string, note?: string) => Handover;
  completeExchange: (listingId: string) => void;

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

    if (currentUser) {
      setSavedListings(dbService.getSavedListings(currentUser.id));
      setSavedKnowledge(dbService.getSavedKnowledge(currentUser.id));
      setNotifications(dbService.getNotifications(currentUser.id));
      setMatches(dbService.getMatchesForUser(currentUser.id));
    } else {
      setSavedListings([]);
      setSavedKnowledge([]);
      setNotifications([]);
      setMatches([]);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();

    const handleDbChange = () => refreshData();
    window.addEventListener('passon_db_change', handleDbChange);
    return () => window.removeEventListener('passon_db_change', handleDbChange);
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

  const createListing = (data: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
    const newListing = dbService.createListing(data);
    refreshData();
    showToast('Your item is now live on PassOn!', 'success');
    return newListing;
  };

  const updateListingStatus = (id: string, status: Listing['status']) => {
    dbService.updateListingStatus(id, status);
    refreshData();
  };

  const deleteListing = (id: string) => {
    dbService.deleteListing(id);
    refreshData();
    showToast('Listing removed successfully.', 'info');
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

  const completeExchange = (listingId: string) => {
    dbService.completeHandover(listingId);
    refreshData();
    showToast('Exchange marked as completed!', 'success');
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
        reports,
        feedbacks,
        toasts,
        showToast,
        removeToast,
        createListing,
        updateListingStatus,
        deleteListing,
        expressInterest,
        acceptInterest,
        declineInterest,
        planHandover,
        completeExchange,
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
