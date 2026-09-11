'use client';

import React from 'react';
import { ListingStatus } from '../types';

interface BadgeProps {
  status: ListingStatus;
  size?: 'sm' | 'md';
}

export const ListingStatusBadge: React.FC<BadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'INTERESTED':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'RESERVED':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'HANDOVER_PLANNED':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'COMPLETED':
        return 'bg-stone-100 text-stone-700 border-stone-200';
      case 'CLOSED':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'AVAILABLE':
        return 'AVAILABLE';
      case 'INTERESTED':
        return 'INTEREST SENT';
      case 'RESERVED':
        return 'RESERVED';
      case 'HANDOVER_PLANNED':
        return 'HANDOVER PLANNED';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'CLOSED':
        return 'CLOSED';
      default:
        return status;
    }
  };

  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`font-bold uppercase tracking-wider rounded-lg border backdrop-blur-sm shadow-xs inline-flex items-center gap-1.5 ${getBadgeStyle()} ${sizeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {getLabel()}
    </span>
  );
};
