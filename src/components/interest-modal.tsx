'use client';

import React, { useState } from 'react';
import { Listing } from '../types';
import { useApp } from '../context/AppContext';
import { MessageSquare, X, Send } from 'lucide-react';

interface InterestModalProps {
  listing: Listing;
  onClose: () => void;
}

export const InterestModal: React.FC<InterestModalProps> = ({ listing, onClose }) => {
  const { expressInterest } = useApp();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      expressInterest(listing.id, message.trim());
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-stone-900">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FFF1E8] border border-[#F6C7A9] flex items-center justify-center text-[#E9784B]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#292524]">Express Interest</h3>
              <p className="text-xs text-stone-500 font-medium">Tell the owner why you're interested</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 flex items-center gap-3">
            <img src={listing.images[0]} alt={listing.title} className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <h4 className="text-sm font-bold text-[#292524]">{listing.title}</h4>
              <p className="text-xs text-stone-500 font-medium">
                Listed by {listing.owner?.name} • {listing.mode} ({listing.price ? `₹${listing.price}` : 'Free'})
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              Message to Owner <span className="text-stone-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Hi! I need this scientific calculator for my M3 lab exams this semester. When are you free for a handover?"
              rows={4}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#E9784B] transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d8673a] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-102"
            >
              <Send className="w-4 h-4" />
              <span>Send Interest</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
