import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

// Tab-isolated storage adapter using sessionStorage to allow independent accounts in different tabs
const getStorage = () => {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage;
  }
  return undefined;
};

export const getTabId = (): string => {
  if (typeof window === 'undefined') return 'server';
  try {
    let tabId = window.sessionStorage.getItem('passon_tab_instance_id');
    if (!tabId) {
      tabId = 'tab_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      window.sessionStorage.setItem('passon_tab_instance_id', tabId);
    }
    return tabId;
  } catch {
    return 'tab_fallback';
  }
};

export const getAuthStorageKey = (): string => {
  return `passon_auth_${getTabId()}`;
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: getStorage(),
        storageKey: getAuthStorageKey(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : (null as any);

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getURL = (): string => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== 'undefined' && window.location.origin ? window.location.origin : undefined) ??
    process.env.NEXT_PUBLIC_VERCEL_URL ??
    'http://localhost:3000';

  url = url.includes('http') ? url : `https://${url}`;
  url = url.endsWith('/') ? url : `${url}/`;
  return url;
};

export const getNeutralAvatarUrl = (name?: string, customUrl?: string): string => {
  if (customUrl && customUrl.trim() && !customUrl.includes('unsplash.com')) {
    return customUrl;
  }
  const cleanName = encodeURIComponent(name?.trim() || 'Student');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}&backgroundColor=E9784B,78716C,F6C7A9&textColor=ffffff`;
};