/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Post } from '../../types';
import { Eye, ThumbsUp, Calendar, Download, Sparkles } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  return (
    <article
      id={`post-card-${post.slug}`}
      onClick={onClick}
      className="group relative bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      {/* Thumbnail Header with Category Badge */}
      <div>
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
          <img
            src={post.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'}
            alt={post.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider shadow-sm">
              {post.categoryName || 'General'}
            </span>
          </div>

          {/* Ad Requirement Badge */}
          {post.requiredAds > 0 ? (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 backdrop-blur text-amber-300 border border-amber-500/30 text-[10px] font-bold shadow-sm flex items-center gap-1">
                <span>{post.requiredAds} Ad Step{post.requiredAds > 1 ? 's' : ''}</span>
              </span>
            </div>
          ) : (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 backdrop-blur text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shadow-sm flex items-center gap-1">
                <span>Direct Unlock</span>
              </span>
            </div>
          )}
        </div>

        {/* Post Metadata & Title */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-500 mb-2">
            <Calendar className="w-3 h-3" />
            <span>{post.publishDate || new Date(post.createdAt).toLocaleDateString()}</span>
            {post.featured && (
              <>
                <span>•</span>
                <span className="text-amber-500 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              </>
            )}
          </div>

          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug mb-2">
            {post.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {post.description}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {post.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[10px] font-medium"
                >
                  #{tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Metrics & Action */}
      <div className="px-4 sm:p-5 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" title="Total Views">
            <Eye className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{(post.views || 0).toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1" title="Likes">
            <ThumbsUp className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{(post.likes || 0).toLocaleString()}</span>
          </span>
        </div>

        <span className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          <Download className="w-3.5 h-3.5" />
          <span>Details</span>
        </span>
      </div>
    </article>
  );
};
