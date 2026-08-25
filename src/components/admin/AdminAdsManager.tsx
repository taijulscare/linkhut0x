/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AdUnit, AdPlacement, AdProviderType } from '../../types';
import { getAllAdUnitsForAdmin, saveAdUnit, deleteAdUnit } from '../../lib/ads';
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
  RefreshCw
} from 'lucide-react';
import { getAdRewardProvider } from '../../lib/adProvider';

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

  // Form states
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

  const fetchAds = async () => {
    setLoading(true);
    try {
      const data = await getAllAdUnitsForAdmin();
      setAdUnits(data);
    } catch (err) {
      console.error('Error fetching ads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

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
      await fetchAds();
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

  const runRewardAdTest = async (provType: 'mock' | 'monetag' | 'telegram') => {
    setTesting(true);
    setTestLog(`Triggering test rewarded ad step with adapter [${provType.toUpperCase()}]...`);
    try {
      const prov = getAdRewardProvider(provType);
      const res = await prov.showRewardedAd(0);
      setTestLog(res ? `✅ Success: Adapter [${provType.toUpperCase()}] verified and callback completed successfully!` : `❌ Failed: Ad was closed or cancelled.`);
    } catch (err: any) {
      setTestLog(`❌ Error: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Ad Placements & Monetization</h2>
          <p className="text-xs text-slate-400">
            Configure Adsterra banners, native feed slots, and Monetag rewarded video integrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAds}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            title="Refresh ads"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            id="create-ad-unit-btn"
            type="button"
            onClick={openCreateModal}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ad Placement</span>
          </button>
        </div>
      </div>

      {/* Rewarded Provider Test Console */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Rewarded Ad Provider Verification Sandbox</span>
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
            onClick={() => runRewardAdTest('mock')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-indigo-400" />
            <span>Test Mock Adapter</span>
          </button>

          <button
            type="button"
            disabled={testing}
            onClick={() => runRewardAdTest('monetag')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            <span>Test Monetag Rewarded</span>
          </button>

          <button
            type="button"
            disabled={testing}
            onClick={() => runRewardAdTest('telegram')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 text-sky-400" />
            <span>Test Telegram Mini App</span>
          </button>
        </div>

        {testLog && (
          <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
            {testLog}
          </div>
        )}
      </div>

      {/* Ad Units List */}
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
                  No ad units configured yet. Click "Add Ad Placement" to create one.
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
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
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
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ad.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
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

      {/* Modal Dialog */}
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
                className="p-1 text-slate-400 hover:text-white"
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
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
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
