/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Download, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Play, 
  Sparkles, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  AlertCircle
} from 'lucide-react';
import { getAdRewardProvider } from '../../lib/adProvider';

interface DownloadUnlockerProps {
  downloadUrl: string;
  requiredAds: number;
  postTitle: string;
}

export const DownloadUnlocker: React.FC<DownloadUnlockerProps> = ({
  downloadUrl,
  requiredAds,
  postTitle
}) => {
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [activeStepWatching, setActiveStepWatching] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<'mock' | 'monetag' | 'telegram'>('mock');

  const totalRequired = Math.max(0, requiredAds || 0);
  const isUnlocked = completedSteps >= totalRequired;

  const handleWatchAd = async (stepIndex: number) => {
    if (stepIndex !== completedSteps) return; // Must complete sequentially

    setActiveStepWatching(stepIndex);
    setErrorMessage(null);

    try {
      const provider = getAdRewardProvider(providerType);
      const success = await provider.showRewardedAd(stepIndex);

      if (success) {
        setCompletedSteps(prev => Math.min(totalRequired, prev + 1));
      } else {
        setErrorMessage('Ad verification did not complete. Please try watching again.');
      }
    } catch (err: any) {
      console.error('Error watching reward ad:', err);
      setErrorMessage(err.message || 'Ad presentation encountered an error.');
    } finally {
      setActiveStepWatching(null);
    }
  };

  const handleDownloadClick = () => {
    if (!isUnlocked) return;
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
            {isUnlocked ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
            <span>Download Authorization Center</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-100">
            {isUnlocked ? 'Download Unlocked & Verified' : 'Complete Verification Steps to Unlock'}
          </h3>
        </div>

        {/* Status Badge */}
        <div>
          {totalRequired === 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instant Free Download</span>
            </span>
          ) : isUnlocked ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All Steps Completed ({completedSteps}/{totalRequired})</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Locked ({completedSteps}/{totalRequired} Steps Done)</span>
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar (if ads required) */}
      {totalRequired > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Unlock Progress</span>
            <span className="font-semibold text-slate-200">
              {Math.round((completedSteps / totalRequired) * 100)}% ({completedSteps}/{totalRequired})
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${(completedSteps / totalRequired) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step Cards List */}
      {totalRequired > 0 && !isUnlocked && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Watch the sponsored advertisement step{totalRequired > 1 ? 's' : ''} below to generate your secure download link:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: totalRequired }).map((_, index) => {
              const isCompleted = index < completedSteps;
              const isCurrent = index === completedSteps;
              const isWatching = activeStepWatching === index;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                      : isCurrent
                      ? 'bg-slate-850 border-indigo-500/60 shadow-lg shadow-indigo-500/10 text-slate-100'
                      : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold tracking-wide uppercase">
                      Step #{index + 1}
                    </span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-500" />
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mb-4">
                    {isCompleted
                      ? 'Ad Verified & Step Finished'
                      : isCurrent
                      ? 'Ready to view sponsored reward ad'
                      : 'Unlocks after previous step'}
                  </p>

                  <button
                    id={`reward-step-btn-${index}`}
                    type="button"
                    disabled={!isCurrent || isWatching}
                    onClick={() => handleWatchAd(index)}
                    className={`w-full py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : isCurrent
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                    }`}
                  >
                    {isWatching ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Watching Ad...</span>
                      </>
                    ) : isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Step Complete</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Ad #{index + 1}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Download Button Container */}
      <div className="pt-2">
        {isUnlocked ? (
          <div className="space-y-3">
            <button
              id="unlocked-download-btn"
              type="button"
              onClick={handleDownloadClick}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-base transition-all shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-3 transform active:scale-[0.99]"
            >
              <Download className="w-6 h-6 animate-bounce" />
              <span>Download File Now</span>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Direct secure link ready. Verified virus-free and checksum inspected.
            </p>
          </div>
        ) : (
          <button
            id="locked-download-btn"
            type="button"
            disabled
            className="w-full py-4 px-6 rounded-2xl bg-slate-950 border border-slate-800 text-slate-500 font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Download Locked — Complete {totalRequired - completedSteps} More Step(s)</span>
          </button>
        )}
      </div>

      {/* Ad Provider Selector / Simulation Notice */}
      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Ad Adapter: <strong className="text-slate-200">{providerType.toUpperCase()}</strong> (Modular Rewarded Flow)
          </span>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="text-[10px] text-slate-500">Switch Provider:</span>
          <select
            id="ad-provider-select"
            value={providerType}
            onChange={(e) => setProviderType(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="mock">Mock Simulator (Fast Dev)</option>
            <option value="monetag">Monetag Rewarded</option>
            <option value="telegram">Telegram Mini App</option>
          </select>
        </div>
      </div>
    </div>
  );
};
