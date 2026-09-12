'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await updatePassword(newPassword);
      if (res.success) {
        setSuccessMessage(res.message || 'Your password has been updated successfully.');
      } else {
        setErrorMessage(res.error || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while updating your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-sm max-w-md w-full p-8 space-y-6">
        {/* Header */}
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

        {/* Success Screen */}
        {successMessage ? (
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
        ) : (
          <>
            {/* Error Message */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700">New Password</label>
                  <span className="text-[11px] text-stone-400">Min. 6 characters</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
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
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isSubmitting}
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
                    {showConfirmPassword ? (
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
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-200">
          Remembered your password?{' '}
          <Link href="/login" className="text-[#E9784B] font-semibold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
