'use client';

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Settings, Bell, Shield, Moon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { currentUser } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Profile</span>
      </Link>

      <div className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        <div className="space-y-1 pb-4 border-b border-stone-200">
          <h1 className="text-2xl font-extrabold text-stone-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#E9784B]" />
            Account Settings
          </h1>
          <p className="text-xs text-stone-500">Manage notifications, privacy, and campus preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#E9784B]" /> In-App Notifications
            </h3>
            <p className="text-xs text-stone-500">
              Receive alerts for interest requests, accepted handovers, and Looking For matches.
            </p>
            <div className="flex items-center justify-between pt-2 text-xs text-stone-700">
              <span>Enable Interest Alerts</span>
              <input type="checkbox" defaultChecked className="rounded border-stone-300 text-[#E9784B] focus:ring-[#E9784B]" />
            </div>
          </div>

          <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Privacy & Contact Safety
            </h3>
            <p className="text-xs text-stone-500">
              PassOn protects your privacy. Contact details and phone numbers are never publicly exposed. All interactions happen through in-app campus handover coordination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
