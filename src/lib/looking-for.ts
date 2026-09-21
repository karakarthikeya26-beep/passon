import { LookingFor } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';
import { dbService } from './db';

export const lookingForService = {
  /**
   * Fetch all Looking For requests from Supabase and merge with local store
   */
  fetchLookingFor: async (): Promise<LookingFor[]> => {
    const localRequests = dbService.getLookingFor();

    if (!isSupabaseConfigured) {
      return localRequests;
    }

    try {
      const { data, error } = await supabase
        .from('looking_for')
        .select(`
          id,
          student_id,
          title,
          category,
          description,
          mode,
          status,
          created_at,
          updated_at,
          users:student_id (id, name, email, branch, batch, avatar_url, role, bio)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[lookingForService] Supabase fetch error (using local):', error.message);
        return localRequests;
      }

      if (data && Array.isArray(data)) {
        const remoteRequests: LookingFor[] = data.map((item: any) => {
          const studentObj = item.users || dbService.getUserById(item.student_id);
          return {
            id: item.id,
            student_id: item.student_id,
            title: item.title,
            category: item.category,
            description: item.description,
            mode: item.mode,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,
            student: studentObj,
          };
        });

        // Merge with local store
        const existingIds = new Set(remoteRequests.map((r) => r.id));
        const merged = [...remoteRequests];
        localRequests.forEach((local) => {
          if (!existingIds.has(local.id)) {
            merged.push(local);
          }
        });

        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (typeof window !== 'undefined') {
          localStorage.setItem('passon_looking_for', JSON.stringify(merged));
        }
        return merged;
      }
    } catch (err) {
      console.warn('[lookingForService] Error syncing looking_for with Supabase:', err);
    }

    return localRequests;
  },

  /**
   * Create a new Looking For request
   */
  createLookingFor: async (
    data: Omit<LookingFor, 'id' | 'created_at' | 'updated_at' | 'status'>
  ): Promise<LookingFor> => {
    // 1. Save locally immediately
    const req = dbService.createLookingFor(data);

    // 2. Persist to Supabase in background
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('looking_for').insert({
          id: req.id,
          student_id: req.student_id,
          title: req.title,
          category: req.category,
          description: req.description,
          mode: req.mode,
          status: req.status,
          created_at: req.created_at,
          updated_at: req.updated_at,
        });

        if (error) {
          console.warn('[lookingForService] Supabase insert warning (persisted locally):', error.message);
        }
      } catch (err) {
        console.warn('[lookingForService] Supabase insert error:', err);
      }
    }

    return req;
  },

  /**
   * Update the status of a Looking For request
   */
  updateLookingForStatus: async (
    id: string,
    status: LookingFor['status']
  ): Promise<LookingFor> => {
    const updated = dbService.updateLookingForStatus(id, status);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('looking_for')
          .update({ status, updated_at: updated.updated_at })
          .eq('id', id);
      } catch (err) {
        console.warn('[lookingForService] Supabase update error:', err);
      }
    }

    return updated;
  },
};
