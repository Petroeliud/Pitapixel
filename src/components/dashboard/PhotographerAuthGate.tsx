import React, { useState } from 'react';
import { ShieldAlert, Lock, ArrowRight, User, Check, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Photographer } from '../../types';
import { GoogleSignInModal } from '../common/GoogleSignInModal';

interface PhotographerAuthGateProps {
  photographer: Photographer;
  children: React.ReactNode;
  onReturnToGallery: () => void;
}

export const PhotographerAuthGate: React.FC<PhotographerAuthGateProps> = ({
  photographer,
  children,
  onReturnToGallery,
}) => {
  const { user, signOut } = useAuth();
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  // The designated admin user ID and authorized photographer emails
  const ADMIN_UID = '0OExGqOkojNlshcGghVEpNzeNWj2';
  const AUTHORIZED_EMAILS = [
    'petroeliud04@gmail.com',
    (photographer.email || '').toLowerCase().trim(),
  ].filter(Boolean);

  // Check if current user is authorized as the designated admin or photographer
  const isAuthorizedPhotographer = Boolean(
    user && (
      user.uid === ADMIN_UID ||
      (user.email && AUTHORIZED_EMAILS.includes(user.email.toLowerCase().trim()))
    )
  );

  // If authorized, render dashboard
  if (isAuthorizedPhotographer) {
    return <>{children}</>;
  }

  // State A: User is logged in, but their account is NOT the authorized photographer/admin account
  if (user && !isAuthorizedPhotographer) {
    return (
      <div className="flex min-h-[90vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-rose-200 bg-white p-8 text-center shadow-lg dark:border-rose-900/60 dark:bg-zinc-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-zinc-900 dark:text-white">
            Access Denied
          </h2>

          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The signed-in account{' '}
            <strong className="text-zinc-900 dark:text-white font-semibold">
              {user.email || user.displayName || user.uid}
            </strong>{' '}
            is not authorized to manage this dashboard.
          </p>

          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-left text-xs dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">
              Authorized Accounts:
            </span>
            <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
              petroeliud04@gmail.com
            </span>
            {photographer.email && photographer.email !== 'petroeliud04@gmail.com' && (
              <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 block mt-0.5">
                {photographer.email}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => {
                signOut();
                setGoogleModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign In with Authorized Account</span>
            </button>

            <button
              onClick={onReturnToGallery}
              className="mt-2 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              ← Return to Client Gallery
            </button>
          </div>
        </div>

        <GoogleSignInModal
          isOpen={googleModalOpen}
          onClose={() => setGoogleModalOpen(false)}
          galleryTitle="Photographer Portal"
        />
      </div>
    );
  }

  // State B: User is not logged in at all — Only authorized Google account can sign in
  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          <Lock className="h-6 w-6" />
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Photographer Portal
        </h2>

        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          This dashboard is strictly private. Only the authorized photographer can sign in to manage galleries and deliveries.
        </p>

        <div className="mt-6 space-y-3">
          <button
            onClick={() => setGoogleModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer shadow-xs"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
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

          <div className="pt-3">
            <button
              onClick={onReturnToGallery}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              ← Back to Client Gallery
            </button>
          </div>
        </div>
      </div>

      <GoogleSignInModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        galleryTitle="Photographer Portal"
      />
    </div>
  );
};
