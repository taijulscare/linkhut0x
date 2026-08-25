/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { AdUnit, AdPlacement, SiteSettings } from '../types';
import { appCache } from './cache';

const ADS_COLLECTION = 'ads';
const SETTINGS_COLLECTION = 'settings';
const SETTINGS_DOC_ID = 'site_settings';
const CACHE_KEY_ADS = 'active_ads';
const CACHE_KEY_SETTINGS = 'site_settings';
const CACHE_TTL = 10 * 60 * 1000;

/**
 * Fetch all active ad units
 */
export async function getActiveAdUnits(): Promise<AdUnit[]> {
  const cached = appCache.get<AdUnit[]>(CACHE_KEY_ADS);
  if (cached) return cached;

  try {
    const q = query(collection(db, ADS_COLLECTION), where('active', '==', true));
    const snap = await getDocs(q);
    const ads: AdUnit[] = [];
    snap.forEach(d => {
      ads.push({ id: d.id, ...d.data() } as AdUnit);
    });
    appCache.set(CACHE_KEY_ADS, ads, CACHE_TTL);
    return ads;
  } catch (err) {
    console.error('Error fetching active ad units:', err);
    return [];
  }
}

/**
 * Fetch all ad units for Admin
 */
export async function getAllAdUnitsForAdmin(): Promise<AdUnit[]> {
  try {
    const snap = await getDocs(collection(db, ADS_COLLECTION));
    const ads: AdUnit[] = [];
    snap.forEach(d => {
      ads.push({ id: d.id, ...d.data() } as AdUnit);
    });
    return ads;
  } catch (err) {
    console.error('Error fetching admin ad units:', err);
    return [];
  }
}

/**
 * Create or save an ad unit
 */
export async function saveAdUnit(ad: Omit<AdUnit, 'id' | 'createdAt' | 'updatedAt'>, id?: string): Promise<AdUnit> {
  const adRef = id ? doc(db, ADS_COLLECTION, id) : doc(collection(db, ADS_COLLECTION));
  const newAd: AdUnit = {
    ...ad,
    id: adRef.id,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  await setDoc(adRef, {
    ...newAd,
    serverUpdatedAt: serverTimestamp()
  }, { merge: true });

  appCache.invalidate(CACHE_KEY_ADS);
  return newAd;
}

/**
 * Delete an ad unit
 */
export async function deleteAdUnit(id: string): Promise<void> {
  const ref = doc(db, ADS_COLLECTION, id);
  await deleteDoc(ref);
  appCache.invalidate(CACHE_KEY_ADS);
}

/**
 * Get Site Settings
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  const cached = appCache.get<SiteSettings>(CACHE_KEY_SETTINGS);
  if (cached) return cached;

  const defaultSettings: SiteSettings = {
    id: SETTINGS_DOC_ID,
    siteName: 'Content Hub',
    siteDescription: 'Discover and download verified premium videos and photos with dynamic reward unlocks.',
    defaultTheme: 'dark',
    defaultRequiredAds: 2,
    postsPerPage: 10,
    adFrequency: 4,
    monetizationEnabled: true,
    downloadTimerSeconds: 3,
    socialLinks: {
      telegram: 'https://t.me/linkhut0',
      twitter: 'https://twitter.com/',
      github: 'https://github.com/'
    },
    contactEmail: 'wufepekequ34@gmail.com',
    updatedAt: Date.now()
  };

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      return defaultSettings;
    }
    const settings = { ...defaultSettings, ...snap.data() } as SiteSettings;
    appCache.set(CACHE_KEY_SETTINGS, settings, CACHE_TTL);
    return settings;
  } catch (err) {
    console.error('Error fetching site settings:', err);
    return defaultSettings;
  }
}

/**
 * Update Site Settings
 */
export async function updateSiteSettings(updates: Partial<SiteSettings>): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC_ID);
  await setDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
    serverUpdatedAt: serverTimestamp()
  }, { merge: true });

  appCache.invalidate(CACHE_KEY_SETTINGS);
}
