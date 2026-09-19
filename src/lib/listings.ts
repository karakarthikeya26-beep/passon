import { Listing } from '../types';
import { supabase, isSupabaseConfigured, generateUUID } from './supabase';
import { dbService } from './db';

const BROADCAST_CHANNEL_NAME = 'passon_listings_sync';

// Local cross-tab broadcast channel for zero-latency same-browser sync
const getBroadcastChannel = () => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      return new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return null;
};

export const listingService = {
  /**
   * Broadcast a listing change to all tabs and realtime channels
   */
  broadcastChange: (type: 'INSERT' | 'UPDATE' | 'DELETE', payload: Listing) => {
    // 1. Cross-tab browser broadcast
    const bc = getBroadcastChannel();
    if (bc) {
      bc.postMessage({ type, payload });
      bc.close();
    }

    // 2. Supabase Realtime broadcast channel
    if (isSupabaseConfigured) {
      try {
        const channel = supabase.channel('listings-realtime-broadcast');
        channel.subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            channel.send({
              type: 'broadcast',
              event: 'listing_changed',
              payload: { type, payload },
            });
          }
        });
      } catch (err) {
        console.warn('[listingService] Realtime broadcast notice:', err);
      }
    }
  },

  /**
   * Fetch all listings from Supabase and merge with local store
   */
  fetchListings: async (): Promise<Listing[]> => {
    // 1. Get current local listings as instant baseline
    const localListings = dbService.getListings();

    if (!isSupabaseConfigured) {
      return localListings;
    }

    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          owner_id,
          title,
          category,
          condition,
          mode,
          price,
          exchange_preference,
          description,
          status,
          created_at,
          updated_at,
          listing_images (file_url),
          users:owner_id (id, name, email, branch, batch, avatar_url, role, bio)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[listingService] Supabase fetchListings note (using local listings):', error.message);
        return localListings;
      }

      if (data && Array.isArray(data)) {
        const remoteListings: Listing[] = data.map((item: any) => {
          const imgUrls: string[] = Array.isArray(item.listing_images)
            ? item.listing_images.map((img: any) => img.file_url)
            : [];

          const ownerObj = item.users || dbService.getUserById(item.owner_id);

          return {
            id: item.id,
            owner_id: item.owner_id,
            title: item.title,
            category: item.category,
            condition: item.condition,
            mode: item.mode,
            price: Number(item.price) || 0,
            exchange_preference: item.exchange_preference || '',
            description: item.description,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at || item.created_at,
            images: imgUrls.length > 0 ? imgUrls : [],
            owner: ownerObj,
          };
        });

        // Merge remote listings with local listings, remote taking precedence
        const remoteIds = new Set(remoteListings.map((l) => l.id));
        const mergedListings = [
          ...remoteListings,
          ...localListings.filter((l) => !remoteIds.has(l.id)),
        ];

        // Update local storage cache
        if (typeof window !== 'undefined') {
          localStorage.setItem('passon_listings', JSON.stringify(mergedListings));
        }

        return mergedListings;
      }
    } catch (err) {
      console.warn('[listingService] Fetch exception (fallback to local):', err);
    }

    return localListings;
  },

  /**
   * Create a new listing in Supabase and local cache
   */
  createListing: async (
    data: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<Listing> => {
    const listingId = generateUUID();
    const now = new Date().toISOString();

    const newListing: Listing = {
      ...data,
      id: listingId,
      status: 'AVAILABLE',
      created_at: now,
      updated_at: now,
      owner: dbService.getUserById(data.owner_id),
    };

    // 1. Immediately store in local database service
    const localCreated = dbService.createListing({
      ...data,
      owner_id: data.owner_id,
    });
    // Ensure ID matches generated UUID
    newListing.id = localCreated.id;

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { error: insertError } = await supabase.from('listings').insert({
          id: newListing.id,
          owner_id: newListing.owner_id,
          title: newListing.title,
          category: newListing.category,
          condition: newListing.condition,
          mode: newListing.mode,
          price: newListing.price,
          exchange_preference: newListing.exchange_preference || null,
          description: newListing.description,
          status: newListing.status,
          created_at: newListing.created_at,
          updated_at: newListing.updated_at,
        });

        if (insertError) {
          console.warn('[listingService] Supabase insert warning:', insertError.message);
        } else if (newListing.images && newListing.images.length > 0) {
          const imageRows = newListing.images.map((url) => ({
            id: generateUUID(),
            listing_id: newListing.id,
            file_url: url,
            created_at: now,
          }));
          await supabase.from('listing_images').insert(imageRows);
        }
      } catch (err) {
        console.warn('[listingService] Supabase createListing error:', err);
      }
    }

    // 3. Broadcast new listing to all tabs/clients
    listingService.broadcastChange('INSERT', newListing);

    return newListing;
  },

  /**
   * Update listing status with owner authorization check
   */
  updateListingStatus: async (
    id: string,
    status: Listing['status'],
    actorUserId?: string
  ): Promise<Listing> => {
    const listing = dbService.getListingById(id);
    if (!listing) {
      throw new Error('Listing not found');
    }

    // Authorization: Only the owner can mark as completed
    if (status === 'COMPLETED' && actorUserId && listing.owner_id !== actorUserId) {
      throw new Error('Unauthorized: Only the listing owner can mark it as complete.');
    }

    // 1. Update in local store
    const updated = dbService.updateListingStatus(id, status);

    // 2. Update in Supabase
    if (isSupabaseConfigured) {
      try {
        const query = supabase
          .from('listings')
          .update({
            status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        // Enforce owner authorization in query when actor is provided
        if (actorUserId && (status === 'COMPLETED' || status === 'CLOSED')) {
          query.eq('owner_id', actorUserId);
        }

        const { error } = await query;
        if (error) {
          console.warn('[listingService] Supabase updateListingStatus warning:', error.message);
        }
      } catch (err) {
        console.warn('[listingService] Supabase update exception:', err);
      }
    }

    // 3. Broadcast status change
    listingService.broadcastChange('UPDATE', updated);

    return updated;
  },

  /**
   * Delete a listing with owner authorization check
   */
  deleteListing: async (id: string, actorUserId?: string): Promise<void> => {
    const listing = dbService.getListingById(id);
    if (!listing) return;

    if (actorUserId && listing.owner_id !== actorUserId) {
      throw new Error('Unauthorized: Only the listing owner can delete it.');
    }

    // 1. Delete from local store
    dbService.deleteListing(id);

    // 2. Delete from Supabase
    if (isSupabaseConfigured) {
      try {
        const query = supabase.from('listings').delete().eq('id', id);
        if (actorUserId) {
          query.eq('owner_id', actorUserId);
        }
        const { error } = await query;
        if (error) {
          console.warn('[listingService] Supabase deleteListing warning:', error.message);
        }
      } catch (err) {
        console.warn('[listingService] Supabase delete exception:', err);
      }
    }

    // 3. Broadcast deletion
    listingService.broadcastChange('DELETE', listing);
  },
};
