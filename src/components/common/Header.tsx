/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { 
  ShieldCheck, 
  Search, 
  Menu, 
  X, 
  Clapperboard, 
  Lock, 
  Home, 
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'admin' | 'admin-login';
  onNavigate: (view: 'home' | 'admin' | 'admin-login') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { user, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div 
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Clapperboard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-100 tracking-tight block leading-tight">
                ContentHub
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">
                Premium Entertainment
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-3">
            <button
              id="nav-home-link"
              type="button"
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${currentView === 'home' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
            >
              <Home className="w-3.5 h-3.5" />
              <span> Home</span>
            </button>

            {isAdmin ? (
              <button
                id="nav-admin-panel-link"
                type="button"
                onClick={() => onNavigate('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${currentView === 'admin' ? 'bg-indigo-600 text-white' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20'}`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Console</span>
              </button>
            ) : (
              <button
                id="nav-admin-login-link"
                type="button"
                onClick={() => onNavigate('admin-login')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${currentView === 'admin-login' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </button>
            )}

            <div className="h-4 w-[1px] bg-slate-800 mx-1" />
            <ThemeToggle />
          </nav>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900 px-4 pt-2 pb-4 space-y-2">
          <button
            id="mobile-nav-home"
            type="button"
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2"
          >
            <Home className="w-4 h-4 text-indigo-400" />
            <span>Public Home</span>
          </button>

          {isAdmin ? (
            <button
              id="mobile-nav-admin"
              type="button"
              onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Admin Console</span>
            </button>
          ) : (
            <button
              id="mobile-nav-login"
              type="button"
              onClick={() => { onNavigate('admin-login'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-2"
            >
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Admin Portal Login</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
