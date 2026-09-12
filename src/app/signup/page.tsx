'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, Mail, AlertCircle, CheckCircle2, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [batch, setBatch] = useState('2nd Year (2024-2028)');
  const [gender, setGender] = useState<string>('Prefer not to say');
  const [bio, setBio] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  const branches = [
    'Computer Science & Engineering',
    'Electronics & Communication Engineering',
    'Electrical & Electronics Engineering',
    'Information Technology',
    'Mechanical Engineering',
    'Civil Engineering',
    'Automobile Engineering',
    'AI & Machine Learning',
    'Data Science',
    'Cyber Security',
  ];

  const batches = [
    '1st Year (2025-2029)',
    '2nd Year (2024-2028)',
    '3rd Year (2023-2027)',
    '4th Year (2022-2026)',
    'Postgraduate / M.Tech',
  ];

  const genders = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsAlreadyRegistered(false);

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please provide your name and email address.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signup(
        name,
        email,
        password,
        branch,
        batch,
        gender as any,
        bio
      );

      console.log('[SignupPage] Signup result:', result);

      if (result.success) {
        if (result.requiresVerification) {
          setRequiresVerification(true);
          setSuccessMessage(
            result.message ||
              'Account created successfully. Please check your email to verify your account.'
          );
        } else {
          router.push('/marketplace');
        }
      } else {
        setErrorMessage(result.error || 'Failed to create account.');
        if (result.isAlreadyRegistered) {
          setIsAlreadyRegistered(true);
        }
      }
    } catch (err: any) {
      console.error('[SignupPage] Exception during submission:', err);
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-sm max-w-lg w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#E9784B] flex items-center justify-center text-white font-black text-2xl mx-auto shadow-sm">
            P
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">Join PassOn Community</h1>
          <p className="text-xs text-stone-500">VNR VJIET Student Exchange & Knowledge Platform</p>
        </div>

        {/* Verification Success Screen */}
        {requiresVerification && successMessage ? (
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Mail className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-emerald-900">Verify Your Email</h2>
              <p className="text-sm font-semibold text-emerald-800">{successMessage}</p>
              <p className="text-xs text-emerald-700 leading-relaxed max-w-sm mx-auto">
                We sent a confirmation link to <span className="font-bold underline">{email}</span>. Click the link in your email to activate your account and log in.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
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
            {/* Error Notification */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-rose-900">{errorMessage}</p>
                    {isAlreadyRegistered && (
                      <p className="text-rose-700">
                        If you already have a PassOn account, please log in with your email and password.
                      </p>
                    )}
                  </div>
                </div>

                {isAlreadyRegistered && (
                  <div className="pt-1">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-1.5 font-bold text-[#E9784B] hover:underline bg-white px-3 py-1.5 rounded-lg border border-stone-200 text-xs shadow-2xs"
                    >
                      <span>Log in to your account</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Srikant Verma"
                  disabled={isSubmitting}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="srikant.v@vnrvjiet.in"
                  disabled={isSubmitting}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Batch / Year</label>
                  <select
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                  >
                    {batches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Gender <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                >
                  {genders.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Short Bio <span className="text-stone-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="e.g. 2nd year student interested in robotics and web projects..."
                  rows={2}
                  disabled={isSubmitting}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors disabled:opacity-60"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-stone-700">Password</label>
                  <span className="text-[11px] text-stone-400">Min. 6 characters</span>
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
                className="w-full flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
          Already have an account?{' '}
          <Link href="/login" className="text-[#E9784B] font-semibold hover:underline">
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
}
