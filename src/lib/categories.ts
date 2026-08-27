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
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db, cleanFirestoreData } from './firebase';
import { Category } from '../types';
import { appCache } from './cache';

const CATEGORIES_COLLECTION = 'categories';
const CACHE_KEY_CATEGORIES = 'all_categories';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Fetch all enabled categories (for public navigation)
 */
export async function getPublicCategories(): Promise<Category[]> {
  const cached = appCache.get<Category[]>(CACHE_KEY_CATEGORIES);
  if (cached) return cached;

  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('enabled', '==', true),
      orderBy('order', 'asc')
    );
    const snap = await getDocs(q);
    const categories: Category[] = [];

    snap.forEach((docSnap) => {
      categories.push({ id: docSnap.id, ...docSnap.data() } as Category);
    });

    appCache.set(CACHE_KEY_CATEGORIES, categories, CACHE_TTL);
    return categories;
  } catch (err) {
    console.error('Error fetching public categories:', err);
    // Fallback: try fetching all without composite index requirements if needed
    try {
      const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
      const categories: Category[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Category;
        if (data.enabled !== false) {
          categories.push({ id: docSnap.id, ...data });
        }
      });
      categories.sort((a, b) => (a.order || 0) - (b.order || 0));
      return categories;
    } catch (fallbackErr) {
      console.error('Fallback category fetch failed:', fallbackErr);
      return [];
    }
  }
}

/**
 * Fetch all categories (for admin management)
 */
export async function getAllCategoriesForAdmin(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const categories: Category[] = [];
    snap.forEach((docSnap) => {
      categories.push({ id: docSnap.id, ...docSnap.data() } as Category);
    });
    categories.sort((a, b) => (a.order || 0) - (b.order || 0));
    return categories;
  } catch (err) {
    console.error('Error fetching admin categories:', err);
    return [];
  }
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const cacheKey = `cat_slug_${slug}`;
  const cached = appCache.get<Category>(cacheKey);
  if (cached) return cached;

  try {
    const q = query(collection(db, CATEGORIES_COLLECTION), where('slug', '==', slug));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    const cat = { id: docSnap.id, ...docSnap.data() } as Category;
    appCache.set(cacheKey, cat, CACHE_TTL);
    return cat;
  } catch (err) {
    console.error(`Error fetching category slug ${slug}:`, err);
    return null;
  }
}

/**
 * Create a new category
 */
export async function createCategory(cat: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  const newRef = doc(collection(db, CATEGORIES_COLLECTION));
  const newCat: Category = {
    ...cat,
    id: newRef.id,
    postCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const payload = cleanFirestoreData({
    ...newCat,
    serverCreatedAt: serverTimestamp(),
    serverUpdatedAt: serverTimestamp()
  });

  await setDoc(newRef, payload);

  appCache.invalidate(CACHE_KEY_CATEGORIES);
  appCache.invalidatePrefix('cat_');
  return newCat;
}

/**
 * Update an existing category
 */
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const catRef = doc(db, CATEGORIES_COLLECTION, id);
  const payload = cleanFirestoreData({
    ...updates,
    updatedAt: Date.now(),
    serverUpdatedAt: serverTimestamp()
  });

  await setDoc(catRef, payload, { merge: true });

  appCache.invalidate(CACHE_KEY_CATEGORIES);
  appCache.invalidatePrefix('cat_');
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
  const catRef = doc(db, CATEGORIES_COLLECTION, id);
  await deleteDoc(catRef);

  appCache.invalidate(CACHE_KEY_CATEGORIES);
  appCache.invalidatePrefix('cat_');
}
