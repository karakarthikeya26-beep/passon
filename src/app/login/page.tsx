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
    const success = await login(email, password);
    if (success) {
      router.push('/marketplace');
    } else {
      setError('User with this email was not found. Please sign up or click a quick demo account below.');
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

        {/* Quick Demo Account Selector */}
        <div className="pt-4 border-t border-stone-200 space-y-3">
          <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider text-center">
            Or Sign in with Demo Accounts:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                switchDemoUser('user-rahul');
                router.push('/marketplace');
              }}
              className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 p-2.5 rounded-xl text-left transition-all"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
                alt="Rahul"
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-900 truncate">Rahul (Senior)</div>
                <div className="text-[10px] text-[#E9784B]">CSE 4th Year</div>
              </div>
            </button>

            <button
              onClick={() => {
                switchDemoUser('user-ananya');
                router.push('/marketplace');
              }}
              className="flex items-center gap-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 p-2.5 rounded-xl text-left transition-all"
            >
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100"
                alt="Ananya"
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
              <div className="truncate">
                <div className="text-xs font-bold text-stone-900 truncate">Ananya (Junior)</div>
                <div className="text-[10px] text-amber-600">CSE 2nd Year</div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-stone-500 pt-2">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[#E9784B] font-semibold hover:underline">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}
