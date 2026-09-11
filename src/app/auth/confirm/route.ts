import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured, getURL } from '@/lib/supabase';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null;
  const next = requestUrl.searchParams.get('next') ?? '/marketplace';

  const origin =
    requestUrl.origin && requestUrl.origin !== 'null'
      ? requestUrl.origin
      : getURL().replace(/\/$/, '');

  if (isSupabaseConfigured) {
    if (code) {
      try {
        await supabase.auth.exchangeCodeForSession(code);
      } catch (err) {
        console.error('Auth code exchange error:', err);
      }
    } else if (token_hash && type) {
      try {
        await supabase.auth.verifyOtp({ token_hash, type });
      } catch (err) {
        console.error('Auth verifyOtp error:', err);
      }
    }
  }

  const redirectPath = next.startsWith('/') ? next : `/${next}`;
  return NextResponse.redirect(`${origin}${redirectPath}`);
}
