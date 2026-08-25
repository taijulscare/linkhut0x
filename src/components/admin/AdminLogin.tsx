/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { PRIMARY_ADMIN_EMAIL } from '../../lib/firebase';

interface AdminLoginProps {
  onSuccess?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const { 
    user, 
    profile, 
    isAdmin, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    logout,
    error, 
    clearError 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalMessage(null);

    if (!email || !password) {
      setLocalMessage('Please fill in both email and password.');
      return;
    }

    setLoadingAction(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Error handled in AuthContext
    } finally {
      setLoadingAction(false);
    }
  };

  const handleGoogleAuth = async () => {
    clearError();
    setLocalMessage(null);
    setLoadingAction(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Error handled in AuthContext
    } finally {
      setLoadingAction(false);
    }
  };

  // If already logged in
  if (user) {
    return (
      <div className="max-w-md w-full mx-auto p-6 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 text-indigo-400">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-100 mb-1">Signed In</h2>
        <p className="text-sm text-slate-400 mb-4">{user.email}</p>

        <div className="mb-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Account Role</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${isAdmin ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
              {isAdmin ? 'Administrator' : 'Standard User'}
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono break-all">
            UID: {user.uid}
          </div>
        </div>

        {!isAdmin ? (
          <div className="p-3 mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2 text-left">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Restricted Access:</strong> Your account does not have admin permissions yet. Sign in as <code>moderator</code> or grant admin role in ContentHub.
            </div>
          </div>
        ) : (
          <div className="p-3 mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2 text-left">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Admin privileges verified. You can access all admin management tools.</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            id="admin-logout-btn"
            type="button"
            onClick={logout}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all"
          >
            Sign Out
          </button>
          {isAdmin && (
            <button
              id="admin-continue-btn"
              type="button"
              onClick={onSuccess}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <span>Go to Panel</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto p-6 sm:p-8 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Admin Portal</h1>
        <p className="text-xs text-slate-400 mt-1">
          Secure authentication for platform administrators
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6">
        <button
          id="tab-signin"
          type="button"
          onClick={() => { setMode('signin'); clearError(); }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'signin' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Sign In
        </button>
        <button
          id="tab-signup"
          type="button"
          onClick={() => { setMode('signup'); clearError(); }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'signup' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Register Admin
        </button>
      </div>

      {/* Errors / Warnings */}
      {(error || localMessage) && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <span>{error || localMessage}</span>
        </div>
      )}

      {/* Google Auth Button */}
      <button
        id="google-signin-btn"
        type="button"
        onClick={handleGoogleAuth}
        disabled={loadingAction}
        className="w-full py-2.5 px-4 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-all flex items-center justify-center gap-3 mb-4 shadow-sm hover:border-slate-600 disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"
          />
        </svg>
        <span>Continue with Google</span>
      </button>

      <div className="relative flex py-2 items-center mb-4">
        <div className="flex-grow border-t border-slate-800"></div>
        <span className="flex-shrink mx-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Or with credentials</span>
        <div className="flex-grow border-t border-slate-800"></div>
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                id="admin-name-input"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Admin Name"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              id="admin-email-input"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              id="admin-password-input"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
            />
          </div>
          {mode === 'signup' && (
            <p className="text-[11px] text-slate-500 mt-1">Minimum 6 characters</p>
          )}
        </div>

        <button
          id="admin-submit-btn"
          type="submit"
          disabled={loadingAction}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
        >
          {loadingAction ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>{mode === 'signin' ? 'Sign In to Panel' : 'Create Admin Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Admin Notice */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-start gap-2 text-[11px] text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
        <span>
          Primary Admin Email: <strong className="text-slate-300">************@****.com</strong>. Signing in with this email automatically acquires root admin permissions.
        </span>
      </div>
    </div>
  );
};
