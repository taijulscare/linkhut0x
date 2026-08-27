/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  FirebaseUser, 
  syncUserProfile, 
  loginWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  logoutUser,
  db,
  PRIMARY_ADMIN_EMAIL
} from '../lib/firebase';
import { UserProfile } from '../types';
import { doc, updateDoc } from 'firebase/firestore';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  promoteToAdmin: (uid: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshProfile = async () => {
    if (auth.currentUser) {
      try {
        const userProf = await syncUserProfile(auth.currentUser);
        setProfile(userProf);
      } catch (err: any) {
        console.error('Failed to refresh user profile:', err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProf = await syncUserProfile(currentUser);
          setProfile(userProf);
        } catch (err: any) {
          console.error('Error fetching user profile in auth listener:', err);
          // Fallback profile object
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            photoURL: currentUser.photoURL,
            role: currentUser.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user',
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithGoogle();
      setUser(res.user);
      setProfile(res.profile);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginWithEmail(email, pass);
      setUser(res.user);
      setProfile(res.profile);
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      setError(err.message || 'Invalid email or password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (email: string, pass: string, name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await registerWithEmail(email, pass, name);
      setUser(res.user);
      setProfile(res.profile);
    } catch (err: any) {
      console.error('Email Sign Up Error:', err);
      setError(err.message || 'Failed to register account');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      console.error('Logout Error:', err);
      setError(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const promoteToAdmin = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role: 'admin', updatedAt: Date.now() });
      if (user && user.uid === uid) {
        setProfile(prev => prev ? { ...prev, role: 'admin' } : null);
      }
    } catch (err: any) {
      console.error('Failed to promote user:', err);
      throw err;
    }
  };

  const isAdmin = Boolean(
    profile?.role === 'admin' ||
    user?.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        error,
        clearError,
        signInWithGoogle: handleGoogleSignIn,
        signInWithEmail: handleEmailSignIn,
        signUpWithEmail: handleEmailSignUp,
        logout: handleLogout,
        refreshProfile,
        promoteToAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
