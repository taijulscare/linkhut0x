/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../../types';
import { getSiteSettings, updateSiteSettings } from '../../lib/ads';
import { seedInitialSampleData } from '../../lib/posts';
import { appCache } from '../../lib/cache';
import { 
  Settings, 
  Database, 
  Sparkles, 
  Save, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Sliders,
  Share2
} from 'lucide-react';

export const AdminSettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [defaultRequiredAds, setDefaultRequiredAds] = useState<number>(2);
  const [postsPerPage, setPostsPerPage] = useState<number>(10);
  const [adFrequency, setAdFrequency] = useState<number>(4);
  const [contactEmail, setContactEmail] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getSiteSettings();
      setSettings(data);
      setSiteName(data.siteName);
      setSiteDescription(data.siteDescription);
      setDefaultRequiredAds(data.defaultRequiredAds);
      setPostsPerPage(data.postsPerPage || 10);
      setAdFrequency(data.adFrequency || 4);
      setContactEmail(data.contactEmail || '');
      setTelegramUrl(data.socialLinks?.telegram || '');
      setTwitterUrl(data.socialLinks?.twitter || '');
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      await updateSiteSettings({
        siteName: siteName.trim(),
        siteDescription: siteDescription.trim(),
        defaultRequiredAds: Number(defaultRequiredAds),
        postsPerPage: Number(postsPerPage),
        adFrequency: Number(adFrequency),
        contactEmail: contactEmail.trim(),
        socialLinks: {
          telegram: telegramUrl.trim(),
          twitter: twitterUrl.trim()
        }
      });
      setFeedback({ type: 'success', message: 'Site settings updated successfully!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleRunSeeder = async () => {
    if (!window.confirm('Populate database with sample categories, posts, screenshots, and ad units?')) return;

    setSeeding(true);
    setFeedback(null);
    try {
      const res = await seedInitialSampleData();
      setFeedback({
        type: 'success',
        message: `Database populated! Created ${res.categoriesCount} categories, ${res.postsCount} sample posts, and ${res.adsCount} ad placements.`
      });
    } catch (err: any) {
      console.error('Seeder failed:', err);
      setFeedback({ type: 'error', message: err.message || 'Seeding failed' });
    } finally {
      setSeeding(false);
    }
  };

  const handleFlushCache = () => {
    appCache.clear();
    setFeedback({ type: 'success', message: 'In-memory client cache cleared completely!' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Portal Configuration & Database</h2>
          <p className="text-xs text-slate-400">
            Global parameters, monetization thresholds, and database maintenance tools.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs text-indigo-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            <span>Site Identity & General Defaults</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Site Title</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={e => setSiteName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Site Meta Description</label>
              <textarea
                rows={2}
                value={siteDescription}
                onChange={e => setSiteDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Rewarded Ads per Post
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={defaultRequiredAds}
                onChange={e => setDefaultRequiredAds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Between-Posts Ad Frequency (Every N Posts)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={adFrequency}
                onChange={e => setAdFrequency(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact / Support Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Telegram Community Link</label>
              <input
                type="url"
                value={telegramUrl}
                onChange={e => setTelegramUrl(e.target.value)}
                placeholder="https://t.me/yourchannel"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              id="save-settings-btn"
              type="submit"
              disabled={saving}
              className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Site Settings'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Database Seeding & Maintenance Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <h3 className="font-bold text-sm text-slate-200 uppercase tracking-wider text-xs text-indigo-400 flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span>Data Seeder & Cache Maintenance</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-slate-200 mb-1">Seed Sample Catalog Data</h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Populates your Firestore database with verified sample apps (Android, AI tools, IDE, Design Assets) with complete screenshots and ad rules.
              </p>
            </div>

            <button
              id="seed-database-btn"
              type="button"
              disabled={seeding}
              onClick={handleRunSeeder}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              {seeding ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{seeding ? 'Seeding Database...' : 'Seed Sample Catalog'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-xs text-slate-200 mb-1">Flush In-Memory Cache</h4>
              <p className="text-[11px] text-slate-400 mb-4">
                Clears the client-side memory cache to instantly force fresh Firestore queries across all visitors.
              </p>
            </div>

            <button
              id="flush-cache-btn"
              type="button"
              onClick={handleFlushCache}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4 text-slate-400" />
              <span>Flush Cache Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
