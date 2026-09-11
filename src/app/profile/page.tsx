'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Gender } from '../../types';
import { Save, ShieldCheck } from 'lucide-react';
import { getNeutralAvatarUrl } from '../../lib/supabase';
import Link from 'next/link';

export default function ProfilePage() {
  const { currentUser, updateProfile } = useAuth();

  const [name, setName] = useState(currentUser?.name || '');
  const [branch, setBranch] = useState(currentUser?.branch || 'Computer Science & Engineering');
  const [batch, setBatch] = useState(currentUser?.batch || '4th Year (2022-2026)');
  const [gender, setGender] = useState<Gender>(currentUser?.gender || 'Prefer not to say');
  const [bio, setBio] = useState(currentUser?.bio || '');

  const genders: Gender[] = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">Please Log In</h2>
        <Link href="/login" className="inline-block bg-[#E9784B] text-white font-bold text-xs px-4 py-2 rounded-xl">
          Log In
        </Link>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      branch,
      batch,
      gender,
      bio: bio.trim(),
      avatar_url: currentUser.avatar_url || getNeutralAvatarUrl(name.trim()),
    });
  };

  const avatarSrc = currentUser.avatar_url || getNeutralAvatarUrl(currentUser.name);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="flex items-center gap-4 pb-6 border-b border-stone-200">
          <img
            src={avatarSrc}
            alt={currentUser.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-[#E9784B] shadow-sm bg-stone-100"
          />
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900 flex items-center gap-2">
              {currentUser.name}
              {currentUser.role === 'admin' && (
                <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> ADMIN
                </span>
              )}
            </h1>
            <div className="text-xs text-stone-500">{currentUser.email}</div>
            <div className="text-xs text-[#E9784B] font-semibold mt-0.5">
              {currentUser.branch} • {currentUser.batch}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Edit Student Profile Details</h2>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Branch / Department</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Batch / Year</label>
              <input
                type="text"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Gender (Optional)</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors cursor-pointer"
            >
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Bio / Campus Interests</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 focus:outline-none focus:border-[#E9784B] focus:bg-white transition-colors"
            />
          </div>

          <div className="pt-4 border-t border-stone-200 flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-sm transition-all hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
