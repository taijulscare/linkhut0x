/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Post } from '../../types';
import { searchPosts } from '../../lib/posts';
import { Search, X, ArrowRight, Eye, ThumbsUp, Sparkles, Folder } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPost: (slug: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectPost }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await searchPosts(searchTerm);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mr-3" />
          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search apps, tools, categories, or tags..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              id="clear-search-btn"
              type="button"
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            id="close-search-btn"
            type="button"
            onClick={onClose}
            className="ml-2 px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-slate-100 dark:divide-slate-800/60">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Searching content catalog...</span>
            </div>
          )}

          {!loading && searchTerm && results.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
              No results found for "<span className="text-slate-800 dark:text-slate-200 font-semibold">{searchTerm}</span>". Try another keyword.
            </div>
          )}

          {!loading && !searchTerm && (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Type at least 2 characters to search titles, descriptions, categories, or tags.
            </div>
          )}

          {!loading && results.map((post) => (
            <div
              key={post.id}
              onClick={() => {
                onSelectPost(post.slug);
                onClose();
              }}
              className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all cursor-pointer flex items-center gap-3 group"
            >
              <img
                src={post.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80'}
                alt={post.title}
                className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700/60"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                    {post.categoryName}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {post.publishDate || 'Recent'}
                  </span>
                </div>
                <h4 className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {post.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {post.description}
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.views || 0}
                </span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" />
                  {post.likes || 0}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
