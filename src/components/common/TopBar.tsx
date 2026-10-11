import React, { useState } from 'react';
import { Sun, Moon, Share2, ExternalLink, LogOut, User } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInModal } from './GoogleSignInModal';

interface TopBarProps {
  currentView: 'client' | 'dashboard';
  onNavigate: (view: 'client' | 'dashboard') => void;
  galleryTitle?: string;
  brandName?: string;
  coverThumbUrl?: string;
  onShareClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  galleryTitle,
  brandName,
  coverThumbUrl,
  onShareClick,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, authError, clearAuthError } = useAuth();
  const [userDropdown, setUserDropdown] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-xs transition-colors dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-left">
            <span className="text-base font-bold tracking-tight text-zinc-900 uppercase dark:text-zinc-100">
              PITAPIXEL
            </span>
            <span className="hidden text-xs text-zinc-300 sm:inline dark:text-zinc-700" aria-hidden="true">
              ·
            </span>
            <span className="hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400">
              {brandName || 'Client Photo Delivery'}
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation (Only shown in dashboard) */}
        <div className="flex items-center gap-2">
          {currentView === 'dashboard' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-900 dark:text-white px-2 py-1">
                Photographer Portal
              </span>
              <button
                onClick={() => onNavigate('client')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <span>View Client Gallery</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Zone 3: Actions (Google Login, Share & Theme Toggle) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Google Sign-in / User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdown((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-1 pr-2.5 text-xs text-zinc-800 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-6 w-6 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] text-white dark:bg-white dark:text-zinc-900">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
                <span className="hidden max-w-[100px] truncate sm:inline">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </button>

              {userDropdown && (
                <div className="absolute right-0 top-10 z-50 w-48 rounded-md border border-zinc-200 bg-white p-2 text-xs shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">
                      {user.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setUserDropdown(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setSignInModalOpen(true)}
              title="Sign in with Google Account"
              className="flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}

          {onShareClick && currentView === 'client' && (
            <button
              onClick={onShareClick}
              title="Share Gallery Link"
              aria-label="Share Gallery Link"
              className="flex h-8 w-8 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-hidden dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <Share2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
            className="flex h-8 w-8 items-center justify-center text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:outline-hidden dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {authError && (
        <div className="bg-amber-50 px-4 py-1.5 text-[11px] text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border-t border-amber-200 dark:border-amber-900 flex items-center justify-between">
          <span>{authError}</span>
          <button
            onClick={clearAuthError}
            className="text-amber-600 hover:text-amber-900 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Google Sign-in Modal for Clients */}
      <GoogleSignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        galleryTitle={galleryTitle}
        coverThumbUrl={coverThumbUrl}
      />
    </header>
  );
};
