'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Eye, EyeOff, KeyRound, Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Forgot password mode states
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        router.push('/marketplace');
      } else {
        setError(
          result.error ||
            'User with this email was not found. Please sign up or check your credentials.'
        );
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetStatus(null);

    const cleanEmail = resetEmail.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await resetPasswordForEmail(cleanEmail);
      if (res.success) {
        setResetStatus({
          success: true,
          message: res.message || 'Password reset link sent. Please check your email.',
        });
      } else {
        setError(res.error || 'Could not send password reset email. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-sm max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#E9784B] flex items-center justify-center text-white font-black text-2xl mx-auto shadow-sm">
            P
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">
            {isForgotPasswordMode ? 'Reset Your Password' : 'Welcome back to PassOn'}
          </h1>
          <p className="text-xs text-stone-500">
            {isForgotPasswordMode
              ? 'Enter your registered email to receive a password reset link'
              : 'Sign in to your VNR student account'}
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {isForgotPasswordMode ? (
          /* Forgot Password View */
          <div className="space-y-4">
            {resetStatus?.success ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-emerald-900">Check Your Inbox</h3>
                  <p className="text-xs text-emerald-700 font-semibold">{resetStatus.message}</p>
                  <p className="text-[11px] text-emerald-600 pt-1">
                    We sent instructions to <span className="font-bold underline">{resetEmail}</span>. Click the link in the email to set a new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(false);
                    setResetStatus(null);
                    setError('');
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="srikant.v@vnrvjiet.in"
                      disabled={isSubmitting}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending reset link...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Send reset link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(false);
                    setError('');
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 font-semibold pt-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Sign In View */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul.s@vnrvjiet.in"
                disabled={isSubmitting}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-stone-700">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPasswordMode(true);
                    setResetEmail(email);
                    setError('');
                  }}
                  className="text-xs font-bold text-[#E9784B] hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pr-10 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 text-stone-400 hover:text-stone-600 focus:outline-none p-1 rounded-lg transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] disabled:opacity-70 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-200">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#E9784B] font-semibold hover:underline">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}
