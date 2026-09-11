'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { getNeutralAvatarUrl } from '../../../lib/supabase';
import { KnowledgeCard } from '../../../components/knowledge-card';
import { ReportModal } from '../../../components/report-modal';
import {
  BookOpen, ThumbsUp, Bookmark, ArrowLeft, User, Share2, ShieldAlert, Check
} from 'lucide-react';

export default function KnowledgeDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const { knowledgePosts, savedKnowledge, toggleSaveKnowledge, markKnowledgeUseful } = useApp();
  const { currentUser } = useAuth();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const post = knowledgePosts.find((p) => p.id === postId);

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-stone-900">Knowledge Post Not Found</h2>
        <p className="text-xs text-stone-500">This post may have been removed or archived.</p>
        <Link href="/knowledge" className="inline-block bg-[#E9784B] text-white font-bold text-xs px-4 py-2 rounded-xl">
          Back to Knowledge Shelf
        </Link>
      </div>
    );
  }

  const isSaved = currentUser ? savedKnowledge.some((s) => s.knowledge_post_id === post.id) : false;
  const author = post.author;

  const relatedPosts = knowledgePosts
    .filter((p) => p.id !== post.id && p.category === post.category)
    .slice(0, 3);

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Button */}
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Knowledge Shelf</span>
      </Link>

      {/* Main Post Container */}
      <article className="bg-white border border-stone-200/80 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
        {/* Header Metadata */}
        <div className="space-y-4 pb-6 border-b border-stone-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="bg-[#FFF1E8] text-[#E9784B] border border-[#F6C7A9] px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#E9784B]" />
              {post.category}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Share link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied Link' : 'Share'}</span>
              </button>

              <button
                onClick={() => toggleSaveKnowledge(post.id)}
                className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
                  isSaved
                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                    : 'bg-stone-100 border-stone-200 text-stone-700 hover:bg-stone-200'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current text-amber-500" />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight">
            {post.title}
          </h1>

          {/* Author Card */}
          <div className="flex items-center gap-3 pt-2">
            <img
              src={author?.avatar_url || getNeutralAvatarUrl(author?.name || 'VNR Senior')}
              alt={author?.name}
              className="w-11 h-11 rounded-full object-cover border border-[#F6C7A9] bg-stone-100"
            />
            <div>
              <div className="font-bold text-sm text-stone-900 flex items-center gap-2">
                {author?.name || 'VNR Senior'}
              </div>
              <div className="text-xs text-stone-500">
                {author?.branch} • <span className="text-[#E9784B] font-medium">{author?.batch}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="prose max-w-none text-stone-800 text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal space-y-4">
          {post.content}
        </div>

        {/* Tags & Feedback bar */}
        <div className="pt-6 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag, idx) => (
              <span key={idx} className="bg-stone-100 text-stone-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => markKnowledgeUseful(post.id)}
              className="flex items-center gap-2 bg-[#E9784B] hover:bg-[#d66538] text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all hover:scale-[1.02]"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Mark as Useful ({post.useful_count})</span>
            </button>

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="p-2 text-stone-400 hover:text-rose-500 transition-colors"
              title="Report post"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>
      </article>

      {/* Related Knowledge Section */}
      {relatedPosts.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#E9784B]" />
            Related Knowledge Posts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rPost) => (
              <KnowledgeCard key={rPost.id} post={rPost} />
            ))}
          </div>
        </section>
      )}

      {isReportModalOpen && (
        <ReportModal
          targetType="knowledge"
          targetId={post.id}
          targetTitle={post.title}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
}
