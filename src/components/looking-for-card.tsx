'use client';

import React from 'react';
import Link from 'next/link';
import { LookingFor } from '../types';
import { useAuth } from '../context/AuthContext';
import { SearchCode, ArrowRight, User } from 'lucide-react';

interface LookingForCardProps {
  request: LookingFor;
}

export const LookingForCard: React.FC<LookingForCardProps> = ({ request }) => {
  const { currentUser } = useAuth();
  const studentName = request.student?.name || 'VNR Student';
  const studentBranch = request.student?.branch ? request.student.branch.split(' ')[0] : '';
  const studentBatch = request.student?.batch ? request.student.batch.split(' ')[0] : '';

  const isOwner = currentUser?.id === request.student_id;

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
          <span className="text-stone-500 text-[11px]">{studentBranch} {studentBatch}</span>
        </div>

        {isOwner ? (
          <Link
            href="/matches"
            className="flex items-center gap-1 bg-[#E9784B] hover:bg-[#d8673a] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <SearchCode className="w-3.5 h-3.5" />
            <span>My Matches</span>
          </Link>
        ) : (
          <Link
            href={`/marketplace?category=${encodeURIComponent(request.category)}`}
            className="flex items-center gap-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          >
            <span>Offer Item</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};
