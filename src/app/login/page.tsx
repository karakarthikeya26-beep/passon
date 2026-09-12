'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { LogIn, UserCheck, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, switchDemoUser, users } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      router.push('/marketplace');
    } else {
      setError(
        result.error ||
          'User with this email was not found. Please sign up or click a quick demo account below.'
      );
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white border border-stone-200/80 rounded-3xl shadow-sm max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#E9784B] flex items-center justify-center text-white font-black text-2xl mx-auto shadow-sm">
            P
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900">Welcome back to PassOn</h1>
          <p className="text-xs text-stone-500">Sign in to your VNR student account</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rahul.s@vnrvjiet.in"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold py-3 rounded-xl text-sm shadow-sm transition-all hover:scale-[1.02]"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        </form>

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
