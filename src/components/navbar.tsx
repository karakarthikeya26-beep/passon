'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getNeutralAvatarUrl } from '../lib/supabase';
import { SearchModal } from './search-modal';
import {
  Search, Bell, User, PlusCircle, BookOpen, SearchCode,
  Package, Bookmark, Settings, LogOut, ShieldCheck,
  Menu, X, Check, Sparkles
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadMessageCount } = useApp();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const unreadNotifs = notifications.filter((n) => !n.read);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'SwapSpot', href: '/marketplace' },
    { name: 'Looking For', href: '/looking-for' },
    { name: 'Knowledge Shelf', href: '/knowledge' },
    { name: 'Matches', href: '/matches' },
    { name: 'Activity', href: '/activity' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E7E5E4] text-[#292524]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <img
                src="/passon-logo.png"
                alt="PassOn Logo"
                className="h-8 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105 shrink-0"
              />
              <div className="h-8 w-[1px] bg-stone-200 hidden xs:block" />
              <div className="flex flex-col">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#292524] group-hover:text-[#E9784B] transition-colors leading-tight">
                  PassOn
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-[#E9784B] tracking-wider uppercase leading-none mt-0.5 whitespace-nowrap">
                  VNR Campus Community
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 ml-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const isMatches = link.name === 'Matches';

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#FFF1E8] text-[#E9784B] font-bold border border-[#F6C7A9]/60'
                        : 'text-[#78716C] hover:text-[#292524] hover:bg-stone-100/70'
                    }`}
                  >
                    <span>{link.name}</span>
                    {isMatches && unreadMessageCount > 0 && (
                      <span className="bg-[#E9784B] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                        {unreadMessageCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 bg-stone-100/80 hover:bg-stone-100 border border-[#E7E5E4] text-[#78716C] px-3.5 py-2 rounded-xl text-xs font-medium transition-all hover:border-[#E9784B]/40"
              title="Search Marketplace, Looking For, and Knowledge"
            >
              <Search className="w-4 h-4 text-[#E9784B]" />
              <span className="hidden sm:inline text-stone-500">Search VNR...</span>
              <kbd className="hidden sm:inline bg-white border border-stone-200 px-1.5 py-0.5 rounded text-[10px] text-stone-400">
                ⌘K
              </kbd>
            </button>

            {/* Post CTA Quick Button */}
            <Link
              href="/listing/new"
              className="hidden sm:flex items-center gap-1.5 bg-[#E9784B] hover:bg-[#d8673a] text-white px-4 py-2 rounded-[12px] text-xs font-bold shadow-sm transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Item</span>
            </Link>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl bg-stone-100/80 hover:bg-stone-200/80 text-stone-700 border border-[#E7E5E4] transition-all"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#E9784B] text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E7E5E4] rounded-2xl shadow-xl p-4 z-50 animate-in fade-in">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                    <h3 className="font-bold text-sm text-[#292524] flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#E9784B]" />
                      Notifications
                    </h3>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-[#E9784B] font-semibold hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-stone-500 text-center py-6">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.link) router.push(n.link);
                            setIsNotifOpen(false);
                          }}
                          className={`p-3 rounded-xl text-xs cursor-pointer transition-all border ${
                            !n.read
                              ? 'bg-[#FFF1E8] border-[#F6C7A9] text-[#292524] font-medium'
                              : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span>{n.message}</span>
                            {!n.read && <span className="w-2 h-2 rounded-full bg-[#E9784B] shrink-0 mt-1" />}
                          </div>
                          <span className="text-[10px] text-stone-400 mt-1 block">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            {currentUser ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-stone-100/80 hover:bg-stone-200/80 border border-[#E7E5E4] transition-all text-xs text-left"
                >
                  <img
                    src={currentUser.avatar_url || getNeutralAvatarUrl(currentUser.name)}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-[#E9784B]/40 bg-stone-100"
                  />
                  <span className="hidden md:inline font-bold text-[#292524] truncate max-w-[100px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E7E5E4] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in">
                    <div className="p-3 border-b border-stone-100 mb-1">
                      <div className="font-extrabold text-sm text-[#292524] flex items-center gap-1.5">
                        {currentUser.name}
                        {currentUser.role === 'admin' && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 truncate">{currentUser.email}</div>
                      <div className="text-[11px] text-[#E9784B] mt-1 font-semibold">
                        {currentUser.branch ? `${currentUser.branch.split(' ')[0]} • ${currentUser.batch}` : ''}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#292524] hover:bg-stone-100 transition-colors"
                      >
                        <User className="w-4 h-4 text-[#E9784B]" /> My Profile
                      </Link>
                      <Link
                        href="/activity?tab=listings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#292524] hover:bg-stone-100 transition-colors"
                      >
                        <Package className="w-4 h-4 text-emerald-600" /> My Listings
                      </Link>
                      <Link
                        href="/activity?tab=requests"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#292524] hover:bg-stone-100 transition-colors"
                      >
                        <SearchCode className="w-4 h-4 text-sky-600" /> My Requests & Matches
                      </Link>
                      <Link
                        href="/activity?tab=saved"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#292524] hover:bg-stone-100 transition-colors"
                      >
                        <Bookmark className="w-4 h-4 text-amber-600" /> Saved Items
                      </Link>
                      <Link
                        href="/activity?tab=knowledge"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#292524] hover:bg-stone-100 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-indigo-600" /> Knowledge Contributions
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#292524] hover:bg-stone-100 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-stone-500" /> Settings
                      </Link>
                      {currentUser.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" /> Admin Dashboard
                        </Link>
                      )}
                      <div className="pt-1 mt-1 border-t border-stone-100">
                        <button
                          onClick={() => {
                            logout();
                            setIsProfileOpen(false);
                            router.push('/login');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#E9784B] hover:bg-[#d8673a] text-white transition-colors shadow-sm"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 bg-white px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const isMatches = link.name === 'Matches';
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold ${
                    pathname === link.href ? 'bg-[#FFF1E8] text-[#E9784B]' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>{link.name}</span>
                  {isMatches && unreadMessageCount > 0 && (
                    <span className="bg-[#E9784B] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {unreadMessageCount} new
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-stone-200 flex flex-col gap-2">
              <Link
                href="/listing/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-[#E9784B] text-white font-bold rounded-xl text-xs"
              >
                List Item
              </Link>
              <Link
                href="/looking-for/new"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-stone-100 text-stone-800 font-bold rounded-xl text-xs"
              >
                Post Request
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Overlay Modal */}
      {isSearchOpen && <SearchModal onClose={() => setIsSearchOpen(false)} />}
    </>
  );
};
