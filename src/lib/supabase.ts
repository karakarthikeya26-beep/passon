import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

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