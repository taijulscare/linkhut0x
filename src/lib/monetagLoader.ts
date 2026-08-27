/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RewardedMonetagConfig } from '../types';

const loadedScripts = new Map<string, Promise<boolean>>();

/**
 * Loads the Monetag SDK script dynamically with the specified zone and SDK function name.
 * Prevents duplicate script injection and verifies global function readiness.
 */
export async function loadMonetagSdk(config: RewardedMonetagConfig): Promise<boolean> {
  const zoneId = (config.zoneId || '').trim();
  const sdkFunctionName = (config.sdkFunctionName || `show_${zoneId}`).trim();
  const scriptUrl = (config.scriptUrl || '//libtl.com/sdk.js').trim();

  if (!zoneId) {
    throw new Error('Monetag Zone ID is not configured.');
  }

  // If already available on window, return true
  if (typeof (window as any)[sdkFunctionName] === 'function') {
    return true;
  }

  const cacheKey = `${zoneId}_${sdkFunctionName}_${scriptUrl}`;
  if (loadedScripts.has(cacheKey)) {
    return loadedScripts.get(cacheKey)!;
  }

  const loadPromise = new Promise<boolean>((resolve, reject) => {
    // Check if script tag already exists in DOM
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[data-zone="${zoneId}"], script[data-sdk="${sdkFunctionName}"]`
    );

    const waitForGlobalFunction = (maxAttempts = 30, intervalMs = 250): Promise<boolean> => {
      return new Promise((res, rej) => {
        let attempts = 0;
        const check = () => {
          attempts++;
          if (typeof (window as any)[sdkFunctionName] === 'function') {
            res(true);
          } else if (attempts >= maxAttempts) {
            rej(new Error(`Monetag SDK loaded but function window.${sdkFunctionName} is not available.`));
          } else {
            setTimeout(check, intervalMs);
          }
        };
        check();
      });
    };

    if (existingScript) {
      waitForGlobalFunction()
        .then(() => resolve(true))
        .catch(err => {
          console.warn('[Monetag Loader] SDK polling warning:', err);
          // Check if function is available anyway
          if (typeof (window as any)[sdkFunctionName] === 'function') {
            resolve(true);
          } else {
            reject(err);
          }
        });
      return;
    }

    // Create and inject the script tag
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.setAttribute('data-zone', zoneId);
    script.setAttribute('data-sdk', sdkFunctionName);
    script.async = true;

    let isResolved = false;

    script.onload = () => {
      waitForGlobalFunction()
        .then(() => {
          if (!isResolved) {
            isResolved = true;
            resolve(true);
          }
        })
        .catch(err => {
          if (!isResolved) {
            isResolved = true;
            reject(err);
          }
        });
    };

    script.onerror = (err) => {
      if (!isResolved) {
        isResolved = true;
        loadedScripts.delete(cacheKey);
        reject(new Error('Failed to load Monetag SDK script. Please check your network connection or ad blocker.'));
      }
    };

    // Safety timeout
    setTimeout(() => {
      if (!isResolved) {
        if (typeof (window as any)[sdkFunctionName] === 'function') {
          isResolved = true;
          resolve(true);
        } else {
          isResolved = true;
          loadedScripts.delete(cacheKey);
          reject(new Error(`Monetag SDK initialization timed out for function "${sdkFunctionName}".`));
        }
      }
    }, 12000);

    try {
      (document.head || document.body).appendChild(script);
    } catch (e) {
      if (!isResolved) {
        isResolved = true;
        loadedScripts.delete(cacheKey);
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    }
  });

  loadedScripts.set(cacheKey, loadPromise);
  return loadPromise;
}
