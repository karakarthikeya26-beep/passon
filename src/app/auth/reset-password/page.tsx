'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

type PageState = 'loading' | 'ready' | 'success' | 'error';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const { updatePassword } = useAuth();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // -------------------------------------------------------------------
  // On mount: exchange the ?code= for a browser session, OR wait for
  // the PASSWORD_RECOVERY event fired by Supabase's implicit flow.
  // -------------------------------------------------------------------
  const establishRecoverySession = useCallback(async () => {
    const code = searchParams.get('code');

    if (!isSupabaseConfigured) {
      // No Supabase — just show the form (local-only demo mode)
      setPageState('ready');
      return;
    }

    if (code) {
      console.log('[ResetPassword] Exchanging PKCE code for session...');
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('[ResetPassword] exchangeCodeForSession error:', error.message);
          setSessionError(
            'This password reset link is invalid or has expired. Please request a new one.'
          );
          setPageState('error');
        } else {
          console.log('[ResetPassword] Recovery session established via code exchange.');
          setPageState('ready');
        }
      } catch (err: any) {
        console.error('[ResetPassword] Unexpected error during code exchange:', err);
        setSessionError('Something went wrong. Please request a new reset link.');
        setPageState('error');
      }
      return;
    }

    // No ?code= param — check if there is already an active recovery session
    // (e.g., the user opened the link in a tab where they were already logged in,
    // or the link used the legacy implicit flow with a #access_token hash).
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      console.log('[ResetPassword] Existing session found, showing form.');
      setPageState('ready');
      return;
    }

    // Still nothing — subscribe to onAuthStateChange and wait briefly for
    // Supabase to emit PASSWORD_RECOVERY (implicit-flow fallback).
    console.log('[ResetPassword] No code param, subscribing to auth state changes...');
    const { data: listenerData } = supabase.auth.onAuthStateChange(
      (event: string, session: any) => {
      console.log('[ResetPassword] Auth event:', event);
      if (event === 'PASSWORD_RECOVERY' && session) {
        console.log('[ResetPassword] PASSWORD_RECOVERY event received.');
        setPageState('ready');
        listenerData.subscription.unsubscribe();
      }
    });

    // Give the implicit flow a few seconds to fire; if it doesn't, show an error.
    const timeout = setTimeout(() => {
      listenerData.subscription.unsubscribe();
      setSessionError(
        'No valid reset link was detected. The link may have expired, or you may have already used it. Please request a new one.'
      );
      setPageState('error');
    }, 5000);

    return () => {
      clearTimeout(timeout);
      listenerData.subscription.unsubscribe();
    };
  }, [searchParams]);

  useEffect(() => {
    let cleanupFn: (() => void) | undefined;

    const run = async () => {
      const result = await establishRecoverySession();
      if (typeof result === 'function') {
        cleanupFn = result;
      }
    };
    run();

    return () => {
      cleanupFn?.();
    };
  }, [establishRecoverySession]);

  // -------------------------------------------------------------------
  // Form submission
  // -------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newPassword || !confirmPassword) {
      setFormError('Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please check and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setSuccessMessage(res.message || 'Your password has been updated successfully.');
        setPageState('success');
      } else {
        setFormError(res.error || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------
  const Header = () => (
    <div className="text-center space-y-3">
      <div className="flex items-center justify-center gap-3">
        <img
          src="/passon-logo.png"
          alt="VNR Logo"
          className="h-10 w-auto object-contain shrink-0"
        />
        <span className="text-2xl font-black text-[#292524] tracking-tight">
          PassOn<span className="text-[#E9784B]">.</span>
        </span>
      </div>
      <div className="space-y-1">
        <h1 className="text-xl font-extrabold text-stone-900">Set New Password</h1>
        <p className="text-xs text-stone-500">
          Enter your new password below to update your account
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-sm max-w-md w-full p-8 space-y-6">
        <Header />

        {/* ── LOADING ── */}
        {pageState === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 className="w-8 h-8 animate-spin text-[#E9784B]" />
            <p className="text-sm text-stone-500 font-medium">Verifying your reset link…</p>
          </div>
        )}

        {/* ── INVALID / EXPIRED LINK ── */}
        {pageState === 'error' && (
          <div className="space-y-4">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-rose-900">Link Invalid or Expired</h2>
                <p className="text-xs text-rose-700 font-medium leading-relaxed">
                  {sessionError}
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full bg-[#E9784B] hover:bg-[#d66538] text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Request a New Reset Link</span>
              </Link>
            </div>
            <div className="text-center text-xs text-stone-500">
              Remembered your password?{' '}
              <Link href="/login" className="text-[#E9784B] font-semibold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {pageState === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-900">Password Updated!</h2>
              <p className="text-xs text-emerald-700 font-semibold">{successMessage}</p>
              <p className="text-xs text-emerald-600 pt-1">
                You can now log in to PassOn using your new password.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all"
              >
                <span>Go to Login Page</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ── FORM ── */}
        {pageState === 'ready' && (
          <>
            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700">New Password</label>
                  <span className="text-[11px] text-stone-400">Min. 6 characters</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pr-10 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    title={showNewPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 focus:outline-none p-1 rounded-lg transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
                    autoComplete="new-password"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pr-10 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 text-stone-400 hover:text-stone-600 focus:outline-none p-1 rounded-lg transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="update-password-btn"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password…</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-200">
              Remembered your password?{' '}
              <Link href="/login" className="text-[#E9784B] font-semibold hover:underline">
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
          <div className="bg-white border border-stone-200/80 rounded-3xl shadow-sm max-w-md w-full p-8 text-center space-y-4">
            <Loader2 className="w-8 h-8 text-[#E9784B] animate-spin mx-auto" />
            <p className="text-xs text-stone-500 font-medium">Loading password recovery...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
