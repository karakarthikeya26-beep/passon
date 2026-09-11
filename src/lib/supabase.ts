import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

if (!isSupabaseConfigured) {
  throw new Error(
    'Supabase is not configured. Check your .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);