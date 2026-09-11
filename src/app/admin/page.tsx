'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck, Users, Package, SearchCode, BookOpen, Flag,
  CheckCircle2, Trash2, ShieldAlert, ArrowRight, Check, X
} from 'lucide-react';

export default function AdminPage() {
  const { listings, lookingFor, knowledgePosts, reports, deleteListing, updateReportStatus } = useApp();
  const { currentUser, users, switchDemoUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'listings' | 'knowledge'>('overview');

  const isAdmin = currentUser?.role === 'admin';

  const pendingReports = reports.filter((r) => r.status === 'PENDING');
  const activeListings = listings.filter((l) => l.status === 'AVAILABLE');
  const openRequests = lookingFor.filter((r) => r.status === 'OPEN');
  const completedListings = listings.filter((l) => l.status === 'COMPLETED');

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-900">Admin Access Restricted</h1>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            You are currently signed in as <span className="text-stone-900 font-semibold">{currentUser?.name || 'Guest'}</span>. Switch to the VNR Admin Moderator account below to test moderation.
          </p>
        </div>
        <button
          onClick={() => switchDemoUser('user-admin')}
          className="bg-[#E9784B] hover:bg-[#d66538] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition-all hover:scale-[1.02]"
        >
          Switch to VNR Admin Moderator Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#FFF1E8] border border-[#F6C7A9] text-[#E9784B] text-xs font-bold px-3 py-1 rounded-full mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>VNR Platform Moderation Console</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-stone-500 mt-1">Review community reports, monitor activity, and manage inappropriate content.</p>
        </div>

        <div className="text-xs text-stone-600 bg-white px-4 py-2 rounded-xl border border-stone-200 shadow-sm">
          Signed in as <span className="text-[#E9784B] font-bold">{currentUser.name}</span>
        </div>
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-stone-200/80 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-600" /> Total Users
          </div>
          <div className="text-2xl font-extrabold text-stone-900">{users.length}</div>
        </div>

        <div className="bg-white border border-stone-200/80 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <Package className="w-3.5 h-3.5 text-teal-600" /> Active Listings
          </div>
          <div className="text-2xl font-extrabold text-teal-700">{activeListings.length}</div>
        </div>

        <div className="bg-white border border-stone-200/80 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <SearchCode className="w-3.5 h-3.5 text-sky-600" /> Open Requests
          </div>
          <div className="text-2xl font-extrabold text-sky-700">{openRequests.length}</div>
        </div>

        <div className="bg-white border border-stone-200/80 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Knowledge Posts
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">{knowledgePosts.length}</div>
        </div>

        <div className="bg-white border border-stone-200/80 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Completed
          </div>
          <div className="text-2xl font-extrabold text-purple-700">{completedListings.length}</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-1 shadow-sm">
          <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
            <Flag className="w-3.5 h-3.5 text-rose-600" /> Pending Reports
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{pendingReports.length}</div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'overview' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 bg-white border border-stone-200'
          }`}
        >
          Activity Overview
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl relative transition-all ${
            activeTab === 'reports' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 bg-white border border-stone-200'
          }`}
        >
          Content Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'listings' ? 'bg-[#E9784B] text-white font-bold shadow-sm' : 'text-stone-600 bg-white border border-stone-200'
          }`}
        >
          All Listings ({listings.length})
        </button>
      </div>

      {/* Reports Section */}
      {(activeTab === 'overview' || activeTab === 'reports') && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-500" />
            User Content Reports
          </h2>

          {reports.length === 0 ? (
            <p className="text-xs text-stone-500 bg-white p-6 rounded-2xl border border-stone-200 text-center shadow-sm">
              No content reports submitted. Community standards are clean!
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-stone-200/80 rounded-2xl p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-rose-50 text-rose-700 font-bold px-2.5 py-1 rounded-lg border border-rose-200 uppercase">
                        {report.target_type} report
                      </span>
                      <span className="text-stone-900 font-semibold">Reason: {report.reason}</span>
                    </div>

                    <span
                      className={`font-bold px-2.5 py-1 rounded-lg ${
                        report.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-700'
                          : report.status === 'REVIEWED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {report.description && (
                    <p className="text-xs text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 italic">
                      "{report.description}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-stone-500">
                      Reported by: <span className="text-stone-900 font-semibold">{report.reporter?.name || 'Student'}</span>
                    </span>

                    {report.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateReportStatus(report.id, 'REVIEWED')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve & Approve
                        </button>
                        <button
                          onClick={() => updateReportStatus(report.id, 'DISMISSED')}
                          className="bg-stone-100 text-stone-700 px-3 py-1.5 rounded-xl hover:bg-stone-200 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
