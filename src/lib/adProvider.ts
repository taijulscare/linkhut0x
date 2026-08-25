/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdRewardProvider } from '../types';

/**
 * Mock Ad Provider for development and demonstration purposes.
 * Simulates real rewarded video / interstitial ad flows with a timer and completion event.
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
 * Monetag Rewarded Ad Provider
 * Integrates with Monetag's In-App / On-Click / Rewarded Interstitial SDK.
 */
export class MonetagAdProvider implements AdRewardProvider {
  name = 'Monetag Rewarded';

  async showRewardedAd(stepIndex: number): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // Check if Monetag global object or tag is present on window
        const win = window as any;
        if (typeof win.show_rewarded === 'function') {
          win.show_rewarded().then(() => {
            resolve(true);
          }).catch((err: any) => {
            console.warn('Monetag ad failed or dismissed:', err);
            // If ad fails in dev, allow fallback
            resolve(false);
          });
        } else {
          // If Monetag script is not yet injected or running in development
          console.info(`[Monetag Adapter] SDK not detected on window, simulating fallback completion for step #${stepIndex + 1}.`);
          setTimeout(() => resolve(true), 2000);
        }
      } catch (err) {
        console.error('Monetag provider error:', err);
        resolve(false);
      }
    });
  }
}

/**
 * Telegram Mini App Ads Provider
 * Supports Telegram Mini App rewarded ads if opened inside Telegram WebApp
 */
export class TelegramAdProvider implements AdRewardProvider {
  name = 'Telegram Mini App Ads';

  async showRewardedAd(stepIndex: number): Promise<boolean> {
    return new Promise((resolve) => {
      const win = window as any;
      if (win.Telegram?.WebApp) {
        // Trigger Telegram Mini App specific popup/ad action
        win.Telegram.WebApp.showPopup({
          title: `Reward Ad #${stepIndex + 1}`,
          message: 'Viewing sponsored advertisement step to unlock your download...',
          buttons: [{ type: 'ok', text: 'Complete Step' }]
        }, (buttonId: string) => {
          resolve(true);
        });
      } else {
        // Fallback simulation
        setTimeout(() => resolve(true), 2000);
      }
    });
  }
}

/**
 * Factory to get the active Ad Provider
 */
export function getAdRewardProvider(providerType: 'mock' | 'monetag' | 'telegram' = 'mock'): AdRewardProvider {
  switch (providerType) {
    case 'monetag':
      return new MonetagAdProvider();
    case 'telegram':
      return new TelegramAdProvider();
    case 'mock':
    default:
      return new MockAdProvider();
  }
}
