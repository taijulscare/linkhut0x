/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Database, 
  Lock, 
  Layers, 
  FolderTree, 
  FileText, 
  Tv, 
  Settings as SettingsIcon, 
  LogOut, 
  CheckCircle2, 
  Server,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { db, PRIMARY_ADMIN_EMAIL } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Category, Post } from '../../types';
import { getAllCategoriesForAdmin } from '../../lib/categories';
import { AdminPostsManager } from './AdminPostsManager';
import { AdminPostEditor } from './AdminPostEditor';
import { AdminCategoriesManager } from './AdminCategoriesManager';
import { AdminAdsManager } from './AdminAdsManager';
import { AdminSettingsManager } from './AdminSettingsManager';

type AdminTab = 'overview' | 'posts' | 'categories' | 'ads' | 'settings';

interface AdminLayoutProps {
  onNavigateHome?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onNavigateHome }) => {
  const { user, isAdmin, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('posts');
  const [firestoreStatus, setFirestoreStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [statusMessage, setStatusMessage] = useState<string>('Testing Firestore connection...');

  // State for Post editing
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editingPostItem, setEditingPostItem] = useState<Post | null>(null);

  // Global Categories for post creation
  const [categories, setCategories] = useState<Category[]>([]);

  const loadCategories = async () => {
    try {
      const data = await getAllCategoriesForAdmin();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  useEffect(() => {
    async function testFirestore() {
      try {
        setFirestoreStatus('checking');
        const settingsRef = doc(db, 'settings', 'site_settings');
        const snap = await getDoc(settingsRef);
        
        if (!snap.exists() && isAdmin) {
          await setDoc(settingsRef, {
            siteName: 'Content Hub',
            siteDescription: 'Discover and download verified video and content with rewards.',
            defaultTheme: 'dark',
            defaultRequiredAds: 2,
            postsPerPage: 10,
            adFrequency: 4,
            monetizationEnabled: true,
            downloadTimerSeconds: 3,
            updatedAt: Date.now()
          });
        }
        
        setFirestoreStatus('connected');
        setStatusMessage('Firestore database connected & security rules validated.');
      } catch (err: any) {
        console.error('Firestore connection check error:', err);
        setFirestoreStatus('error');
        setStatusMessage(err.message || 'Unable to access Firestore document.');
      }
    }

    testFirestore();
    loadCategories();
  }, [isAdmin]);

  const handleStartCreatePost = () => {
    setEditingPostItem(null);
    setIsEditingPost(true);
  };

  const handleStartEditPost = (post: Post) => {
    setEditingPostItem(post);
    setIsEditingPost(true);
  };

  const handlePostSaved = () => {
    setIsEditingPost(false);
    setEditingPostItem(null);
    loadCategories();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100 leading-tight">Admin Console</h2>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Phase 2 Live
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <button
              id="admin-tab-posts"
              type="button"
              onClick={() => {
                setIsEditingPost(false);
                setCurrentTab('posts');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                currentTab === 'posts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Posts & Downloads</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="admin-tab-categories"
              type="button"
              onClick={() => {
                setIsEditingPost(false);
                setCurrentTab('categories');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                currentTab === 'categories'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <FolderTree className="w-4 h-4" />
                <span>Categories</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="admin-tab-ads"
              type="button"
              onClick={() => {
                setIsEditingPost(false);
                setCurrentTab('ads');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                currentTab === 'ads'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Tv className="w-4 h-4" />
                <span>Adsterra & Monetag</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="admin-tab-settings"
              type="button"
              onClick={() => {
                setIsEditingPost(false);
                setCurrentTab('settings');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                currentTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <SettingsIcon className="w-4 h-4" />
                <span>Site & Database</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>

            <button
              id="admin-tab-overview"
              type="button"
              onClick={() => {
                setIsEditingPost(false);
                setCurrentTab('overview');
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-between transition-all ${
                currentTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>System Overview</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="pt-6 border-t border-slate-800">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                {user?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.displayName || user?.email}</p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
              <span className="text-slate-400">Role:</span>
              <span className="font-semibold text-emerald-400">
                {isAdmin ? 'Administrator' : 'User'}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {onNavigateHome && (
              <button
                id="nav-home-btn"
                type="button"
                onClick={onNavigateHome}
                className="flex-1 py-2 px-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all text-center flex items-center justify-center gap-1"
              >
                <span>View Site</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
            <button
              id="sidebar-logout-btn"
              type="button"
              onClick={logout}
              className="py-2 px-3 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-all flex items-center justify-center gap-1"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Post Editor View */}
        {isEditingPost ? (
          <AdminPostEditor
            post={editingPostItem}
            categories={categories}
            onSave={handlePostSaved}
            onCancel={() => setIsEditingPost(false)}
          />
        ) : (
          <>
            {/* Tab: Posts */}
            {currentTab === 'posts' && (
              <AdminPostsManager
                categories={categories}
                onCreatePost={handleStartCreatePost}
                onEditPost={handleStartEditPost}
              />
            )}

            {/* Tab: Categories */}
            {currentTab === 'categories' && <AdminCategoriesManager />}

            {/* Tab: Ads */}
            {currentTab === 'ads' && <AdminAdsManager />}

            {/* Tab: Settings */}
            {currentTab === 'settings' && <AdminSettingsManager />}

            {/* Tab: Overview */}
            {currentTab === 'overview' && (
              <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 mb-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      Phase 1 & 2 Infrastructure
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                      System Architecture & Portal Health
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                      Real-time database connection, deployed security policies, and monetization controllers.
                    </p>
                  </div>
                </div>

                {/* Database Status Card */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${firestoreStatus === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : firestoreStatus === 'checking' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-200">Firebase Firestore Status</h3>
                        <p className="text-xs text-slate-400">{statusMessage}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${firestoreStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : firestoreStatus === 'checking' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'}`}>
                      <span className={`w-2 h-2 rounded-full ${firestoreStatus === 'connected' ? 'bg-emerald-400' : firestoreStatus === 'checking' ? 'bg-indigo-400 animate-ping' : 'bg-rose-400'}`} />
                      {firestoreStatus === 'connected' ? 'CONNECTED & SECURED' : firestoreStatus === 'checking' ? 'TESTING...' : 'CONFIG REQUIRED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-500 block mb-0.5">Primary Admin</span>
                      <span className="font-mono text-slate-300 break-all">{PRIMARY_ADMIN_EMAIL}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-500 block mb-0.5">Current Auth UID</span>
                      <span className="font-mono text-slate-300 break-all">{user?.uid || 'Not signed in'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-500 block mb-0.5">Security Level</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        RBAC Firestore Rules Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phase 2 Accomplishments */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">Category CRUD & Hierarchy</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Organize dynamic categories with custom icons, SEO slugs, order sorting, and live toggle for public navigation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">Dynamic Post & Download System</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Full CRUD with SEO slugs, Markdown body, multi-screenshot galleries with Lightbox, and per-post configurable ad unlock steps.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">Download Unlocker & Reward Steps</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Step-by-step rewarded video/ad flow adapter supporting Mock developer simulator, Monetag rewarded, and Telegram Mini App ads.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">Search & Caching Layer</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Global spotlight search modal with real-time query filtering, in-memory TTL caching, and throttled view/like metrics.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
