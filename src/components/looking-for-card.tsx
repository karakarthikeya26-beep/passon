'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LookingFor } from '../types';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { SearchCode, ArrowRight, User, MessageSquare, Loader2, Check } from 'lucide-react';

interface LookingForCardProps {
  request: LookingFor;
}

export const LookingForCard: React.FC<LookingForCardProps> = ({ request }) => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { offerItem, messages, showToast } = useApp();
  const [isOffering, setIsOffering] = useState(false);

  const studentName = request.student?.name || 'VNR Student';
  const studentBranch = request.student?.branch ? request.student.branch.split(' ')[0] : '';
  const studentBatch = request.student?.batch ? request.student.batch.split(' ')[0] : '';

  const isOwner = currentUser?.id === request.student_id;
  const threadId = currentUser ? `lf_${request.id}_${currentUser.id}` : '';
  const hasOffered = currentUser
    ? messages.some((m) => m.interest_id === threadId)
    : false;

  const handleOfferClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Auth check: must be logged in
    if (!currentUser) {
      showToast('Please log in to offer an item.', 'info');
      router.push('/login');
      return;
    }

    // 2. Prevent offering on own post
    if (isOwner) {
      showToast('You cannot offer an item to your own request.', 'error');
      return;
    }

    // 3. Prevent offering on closed/matched posts
    if (request.status !== 'OPEN') {
      showToast('This Looking For request is no longer open.', 'error');
      return;
    }

    // 4. If already offered, open the existing conversation without duplicate messages or notifications
    if (hasOffered) {
      router.push(`/matches?tab=conversations&conversation=${threadId}`);
      return;
    }

    // 5. Submit offer
    setIsOffering(true);
    try {
      const convId = await offerItem(request);
      router.push(`/matches?tab=conversations&conversation=${convId}`);
    } catch (err: any) {
      console.error('[LookingForCard] Offer error:', err);
      // Stay on current page and restore button on failure
      setIsOffering(false);
      showToast(err.message || 'Failed to submit offer. Please try again.', 'error');
    }
  };

  return (
    <div className="bg-white border border-[#E7E5E4] hover:border-sky-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="bg-sky-50 text-sky-800 border border-sky-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
            {request.category}
          </span>

          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
              request.status === 'OPEN'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : request.status === 'MATCHED'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : 'bg-stone-100 text-stone-600 border-stone-200'
            }`}
          >
            {request.status}
          </span>
        </div>

        <h3 className="font-bold text-base text-[#292524] hover:text-sky-700 transition-colors">
          {request.title}
        </h3>

        <p className="text-xs text-[#78716C] leading-relaxed line-clamp-3 font-normal">
          {request.description}
        </p>
      </div>

      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
          <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="font-bold text-[#292524]">{studentName.split(' ')[0]}</span>
          <span className="text-stone-300">•</span>
          <span className="text-stone-500 text-[11px]">
            {studentBranch} {studentBatch}
          </span>
        </div>

        {isOwner ? (
          <Link
            href="/matches"
            className="flex items-center gap-1 bg-[#E9784B] hover:bg-[#d8673a] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <SearchCode className="w-3.5 h-3.5" />
            <span>My Matches</span>
          </Link>
        ) : request.status !== 'OPEN' ? (
          <span className="text-xs font-bold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-xl">
            Closed
          </span>
        ) : hasOffered ? (
          <button
            onClick={handleOfferClick}
            className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            title="You have already offered help. Click to open conversation."
          >
            <Check className="w-3.5 h-3.5 text-sky-600" />
            <span>Offered • Chat</span>
          </button>
        ) : (
          <button
            onClick={handleOfferClick}
            disabled={isOffering}
            className="flex items-center gap-1.5 bg-[#E9784B] hover:bg-[#d8673a] disabled:bg-stone-300 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isOffering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Offering...</span>
              </>
            ) : (
              <>
                <span>Offer Item</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
