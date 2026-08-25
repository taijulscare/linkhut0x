/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  doc, 
  updateDoc, 
  increment, 
  setDoc, 
  deleteDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

const VIEW_THROTTLE_MS = 60 * 60 * 1000; // 1 hour per post view count per visitor

/**
 * Increment view count with client-side deduplication throttle to avoid spamming Firestore writes
 */
export async function recordPostView(postId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const storageKey = `view_post_${postId}`;
  const lastViewTime = localStorage.getItem(storageKey);
  const now = Date.now();

  if (lastViewTime && now - parseInt(lastViewTime, 10) < VIEW_THROTTLE_MS) {
    // Already viewed recently, skip database write
    return false;
  }

  try {
    localStorage.setItem(storageKey, now.toString());
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      views: increment(1),
      lastViewAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.warn(`View count increment skipped/failed for post ${postId}:`, err);
    return false;
  }
}

/**
 * Check if the user has liked a post (checked locally or from likes collection)
 */
export function isPostLikedLocal(postId: string, userId?: string): boolean {
  if (typeof window === 'undefined') return false;
  const key = userId ? `liked_${userId}_${postId}` : `liked_anon_${postId}`;
  return localStorage.getItem(key) === 'true';
}

/**
 * Toggle like on a post
 */
export async function togglePostLike(
  postId: string, 
  userId?: string
): Promise<{ liked: boolean; newCountDelta: number }> {
  const currentLiked = isPostLikedLocal(postId, userId);
  const nextLiked = !currentLiked;
  const delta = nextLiked ? 1 : -1;
  const localKey = userId ? `liked_${userId}_${postId}` : `liked_anon_${postId}`;

  try {
    localStorage.setItem(localKey, nextLiked ? 'true' : 'false');
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(delta)
    });

    if (userId) {
      const likeDocId = `${userId}_${postId}`;
      const likeRef = doc(db, 'likes', likeDocId);
      if (nextLiked) {
        await setDoc(likeRef, {
          postId,
          userId,
          createdAt: Date.now(),
          serverCreatedAt: serverTimestamp()
        });
      } else {
        await deleteDoc(likeRef);
      }
    }

    return { liked: nextLiked, newCountDelta: delta };
  } catch (err) {
    console.error('Error toggling like:', err);
    // Revert local state on failure
    localStorage.setItem(localKey, currentLiked ? 'true' : 'false');
    throw err;
  }
}
