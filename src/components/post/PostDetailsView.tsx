/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, AdUnit } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { recordPostView, togglePostLike, isPostLikedLocal } from '../../lib/viewsLikes';
import { ScreenshotLightbox } from './ScreenshotLightbox';
import { DownloadUnlocker } from './DownloadUnlocker';
import { AdSlot } from '../common/AdSlot';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  ThumbsUp, 
  Share2, 
  Sparkles, 
  Tag, 
  Folder,
  Check,
  ShieldCheck
} from 'lucide-react';

interface PostDetailsViewProps {
  post: Post;
  adUnits: AdUnit[];
  onBack: () => void;
  onSelectCategory: (categorySlug: string) => void;
}

export const PostDetailsView: React.FC<PostDetailsViewProps> = ({
  post,
  adUnits,
  onBack,
  onSelectCategory
}) => {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState<number>(post.likes || 0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [viewsCount, setViewsCount] = useState<number>(post.views || 0);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    // Check initial like status
    setIsLiked(isPostLikedLocal(post.id, user?.uid));

    // Record throttled view
    recordPostView(post.id).then((incremented) => {
      if (incremented) {
        setViewsCount(prev => prev + 1);
      }
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [post.id, user?.uid]);

  const handleLike = async () => {
    try {
      const nextLiked = !isLiked;
      setIsLiked(nextLiked);
      setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));

      await togglePostLike(post.id, user?.uid);
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikesCount(post.likes || 0);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.description,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          id="post-back-btn"
          type="button"
          onClick={onBack}
          className="py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="share-post-btn"
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Share post link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Top Banner Adsterra Slot */}
      <AdSlot placement="post_top" adUnits={adUnits} />

      {/* Post Article Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="post-category-tag-btn"
            type="button"
            onClick={() => onSelectCategory(post.categorySlug)}
            className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-bold uppercase tracking-wider hover:bg-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>{post.categoryName || 'General'}</span>
          </button>

          <span className="text-slate-300 dark:text-slate-600">•</span>

          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{post.publishDate || new Date(post.createdAt).toLocaleDateString()}</span>
          </div>

          <span className="text-slate-300 dark:text-slate-600">•</span>

          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Views and Likes Quick Action Bar */}
        <div className="flex items-center justify-between py-3 border-y border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <strong className="text-slate-900 dark:text-slate-200">{viewsCount.toLocaleString()}</strong> views
            </span>

            <span>•</span>

            <span className="flex items-center gap-1.5">
              <ThumbsUp className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              <strong className="text-slate-900 dark:text-slate-200">{likesCount.toLocaleString()}</strong> likes
            </span>
          </div>

          {/* Interactive Like Button */}
          <button
            id="like-post-toggle-btn"
            type="button"
            onClick={handleLike}
            className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm cursor-pointer ${
              isLiked
                ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/40 shadow-rose-500/10'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-500 dark:text-rose-400' : ''}`} />
            <span>{isLiked ? 'Liked' : 'Like Post'}</span>
          </button>
        </div>
      </div>

      {/* Main Thumbnail Hero */}
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <img
          src={post.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80'}
          alt={post.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
      </div>

      {/* Post Description & Markdown Content */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <h3 className="font-bold uppercase tracking-wider text-xs text-indigo-600 dark:text-indigo-400">
          Overview & Description
        </h3>
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {post.description}
        </p>

        {post.content && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed whitespace-pre-line font-mono sm:font-sans">
            {post.content}
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
              <Tag className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Tags:
            </span>
            {post.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Middle Adsterra Slot */}
      <AdSlot placement="post_middle" adUnits={adUnits} />

      {/* Screenshots Gallery Section */}
      {post.screenshots && post.screenshots.length > 0 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
          <ScreenshotLightbox screenshots={post.screenshots} />
        </div>
      )}

      {/* Download Section with Configurable Ad Steps */}
      <DownloadUnlocker
        downloadUrl={post.downloadUrl}
        requiredAds={post.requiredAds}
        postTitle={post.title}
      />

      {/* Bottom Adsterra Slot */}
      <AdSlot placement="post_bottom" adUnits={adUnits} />
    </div>
  );
};
