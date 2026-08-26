/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  AdRewardProvider, 
  RewardedAdConfig, 
  RewardedMonetagConfig, 
  RewardedCustomConfig 
} from '../types';
import { loadMonetagSdk } from './monetagLoader';

/**
 * Default fallback Monetag configuration
 */
export const DEFAULT_MONETAG_CONFIG: RewardedMonetagConfig = {
  zoneId: '11657915',
  sdkFunctionName: 'show_11657915',
  scriptUrl: '//libtl.com/sdk.js'
};

/**
 * Default Rewarded Ad Configuration
 */
export const DEFAULT_REWARDED_CONFIG: RewardedAdConfig = {
  provider: 'monetag',
  enabled: true,
  monetag: DEFAULT_MONETAG_CONFIG,
  custom: {
    html: '',
    completionType: 'message_event',
    eventKey: 'REWARD_AD_COMPLETED'
  },
  defaultRequiredAds: 2
};

/**
 * Mock Ad Provider for development and demonstration purposes.
 * Simulates real rewarded ad flows with a timer and completion event.
 */
export class MockAdProvider implements AdRewardProvider {
  name = 'Mock Developer Provider';

  async showRewardedAd(stepIndex: number): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate user watching ad dialog / popup for 2 seconds
      setTimeout(() => {
        resolve(true);
      }, 2200);
    });
  }
}

/**
 * Monetag Rewarded Interstitial Ad Provider
 * Dynamically loads Monetag's SDK using configured Zone ID and SDK Function Name,
 * and awaits the SDK's completion Promise before verifying the reward.
 */
export class MonetagAdProvider implements AdRewardProvider {
  name = 'Monetag Rewarded Interstitial';
  private config: RewardedMonetagConfig;

  constructor(config?: Partial<RewardedMonetagConfig>) {
    this.config = {
      zoneId: (config?.zoneId || DEFAULT_MONETAG_CONFIG.zoneId).trim(),
      sdkFunctionName: (config?.sdkFunctionName || DEFAULT_MONETAG_CONFIG.sdkFunctionName).trim(),
      scriptUrl: (config?.scriptUrl || DEFAULT_MONETAG_CONFIG.scriptUrl || '//libtl.com/sdk.js').trim()
    };
  }

  async showRewardedAd(stepIndex: number): Promise<boolean> {
    const { zoneId, sdkFunctionName } = this.config;

    if (!zoneId) {
      throw new Error('Monetag Zone ID is not configured.');
    }

    // Step 1: Ensure Monetag SDK script is loaded and ready
    try {
      await loadMonetagSdk(this.config);
    } catch (loadErr: any) {
      console.error('[MonetagAdProvider] SDK load failed:', loadErr);
      throw new Error(loadErr.message || 'Unable to load Monetag Ad SDK. Please disable your ad blocker or check your connection.');
    }

    // Step 2: Resolve the dynamic global SDK function
    const sdkFunction = (window as any)[sdkFunctionName];
    if (typeof sdkFunction !== 'function') {
      throw new Error(`Monetag SDK function "${sdkFunctionName}" is not available on window.`);
    }

    // Step 3: Trigger the rewarded ad and await the Promise completion
    try {
      const result = sdkFunction();

      // Monetag Rewarded Interstitial returns a Promise: show_ZONE().then(() => { reward user })
      if (result && typeof result.then === 'function') {
        await result;
        return true;
      }

      // If the function completed synchronously without errors
      return true;
    } catch (err: any) {
      console.warn('[MonetagAdProvider] Ad display was dismissed or failed:', err);
      // If Promise rejects, the ad was closed, blocked, or failed
      throw new Error(err?.message || 'Ad was closed before completion. Please watch the full ad to unlock.');
    }
  }
}

/**
 * Custom HTML / Script Provider
 * Safely handles custom ad networks or embeds with event-driven completion verification.
 */
export class CustomAdProvider implements AdRewardProvider {
  name = 'Custom HTML / Script Provider';
  private config: RewardedCustomConfig;

  constructor(config?: Partial<RewardedCustomConfig>) {
    this.config = {
      html: config?.html || '',
      completionType: config?.completionType || 'message_event',
      eventKey: config?.eventKey || 'REWARD_AD_COMPLETED'
    };
  }

  async showRewardedAd(stepIndex: number): Promise<boolean> {
    if (!this.config.html || !this.config.html.trim()) {
      throw new Error('No custom ad code configured. Please configure custom ad code in Admin settings.');
    }

    return new Promise((resolve, reject) => {
      const timeoutDuration = 30000; // 30s timeout

      const handleMessage = (event: MessageEvent) => {
        if (event.data === this.config.eventKey || event.data?.type === this.config.eventKey) {
          window.removeEventListener('message', handleMessage);
          clearTimeout(timer);
          resolve(true);
        }
      };

      const timer = setTimeout(() => {
        window.removeEventListener('message', handleMessage);
        reject(new Error('Custom ad verification timed out. Reliable completion event was not received.'));
      }, timeoutDuration);

      window.addEventListener('message', handleMessage);

      // Trigger custom window callback if declared
      try {
        const win = window as any;
        if (typeof win.__triggerCustomRewardAd === 'function') {
          win.__triggerCustomRewardAd(stepIndex);
        }
      } catch (err) {
        console.error('[CustomAdProvider] error:', err);
      }
    });
  }
}

/**
 * Telegram Mini App Ads Provider
 * Supports Telegram Mini App rewarded flows if opened inside Telegram WebApp
 */
export class TelegramAdProvider implements AdRewardProvider {
  name = 'Telegram Mini App Ads';

  async showRewardedAd(stepIndex: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const win = window as any;
      if (win.Telegram?.WebApp?.showPopup) {
        try {
          win.Telegram.WebApp.showPopup({
            title: `Sponsored Reward #${stepIndex + 1}`,
            message: 'Viewing sponsored advertisement step to unlock your download...',
            buttons: [
              { id: 'complete', type: 'ok', text: 'I have completed viewing' },
              { id: 'cancel', type: 'cancel', text: 'Cancel' }
            ]
          }, (buttonId: string) => {
            if (buttonId === 'complete') {
              resolve(true);
            } else {
              reject(new Error('Reward ad was cancelled.'));
            }
          });
        } catch (err) {
          reject(err);
        }
      } else {
        // If not in Telegram WebApp, simulate dev flow with 2s delay
        setTimeout(() => resolve(true), 2000);
      }
    });
  }
}

/**
 * Factory to get the active Ad Provider from settings or configuration
 */
export function getAdRewardProvider(
  config?: RewardedAdConfig | null
): AdRewardProvider {
  const activeConfig = config || DEFAULT_REWARDED_CONFIG;
  const providerType = activeConfig.provider || 'monetag';

  switch (providerType) {
    case 'monetag':
      return new MonetagAdProvider(activeConfig.monetag);
    case 'custom':
      return new CustomAdProvider(activeConfig.custom);
    case 'telegram':
      return new TelegramAdProvider();
    case 'mock':
      return new MockAdProvider();
    default:
      return new MonetagAdProvider(activeConfig.monetag);
  }
}

