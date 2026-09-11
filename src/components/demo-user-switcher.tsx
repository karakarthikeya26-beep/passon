'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, ShieldCheck, ChevronUp, ChevronDown } from 'lucide-react';

export const DemoUserSwitcher: React.FC = () => {
  const { currentUser, users, switchDemoUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white/95 border border-stone-300 text-stone-900 rounded-2xl shadow-xl backdrop-blur-md overflow-hidden transition-all duration-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold hover:bg-stone-50 transition-colors w-full text-left"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E9784B] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E9784B]"></span>
          </span>
          <span className="text-[#E9784B] font-extrabold uppercase tracking-wider">Demo Switcher</span>
          <div className="flex items-center gap-1.5 text-stone-600 ml-1">
            <span className="font-bold text-stone-900">{currentUser?.name || 'Guest'}</span>
            <span className="text-[10px] bg-[#FFF1E8] text-[#E9784B] px-2 py-0.5 rounded-full border border-[#F6C7A9] font-bold">
              {currentUser?.batch?.split(' ')[0] || currentUser?.role}
            </span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4 text-stone-400 ml-auto" /> : <ChevronUp className="w-4 h-4 text-stone-400 ml-auto" />}
        </button>

        {isOpen && (
          <div className="p-3 border-t border-stone-200 space-y-1.5 max-h-72 overflow-y-auto w-72 bg-white">
            <p className="text-[10px] text-stone-500 font-bold px-2 py-1 uppercase tracking-wider">
              Select student account to test flow:
            </p>
            {users.map((u) => {
              const isSelected = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    switchDemoUser(u.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all ${
                    isSelected
                      ? 'bg-[#E9784B] text-white font-bold shadow-sm'
                      : 'hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <img
                      src={u.avatar_url}
                      alt={u.name}
                      className="w-7 h-7 rounded-full object-cover border border-stone-200 shrink-0"
                    />
                    <div className="truncate">
                      <div className="truncate font-bold flex items-center gap-1">
                        {u.name}
                        {u.role === 'admin' && <ShieldCheck className="w-3 h-3 text-amber-500 shrink-0" />}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-stone-500'}`}>
                        {u.branch ? `${u.branch.split(' ')[0]} • ${u.batch}` : u.role}
                      </div>
                    </div>
                  </div>
                  {isSelected && <UserCheck className="w-4 h-4 shrink-0 text-white ml-2" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
