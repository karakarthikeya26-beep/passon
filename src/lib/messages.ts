import { Message } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { dbService } from './db';

export const messageService = {
  /**
   * Fetch all messages for a specific interest / conversation
   */
  getMessagesByInterest: async (interestId: string): Promise<Message[]> => {
    // 1. Get from local storage first for instant display
    const localMsgs = dbService.getMessagesByInterest(interestId);

    // 2. If Supabase is configured, try to fetch fresh messages from Supabase
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('interest_id', interestId)
          .order('created_at', { ascending: true });

        if (!error && data && Array.isArray(data)) {
          // Merge Supabase messages with local messages
          const existingIds = new Set(localMsgs.map((m) => m.id));
          const newFromSupabase = data.filter((d: any) => !existingIds.has(d.id));

          if (newFromSupabase.length > 0) {
            newFromSupabase.forEach((item: any) => {
              dbService.createOrMergeMessage({
                id: item.id,
                interest_id: item.interest_id,
                listing_id: item.listing_id,
                sender_id: item.sender_id,
                recipient_id: item.recipient_id,
                content: item.content,
                read: item.read ?? false,
                created_at: item.created_at || new Date().toISOString(),
              });
            });
            return dbService.getMessagesByInterest(interestId);
          }
        }
      } catch (err) {
        console.warn('[messageService] Supabase getMessages error (using local store):', err);
      }
    }

    return localMsgs;
  },

  /**
   * Send a new message
   */
  sendMessage: async (params: {
    interest_id: string;
    listing_id?: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    system_event?: boolean;
  }): Promise<Message> => {
    const { interest_id, listing_id, sender_id, recipient_id, content, system_event } = params;

    // 1. Store locally immediately
    const message = dbService.createMessage(
      interest_id,
      sender_id,
      recipient_id,
      content,
      listing_id,
      system_event
    );

    // 2. Try to persist to Supabase in background
    if (isSupabaseConfigured && !system_event) {
      try {
        const { error } = await supabase.from('messages').insert({
          id: message.id.startsWith('msg-') ? undefined : message.id,
          interest_id,
          listing_id: listing_id || null,
          sender_id,
          recipient_id,
          content,
          read: false,
          created_at: message.created_at,
        });

        if (error) {
          console.warn('[messageService] Supabase insert warning (persisted locally):', error.message);
        }
      } catch (err) {
        console.warn('[messageService] Supabase sendMessage error:', err);
      }
    }

    // 3. Notify recipient if it's not a system event
    if (!system_event) {
      const sender = dbService.getUserById(sender_id);
      const listing = listing_id ? dbService.getListingById(listing_id) : undefined;
      const snippet = content.length > 50 ? `${content.slice(0, 50)}...` : content;
      const title = listing ? ` on "${listing.title}"` : '';

      dbService.createNotification(
        recipient_id,
        'NEW_MESSAGE',
        `${sender?.name || 'A student'} sent you a message${title}: "${snippet}"`,
        `/matches?conversation=${interest_id}`
      );
    }

    return message;
  },

  /**
   * Mark all messages in a conversation as read for recipient
   */
  markAsRead: async (interestId: string, userId: string): Promise<void> => {
    dbService.markMessagesAsRead(interestId, userId);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('interest_id', interestId)
          .eq('recipient_id', userId);
      } catch (err) {
        console.warn('[messageService] Supabase markAsRead error:', err);
      }
    }
  },
};
