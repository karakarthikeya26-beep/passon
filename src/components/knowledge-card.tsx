'use client';

import React from 'react';
import Link from 'next/link';
import { KnowledgePost } from '../types';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { BookOpen, ThumbsUp, Bookmark, ArrowRight, User } from 'lucide-react';

interface KnowledgeCardProps {
  post: KnowledgePost;
}

export const KnowledgeCard: React.FC<KnowledgeCardProps> = ({ post }) => {
  const { savedKnowledge, toggleSaveKnowledge, markKnowledgeUseful } = useApp();
  const { currentUser } = useAuth();

  const isSaved = currentUser
    ? savedKnowledge.some((s) => s.knowledge_post_id === post.id)
    : false;

  const authorName = post.author?.name || 'VNR Senior';
  const authorBranch = post.author?.branch ? post.author.branch.split(' ')[0] : 'VNR';
  const authorBatch = post.author?.batch ? post.author.batch.split(' ')[0] : 'Senior';

  return (
    <div className="bg-white border border-[#E7E5E4] hover:border-indigo-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4 group">
      <div className="space-y-3">
        {/* Top bar with category badge and save */}
        <div className="flex items-center justify-between">
          <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            {post.category}
          </span>

          <button
            onClick={() => toggleSaveKnowledge(post.id)}
            className={`p-1.5 rounded-lg border transition-all ${
              isSaved
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'text-stone-400 hover:text-stone-700 border-stone-200 hover:bg-stone-50'
            }`}
            title={isSaved ? 'Unsave post' : 'Save post'}
          >
            <Bookmark className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Post Title */}
        <Link href={`/knowledge/${post.id}`}>
          <h3 className="font-bold text-base text-[#292524] group-hover:text-indigo-700 transition-colors leading-snug">
            {post.title}
          </h3>
        </Link>

        {/* Content excerpt */}
        <p className="text-xs text-[#78716C] leading-relaxed line-clamp-3 font-normal">
          {post.content.replace(/[#*`]/g, '')}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {post.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="bg-stone-100 text-stone-700 text-[10px] px-2 py-0.5 rounded-md font-semibold">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Author context & Action */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
          <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="font-bold text-[#292524]">{authorName.split(' ')[0]}</span>
          <span className="text-stone-300">•</span>
          <span className="text-stone-500 text-[11px]">{authorBranch} {authorBatch}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => markKnowledgeUseful(post.id)}
            className="flex items-center gap-1 bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-800 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border border-stone-200"
            title="Mark as Useful"
          >
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{post.useful_count}</span>
          </button>

          <Link
            href={`/knowledge/${post.id}`}
            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Read Full Post"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
