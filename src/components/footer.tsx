'use client';

import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FAF9F6] border-t border-[#E7E5E4] text-[#78716C] py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-3">
            <img
              src="/passon-logo.png"
              alt="PassOn Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="font-extrabold text-xl text-[#292524]">PassOn</span>
          </div>
          <p className="text-xs text-[#78716C] max-w-md leading-relaxed font-medium">
            PassOn is a student-to-student platform for VNR VJIET where useful items and practical knowledge move seamlessly from one student/batch to another.
          </p>
          <div className="text-[11px] text-[#E9784B] font-bold italic">
            “What you don't need. What someone else does. Pass it forward.”
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-[#292524] uppercase tracking-wider text-[11px]">Three Pillars</h4>
          <ul className="space-y-1.5 font-medium">
            <li>
              <Link href="/marketplace" className="hover:text-[#E9784B] transition-colors">
                Marketplace (Resource Exchange)
              </Link>
            </li>
            <li>
              <Link href="/looking-for" className="hover:text-[#E9784B] transition-colors">
                Looking For (Demand Posts)
              </Link>
            </li>
            <li>
              <Link href="/knowledge" className="hover:text-[#E9784B] transition-colors">
                Knowledge Shelf (Senior Tips)
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-[#292524] uppercase tracking-wider text-[11px]">Navigation</h4>
          <ul className="space-y-1.5 font-medium">
            <li>
              <Link href="/activity" className="hover:text-[#E9784B] transition-colors">
                My Activity & Exchanges
              </Link>
            </li>
            <li>
              <Link href="/matches" className="hover:text-[#E9784B] transition-colors">
                My Demand Matches
              </Link>
            </li>
            <li>
              <Link href="/profile" className="hover:text-[#E9784B] transition-colors">
                Student Profile
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-amber-700 transition-colors">
                Admin Moderation
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-[#E7E5E4] flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 font-medium">
        <div>© {new Date().getFullYear()} PassOn. Built for VNR VJIET Student Community.</div>
        <div>No payment gateways • Direct campus handover • Student-to-student trust</div>
      </div>
    </footer>
  );
};
