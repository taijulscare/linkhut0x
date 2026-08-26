/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Database, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Layers, 
  FolderTree, 
  Download, 
  Tv, 
  Eye, 
  ThumbsUp, 
  Flame,
  Check
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../../lib/firebase';

interface PhaseOneHomeProps {
  onNavigateAdmin: () => void;
  onNavigateLogin: () => void;
}

export const PhaseOneHome: React.FC<PhaseOneHomeProps> = ({ 
  onNavigateAdmin, 
  onNavigateLogin 
}) => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phase 1 Initialized • Firebase Auth & Firestore Core</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight">
          Dynamic Content & Post Platform
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          High-performance, mobile-first dynamic publishing platform powered by Firebase Firestore, role-based authentication, and customizable ad rewards.
        </p>

        {/* Call to action buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {isAdmin ? (
            <button
              id="hero-admin-btn"
              type="button"
              onClick={onNavigateAdmin}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Open Admin Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : user ? (
            <button
              id="hero-status-btn"
              type="button"
              onClick={onNavigateLogin}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-all flex items-center gap-2"
            >
              <span>View Account Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="hero-login-btn"
              type="button"
              onClick={onNavigateLogin}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Lock className="w-4 h-4" />
              <span>Admin Portal Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Infrastructure Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-100">Firestore Cloud Database</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Schema initialized with support for dynamic posts, categories, multi-provider ads, settings, and rate-limited analytics.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Database Provisioned</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-100">Role-Based Security Rules</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Deployed rules guard sensitive admin mutations while enabling performant public read access for published posts and categories.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Rules Deployed</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-100">Admin Authentication</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Supports Google OAuth and Email credentials with primary admin recognition for <code className="text-slate-300">{PRIMARY_ADMIN_EMAIL}</code>.
          </p>
          <div className="pt-2 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Auth Ready</span>
          </div>
        </div>
      </div>

      {/* Feature Map (Upcoming in Phase 2) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 block mb-1">
            System Roadmap
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Phase 2 Scope & Capabilities
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ready to be built immediately in the next step:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
              <FolderTree className="w-4 h-4 text-indigo-400" />
              <span>Category Hierarchy</span>
            </div>
            <p className="text-slate-400">
              Admin dynamic categories creation, editing, slug routing, and mobile horizontal category bar.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Post CRUD & Editor</span>
            </div>
            <p className="text-slate-400">
              Screenshots gallery, SEO slugs, tags, custom download URLs, and publish toggles.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
              <Tv className="w-4 h-4 text-indigo-400" />
              <span>Custom Ad Steps</span>
            </div>
            <p className="text-slate-400">
              Configurable 0, 1, 2, 3+ rewarded ad steps per post before unlocking downloads with mock & live adapters.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 font-bold text-slate-200 mb-1">
              <Flame className="w-4 h-4 text-indigo-400" />
              <span>Adsterra & Caching</span>
            </div>
            <p className="text-slate-400">
              Between-post placements, views deduplication, likes tracking, and optimized Firestore reads.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
