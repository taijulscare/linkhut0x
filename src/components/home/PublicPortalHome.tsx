/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, Category, AdUnit, SiteSettings } from '../../types';
import { getPublicCategories } from '../../lib/categories';
import { getPublishedPosts, getPostBySlug, PaginatedPostsResult } from '../../lib/posts';
import { getActiveAdUnits, getSiteSettings } from '../../lib/ads';
import { CategoryBar } from '../common/CategoryBar';
import { PostGrid } from '../post/PostGrid';
import { PostDetailsView } from '../post/PostDetailsView';
import { SearchModal } from '../common/SearchModal';
import { AdSlot } from '../common/AdSlot';
import { 
  Sparkles, 
  Search, 
  RefreshCw, 
  ArrowRight, 
  Download, 
  ShieldCheck, 
  Zap, 
  Flame,
  ChevronDown,
  Layers
} from 'lucide-react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface PublicPortalHomeProps {
  selectedPostSlug?: string | null;
  onSelectPostSlug?: (slug: string | null) => void;
  onNavigateAdmin?: () => void;
}

export const PublicPortalHome: React.FC<PublicPortalHomeProps> = ({
  selectedPostSlug,
  onSelectPostSlug,
  onNavigateAdmin
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  const [loadingPosts, setLoadingPosts] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Single post viewing state
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [loadingActivePost, setLoadingActivePost] = useState<boolean>(false);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial data load: Categories, Ads, Site Settings
  useEffect(() => {
    async function loadMeta() {
      try {
        const [cats, ads, settings] = await Promise.all([
          getPublicCategories(),
          getActiveAdUnits(),
          getSiteSettings()
        ]);
        setCategories(cats);
        setAdUnits(ads);
        setSiteSettings(settings);
      } catch (err) {
        console.error('Error loading metadata:', err);
      }
    }
    loadMeta();
  }, []);

  // Fetch posts whenever selectedCategorySlug changes
  useEffect(() => {
    async function loadCategoryPosts() {
      setLoadingPosts(true);
      try {
        const res: PaginatedPostsResult = await getPublishedPosts(
          siteSettings?.postsPerPage || 10,
          selectedCategorySlug
        );
        setPosts(res.posts);
        setLastVisibleDoc(res.lastVisible);
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('Error loading category posts:', err);
      } finally {
        setLoadingPosts(false);
      }
    }

    loadCategoryPosts();
  }, [selectedCategorySlug, siteSettings?.postsPerPage]);

  // Load active post if slug is given via URL/prop
  useEffect(() => {
    if (!selectedPostSlug) {
      setActivePost(null);
      return;
    }

    async function loadPostDetail() {
      setLoadingActivePost(true);
      try {
        const p = await getPostBySlug(selectedPostSlug!);
        setActivePost(p);
      } catch (err) {
        console.error('Error loading post details:', err);
      } finally {
        setLoadingActivePost(false);
      }
    }

    loadPostDetail();
  }, [selectedPostSlug]);

  const handleSelectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    if (activePost) {
      handleClosePost();
    }
  };

  const handleSelectPost = (slug: string) => {
    if (onSelectPostSlug) {
      onSelectPostSlug(slug);
    } else {
      getPostBySlug(slug).then(p => setActivePost(p));
    }
  };

  const handleClosePost = () => {
    if (onSelectPostSlug) {
      onSelectPostSlug(null);
    }
    setActivePost(null);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await getPublishedPosts(
        siteSettings?.postsPerPage || 10,
        selectedCategorySlug,
        lastVisibleDoc
      );
      setPosts(prev => [...prev, ...res.posts]);
      setLastVisibleDoc(res.lastVisible);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // If viewing a post details view
  if (selectedPostSlug || activePost) {
    if (loadingActivePost && !activePost) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading post details...</p>
          </div>
        </div>
      );
    }

    if (activePost) {
      return (
        <PostDetailsView
          post={activePost}
          adUnits={adUnits}
          onBack={handleClosePost}
          onSelectCategory={(slug) => {
            handleClosePost();
            setSelectedCategorySlug(slug);
          }}
        />
      );
    }
  }

  const featuredPost = posts.find(p => p.featured) || posts[0];
  const regularPosts = featuredPost && posts.length > 1 ? posts.filter(p => p.id !== featuredPost.id) : posts;

  return (
    <div className="min-h-screen space-y-8 animate-fadeIn pb-16">
      {/* Category Pills Bar */}
      <CategoryBar
        categories={categories}
        selectedCategorySlug={selectedCategorySlug}
        onSelectCategory={handleSelectCategory}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Banner Adsterra Placement Slot */}
        <AdSlot placement="homepage_top" adUnits={adUnits} />

        {/* Hero Spotlight (Featured Post) */}
        {selectedCategorySlug === 'all' && featuredPost && (
          <div
            id="featured-hero-card"
            onClick={() => handleSelectPost(featuredPost.slug)}
            className="group relative rounded-3xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 overflow-hidden cursor-pointer shadow-2xl transition-all"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Image Preview */}
              <div className="lg:col-span-7 relative aspect-video lg:aspect-auto overflow-hidden bg-slate-950 min-h-[260px] sm:min-h-[340px]">
                <img
                  src={featuredPost.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80'}
                  alt={featuredPost.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-xl bg-indigo-600/90 backdrop-blur text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 fill-current" />
                    <span>Featured Spotlight</span>
                  </span>
                </div>
              </div>

              {/* Text Info */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4 bg-gradient-to-br from-slate-900 to-slate-950">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {featuredPost.categoryName || 'General'}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {featuredPost.publishDate || 'Latest'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 group-hover:text-indigo-400 transition-colors leading-snug">
                    {featuredPost.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-400 line-clamp-3 leading-relaxed">
                    {featuredPost.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-bold text-[11px]">
                      {featuredPost.requiredAds > 0 ? `${featuredPost.requiredAds} Ad Step(s)` : 'Direct Unlock'}
                    </span>
                  </div>

                  <span className="py-2 px-4 rounded-xl bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5">
                    <span>Explore & Download</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Title & Search Spotlight Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>
                {selectedCategorySlug === 'all'
                  ? 'All Latest Applications & Software'
                  : `${categories.find(c => c.slug === selectedCategorySlug)?.name || 'Category'} Catalog`}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Verified packages with fast download acceleration and step-based reward unlocks.
            </p>
          </div>

          <button
            id="search-trigger-btn"
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-between gap-4 transition-all shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <span>Quick Search catalog...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-500 font-mono border border-slate-800">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Post Grid with Interleaved Ads */}
        {loadingPosts ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading catalog items...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <PostGrid
              posts={selectedCategorySlug === 'all' && featuredPost && posts.length > 1 ? regularPosts : posts}
              adUnits={adUnits}
              adFrequency={siteSettings?.adFrequency || 4}
              onSelectPost={handleSelectPost}
            />

            {/* Load More Pagination */}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  id="load-more-posts-btn"
                  type="button"
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                  className="py-3 px-8 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/10 flex items-center gap-2"
                >
                  {loadingMore ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                      <span>Loading more items...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Load More Items</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPost={handleSelectPost}
      />
    </div>
  );
};
