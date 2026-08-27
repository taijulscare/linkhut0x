/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/common/Header';
import { PublicPortalHome } from './components/home/PublicPortalHome';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';

function MainApp() {
  const { user, isAdmin, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'admin-login'>('home');
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);

  // Sync with browser hash / history if desired
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/post/')) {
        const slug = hash.replace('/post/', '');
        setSelectedPostSlug(slug);
        setCurrentView('home');
      } else if (hash === '/admin') {
        setCurrentView('admin');
      } else if (hash === '/login') {
        setCurrentView('admin-login');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectPostSlug = (slug: string | null) => {
    setSelectedPostSlug(slug);
    if (slug) {
      window.location.hash = `/post/${slug}`;
    } else {
      window.location.hash = '';
    }
  };

  const handleNavigate = (view: 'home' | 'admin' | 'admin-login') => {
    setCurrentView(view);
    if (view === 'home') {
      setSelectedPostSlug(null);
      window.location.hash = '';
    } else if (view === 'admin') {
      window.location.hash = '/admin';
    } else if (view === 'admin-login') {
      window.location.hash = '/login';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Initializing App & Auth...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentView === 'admin') {
      if (isAdmin) {
        return <AdminLayout onNavigateHome={() => handleNavigate('home')} />;
      } else {
        return (
          <div className="py-12 px-4 flex justify-center">
            <AdminLogin onSuccess={() => handleNavigate('admin')} />
          </div>
        );
      }
    }

    if (currentView === 'admin-login') {
      return (
        <div className="py-12 px-4 flex justify-center">
          <AdminLogin onSuccess={() => handleNavigate(isAdmin ? 'admin' : 'home')} />
        </div>
      );
    }

    return (
      <PublicPortalHome
        selectedPostSlug={selectedPostSlug}
        onSelectPostSlug={handleSelectPostSlug}
        onNavigateAdmin={() => handleNavigate('admin')}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-200">
      {currentView !== 'admin' && (
        <Header 
          currentView={currentView}
          onNavigate={handleNavigate}
        />
      )}
      
      <main className="flex-1">
        {renderContent()}
      </main>

      {currentView !== 'admin' && (
<footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 py-8 px-4 text-center text-xs text-slate-500 transition-colors">
  <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
    <p>© 2026 Content Hub Platform. All rights reserved.</p>

    <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
      <button 
        type="button" 
        onClick={() => handleNavigate('/dmca.html')}
        className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
       App Access
      </button>
      <span>•</span>
      <span>Features Integrated</span>
      <span>•</span>
      <span className="text-emerald-600 dark:text-emerald-400 font-medium">App Live</span>
    </div>
  </div>

  <p className="mt-4 max-w-5xl mx-auto">
    <strong>Disclaimer:</strong> ContentHub does not host or store files. We only link to third-party content and are not responsible for its content or legality. For copyright concerns, please{' '}
    <a
      href="mailto:wufepekequ34@gmail.com"
      className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
    >
      submit a DMCA notice
    </a>{' '}
    at wufepekequ34@gmail.com.
  </p>
</footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
