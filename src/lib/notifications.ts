import { Notification } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { dbService } from './db';

export const notificationService = {
  /**
   * Fetch all notifications for a specific user
   */
  fetchNotifications: async (userId: string): Promise<Notification[]> => {
    // 1. Local baseline first for instant response
    const localNotifs = dbService.getNotifications(userId);

    if (!isSupabaseConfigured || !userId) {
      return localNotifs;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[notificationService] Supabase fetch error (using local):', error.message);
        return localNotifs;
      }

      if (data && Array.isArray(data)) {
        // Merge Supabase notifications into local storage
        const existingIds = new Set(localNotifs.map((n) => n.id));
        let changed = false;

        data.forEach((remote: any) => {
          if (!existingIds.has(remote.id)) {
            const notif: Notification = {
              id: remote.id,
              user_id: remote.user_id,
              type: remote.type,
              message: remote.message,
              link: remote.link || undefined,
              read: remote.read ?? false,
              created_at: remote.created_at || new Date().toISOString(),
            };
            localNotifs.unshift(notif);
            changed = true;
          }
        });

        if (changed) {
          localNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          if (typeof window !== 'undefined') {
            localStorage.setItem('passon_notifications', JSON.stringify(localNotifs));
          }
        }
        return localNotifs;
      }
    } catch (err) {
      console.warn('[notificationService] Error syncing with Supabase:', err);
    }

    return localNotifs;
  },

  /**
   * Create a new notification (persisted locally and to Supabase)
   */
  createNotification: async (params: {
    user_id: string;
    type: Notification['type'];
    message: string;
    link?: string;
  }): Promise<Notification> => {
    const { user_id, type, message, link } = params;

    // 1. Store locally immediately
    const notif = dbService.createNotification(user_id, type, message, link);

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('notifications').insert({
          id: notif.id,
          user_id,
          type,
          message,
          link: link || null,
          read: false,
          created_at: notif.created_at,
        });

        if (error) {
          console.warn('[notificationService] Supabase insert note (persisted locally):', error.message);
        }
      } catch (err) {
        console.warn('[notificationService] Supabase notification error:', err);
      }
    }

    return notif;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id: string): Promise<void> => {
    dbService.markNotificationRead(id);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      } catch (err) {
        console.warn('[notificationService] Supabase markAsRead error:', err);
      }
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId: string): Promise<void> => {
    dbService.markAllNotificationsRead(userId);

    if (isSupabaseConfigured && userId) {
      try {
        await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
      } catch (err) {
        console.warn('[notificationService] Supabase markAllAsRead error:', err);
      }
    }
  },
};
