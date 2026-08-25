/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

// Default target admin email from environment/metadata
export const PRIMARY_ADMIN_EMAIL = 'azizul01910996061@gmail.com';

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
  measurementId: firebaseConfigJson.measurementId || undefined
};

// Initialize Firebase App instance
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with custom database ID if specified in config
export const db: Firestore = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sync or create user profile document in Firestore
 */
export async function syncUserProfile(user: FirebaseUser): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  const isPrimaryAdmin = user.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();

  if (!snapshot.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL,
      role: isPrimaryAdmin ? 'admin' : 'user',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await setDoc(userRef, {
      ...newProfile,
      serverCreatedAt: serverTimestamp(),
      serverUpdatedAt: serverTimestamp()
    });

    return newProfile;
  } else {
    const data = snapshot.data();
    // Ensure primary admin always retains admin role
    const currentRole = isPrimaryAdmin ? 'admin' : (data.role || 'user');
    
    if (isPrimaryAdmin && data.role !== 'admin') {
      await updateDoc(userRef, { role: 'admin', updatedAt: Date.now() });
    }

    return {
      uid: user.uid,
      email: user.email || data.email || null,
      displayName: user.displayName || data.displayName || 'User',
      photoURL: user.photoURL || data.photoURL || null,
      role: currentRole,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now()
    };
  }
}

/**
 * Sign In with Google popup
 */
export async function loginWithGoogle(): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const result = await signInWithPopup(auth, googleProvider);
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
}

/**
 * Sign In with Email and Password
 */
export async function loginWithEmail(email: string, password: string): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
}

/**
 * Sign Up with Email and Password
 */
export async function registerWithEmail(email: string, password: string, displayName?: string): Promise<{ user: FirebaseUser; profile: UserProfile }> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const profile = await syncUserProfile(result.user);
  return { user: result.user, profile };
}

/**
 * Sign Out
 */
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };
