/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AdUnit, 
  AdPlacement, 
  AdProviderType, 
  RewardedAdConfig, 
  RewardedAdProviderType,
  SiteSettings 
} from '../../types';
import { getAllAdUnitsForAdmin, saveAdUnit, deleteAdUnit, getSiteSettings, updateSiteSettings } from '../../lib/ads';
import { 
  Tv, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Code, 
  Save, 
  X,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Settings2,
  Sliders
} from 'lucide-react';
import { getAdRewardProvider, DEFAULT_REWARDED_CONFIG } from '../../lib/adProvider';

const PLACEMENT_OPTIONS: { label: string; value: AdPlacement }[] = [
  { label: 'Homepage Top (Banner 728x90)', value: 'homepage_top' },
  { label: 'Homepage Between Posts (Native Feed)', value: 'homepage_between' },
  { label: 'Post Details Top', value: 'post_top' },
  { label: 'Post Details Middle', value: 'post_middle' },
  { label: 'Post Details Bottom', value: 'post_bottom' },
  { label: 'Sidebar Sticky', value: 'sidebar' }
];

export const AdminAdsManager: React.FC = () => {
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdUnit | null>(null);

  // Rewarded Ad Config Form
  const [rewardedConfig, setRewardedConfig] = useState<RewardedAdConfig>(DEFAULT_REWARDED_CONFIG);
  const [savingRewardConfig, setSavingRewardConfig] = useState(false);
  const [rewardConfigFeedback, setRewardConfigFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states for banner ads
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState<AdProviderType>('adsterra');
  const [placement, setPlacement] = useState<AdPlacement>('homepage_top');
  const [code, setCode] = useState('');
  const [frequency, setFrequency] = useState<number>(3);
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Test Reward Provider
  const [testLog, setTestLog] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const fetchAdsAndSettings = async () => {
    setLoading(true);
    try {
      const [adsData, settingsData] = await Promise.all([
        getAllAdUnitsForAdmin(),
        getSiteSettings()
      ]);
      setAdUnits(adsData);
      if (settingsData.rewardedAdConfig) {
        setRewardedConfig(settingsData.rewardedAdConfig);
      }
    } catch (err) {
      console.error('Error fetching ads and settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdsAndSettings();
  }, []);

  const handleSaveRewardedConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRewardConfig(true);
    setRewardConfigFeedback(null);

    try {
      await updateSiteSettings({
        rewardedAdConfig: rewardedConfig
      });
      setRewardConfigFeedback({
        type: 'success',
        message: 'Rewarded Ad Provider settings saved and deployed successfully!'
      });
    } catch (err: any) {
      console.error('Error updating rewarded ad config:', err);
      setRewardConfigFeedback({
        type: 'error',
        message: err.message || 'Failed to save rewarded ad configuration.'
      });
    } finally {
      setSavingRewardConfig(false);
    }
  };

  const openCreateModal = () => {
    setEditingAd(null);
    setTitle('');
    setProvider('adsterra');
    setPlacement('homepage_top');
    setCode('<div style="background: #1e1b4b; border: 1px dashed #6366f1; border-radius: 12px; padding: 16px; text-align: center; color: #a5b4fc; font-size: 13px;">⚡ Sponsored Banner • Adsterra Placement Slot</div>');
    setFrequency(3);
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (ad: AdUnit) => {
    setEditingAd(ad);
    setTitle(ad.title);
    setProvider(ad.provider);
    setPlacement(ad.placement);
    setCode(ad.code);
    setFrequency(ad.frequency || 3);
    setActive(ad.active);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveAdUnit({
        title: title.trim(),
        provider,
        placement,
        code,
        frequency: Number(frequency) || 1,
        active
      }, editingAd?.id);

      setIsModalOpen(false);
      await fetchAdsAndSettings();
    } catch (err) {
      console.error('Error saving ad unit:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this ad unit placement?')) return;
    try {
      await deleteAdUnit(id);
      setAdUnits(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error deleting ad unit:', err);
    }
  };

  const handleToggleActive = async (ad: AdUnit) => {
    try {
      const next = !ad.active;
      await saveAdUnit({
        title: ad.title,
        provider: ad.provider,
        placement: ad.placement,
        code: ad.code,
        frequency: ad.frequency,
        active: next
      }, ad.id);
      setAdUnits(prev => prev.map(a => a.id === ad.id ? { ...a, active: next } : a));
    } catch (err) {
      console.error('Error toggling ad state:', err);
    }
  };

  const runRewardAdTest = async (overrideProvider?: RewardedAdProviderType) => {
    setTesting(true);
    const testConfig: RewardedAdConfig = overrideProvider 
      ? { ...rewardedConfig, provider: overrideProvider }
      : rewardedConfig;

    setTestLog(`[Testing ${testConfig.provider.toUpperCase()}] Triggering rewarded ad step with Zone ${testConfig.monetag?.zoneId || 'N/A'} and Function ${testConfig.monetag?.sdkFunctionName || 'N/A'}...`);
    
    try {
      const prov = getAdRewardProvider(testConfig);
      const res = await prov.showRewardedAd(0);
      setTestLog(res ? `✅ Success: Adapter [${testConfig.provider.toUpperCase()}] verified and callback completed successfully!` : `❌ Failed: Ad was closed or cancelled.`);
    } catch (err: any) {
      setTestLog(`❌ Error from [${testConfig.provider.toUpperCase()}]: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Ad Placements & Monetization</h2>
          <p className="text-xs text-slate-400">
            Configure Monetag Rewarded Interstitials, Adsterra banners, and native feed slot ads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAdsAndSettings}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            title="Refresh ads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="create-ad-unit-btn"
            type="button"
            onClick={openCreateModal}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Banner Slot</span>
          </button>
        </div>
      </div>

      {/* Rewarded Ad Provider Configuration Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Settings2 className="w-4 h-4" />
            <span>Watch Ads to Unlock Download — Provider Engine Configuration</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Controls "Watch Ads to Unlock Download" flow on single-post pages
          </span>
        </div>

        {rewardConfigFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              rewardConfigFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {rewardConfigFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{rewardConfigFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveRewardedConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Active Provider Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Active Rewarded Ad Provider *
              </label>
              <select
                id="active-rewarded-provider-select"
                value={rewardedConfig.provider}
                onChange={e => setRewardedConfig(prev => ({ ...prev, provider: e.target.value as RewardedAdProviderType }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="monetag">Monetag Rewarded Interstitial (Production SDK)</option>
                <option value="custom">Custom HTML / Script Provider</option>
                <option value="telegram">Telegram Mini App Native Ads</option>
                <option value="mock">Mock Simulator (Fast Dev Testing)</option>
              </select>
            </div>

            {/* Enable Toggle */}
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rewardedConfig.enabled}
                  onChange={e => setRewardedConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
                />
                <span className="text-xs font-semibold text-slate-200">
                  Monetization Enabled for Download Unlocking
                </span>
              </label>
            </div>
          </div>

          {/* Monetag Specific Fields */}
          {rewardedConfig.provider === 'monetag' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Monetag Rewarded Interstitial Parameters</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Monetag SDK loads dynamically: &lt;script src="//libtl.com/sdk.js" data-zone="ZONE_ID" data-sdk="SDK_FUNCTION"&gt;&lt;/script&gt;
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monetag Zone ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={rewardedConfig.monetag?.zoneId || ''}
                    onChange={e => {
                      const zid = e.target.value;
                      setRewardedConfig(prev => ({
                        ...prev,
                        monetag: {
                          ...prev.monetag,
                          zoneId: zid,
                          sdkFunctionName: prev.monetag?.sdkFunctionName || `show_${zid}`
                        }
                      }));
                    }}
                    placeholder="e.g. 11657915"
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monetag SDK Function Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={rewardedConfig.monetag?.sdkFunctionName || ''}
                    onChange={e => setRewardedConfig(prev => ({
                      ...prev,
                      monetag: {
                        ...prev.monetag,
                        sdkFunctionName: e.target.value
                      }
                    }))}
                    placeholder="e.g. show_11657915"
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Monetag SDK Script URL (Optional override)
                  </label>
                  <input
                    type="text"
                    value={rewardedConfig.monetag?.scriptUrl || '//libtl.com/sdk.js'}
                    onChange={e => setRewardedConfig(prev => ({
                      ...prev,
                      monetag: {
                        ...prev.monetag,
                        scriptUrl: e.target.value
                      }
                    }))}
                    placeholder="//libtl.com/sdk.js"
                    className="w-full bg-slate-900 border border-slate-750 rounded-xl px-3 py-2 text-xs font-mono text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom HTML Specific Fields */}
          {rewardedConfig.provider === 'custom' && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wide">
                <Code className="w-3.5 h-3.5" />
                <span>Custom HTML / Script Provider Settings</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom HTML / JS Code *
                </label>
                <textarea
                  rows={4}
                  value={rewardedConfig.custom?.html || ''}
                  onChange={e => setRewardedConfig(prev => ({
                    ...prev,
                    custom: {
                      ...prev.custom,
                      html: e.target.value
                    }
                  }))}
                  placeholder="<script>/* custom ad script */</script>"
                  className="w-full bg-slate-900 border border-slate-750 rounded-xl p-3 text-xs font-mono text-slate-100"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400">
              Each post uses its individual <code className="text-indigo-300 font-mono">post.requiredAds</code> field to dictate the exact number of ads.
            </div>

            <button
              id="save-rewarded-ad-config-btn"
              type="submit"
              disabled={savingRewardConfig}
              className="w-full sm:w-auto py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingRewardConfig ? 'Saving Settings...' : 'Save Rewarded Ad Engine Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Rewarded Provider Test Console */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Rewarded Ad Sandbox Live Test</span>
          </div>
          <span className="text-[11px] text-slate-500">Test unlock mechanics</span>
        </div>

        <p className="text-xs text-slate-300">
          Verify that client-side reward adapters correctly trigger callbacks and complete download step unlocks:
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            disabled={testing}
            onClick={() => runRewardAdTest('monetag')}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
            <span>Test Configured Monetag SDK</span>
          </button>

          <button
            type="button"
            disabled={testing}
            onClick={() => runRewardAdTest('mock')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-750 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Mock Adapter</span>
          </button>

          <button
            type="button"
            disabled={testing}
            onClick={() => runRewardAdTest('telegram')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-750 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-sky-400" />
            <span>Test Telegram Mini App</span>
          </button>
        </div>

        {testLog && (
          <div className="mt-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed">
            {testLog}
          </div>
        )}
      </div>

      {/* Banner / Native Feed Ad Units Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Tv className="w-4 h-4 text-indigo-400" />
            <span>Banner & Native Feed Placements ({adUnits.length})</span>
          </h3>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800 tracking-wider">
              <tr>
                <th className="p-4">Placement & Title</th>
                <th className="p-4">Provider</th>
                <th className="p-4">Position</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading ad units...</span>
                    </div>
                  </td>
                </tr>
              ) : adUnits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No banner slots configured yet. Click "Add Banner Slot" to create one.
                  </td>
                </tr>
              ) : (
                adUnits.map(ad => (
                  <tr key={ad.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{ad.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono line-clamp-1 max-w-xs">{ad.code}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {ad.provider}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-950 border border-slate-800 text-slate-300">
                        {ad.placement}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(ad)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                          ad.active
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {ad.active ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-slate-500" />
                            <span>Paused</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(ad)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ad.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Banner Slots */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-sm">
                {editingAd ? 'Edit Ad Placement' : 'Add New Ad Placement'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Placement Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Header 728x90 Banner"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Network / Provider</label>
                  <select
                    value={provider}
                    onChange={e => setProvider(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    <option value="adsterra">Adsterra</option>
                    <option value="monetag">Monetag</option>
                    <option value="google_admanager">Google Ad Manager</option>
                    <option value="custom">Custom HTML / Script</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Location Slot</label>
                  <select
                    value={placement}
                    onChange={e => setPlacement(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  >
                    {PLACEMENT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {placement === 'homepage_between' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Frequency (Insert after every N posts)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={frequency}
                    onChange={e => setFrequency(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ad Code / HTML / JS Snippet *
                </label>
                <textarea
                  required
                  rows={4}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="<script>...</script> or <div>...</div>"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100"
                />
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-200">Active & Rendering</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Ad Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
