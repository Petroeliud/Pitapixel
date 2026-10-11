import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, User, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryTitle?: string;
  coverThumbUrl?: string;
}

export const GoogleSignInModal: React.FC<GoogleSignInModalProps> = ({
  isOpen,
  onClose,
  galleryTitle,
  coverThumbUrl,
}) => {
  const { signInWithGoogle, signInAsClient, authError, clearAuthError } = useAuth();
  const [mode, setMode] = useState<'options' | 'email'>('options');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleClick = async () => {
    try {
      setLocalError(null);
      clearAuthError();
      setSubmitting(true);
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      // If user closed or cancelled popup, offer direct email entry
      setLocalError(err.message || 'Could not complete Google sign-in. You can enter your email directly.');
      setMode('email');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setLocalError('Please enter a valid Google email address.');
      return;
    }
    try {
      setSubmitting(true);
      setLocalError(null);
      await signInAsClient(email, name);
      onClose();
    } catch (err: any) {
      setLocalError(err.message || 'Failed to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight uppercase text-zinc-900 dark:text-white">
              Pitapixel
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Client Access</span>
          </div>
          <button
            onClick={() => {
              clearAuthError();
              onClose();
            }}
            aria-label="Close"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Gallery Preview Thumbnail & Title */}
        {galleryTitle && (
          <div className="mt-4 flex items-center gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950">
            {coverThumbUrl ? (
              <img
                src={coverThumbUrl}
                alt={galleryTitle}
                className="h-12 w-12 rounded object-cover shrink-0"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-200 dark:bg-zinc-800 shrink-0 text-zinc-400">
                <Lock className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                Photo Gallery
              </p>
              <h4 className="truncate text-xs font-semibold text-zinc-900 dark:text-white">
                {galleryTitle}
              </h4>
            </div>
          </div>
        )}

        <div className="mt-5 text-center">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
            Sign in to your client gallery
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Save favorites, track photo selections, and access high-resolution downloads.
          </p>
        </div>

        {(localError || authError) && (
          <div className="mt-3.5 flex items-start gap-2 rounded-md bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <p className="flex-1">{localError || authError}</p>
          </div>
        )}

        {mode === 'options' ? (
          <div className="mt-5 space-y-3">
            <button
              onClick={handleGoogleClick}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2.5 rounded-md border border-zinc-300 bg-white py-2.5 px-4 text-xs font-medium text-zinc-800 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-750"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
              <span>{submitting ? 'Connecting Google...' : 'Sign in with Google'}</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
              <span className="bg-white dark:bg-zinc-900 px-2 text-[11px] text-zinc-400 absolute">
                or
              </span>
            </div>

            <button
              onClick={() => setMode('email')}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-2.5 px-4 text-xs font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Enter Google Email Directly</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="mt-5 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                Your Google Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@gmail.com"
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elena Vance"
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('options')}
                className="w-1/3 rounded-md border border-zinc-200 py-2 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-md bg-zinc-900 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {submitting ? 'Signing in...' : 'Continue to Gallery'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <button
            onClick={onClose}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            Continue browsing as guest
          </button>
        </div>
      </div>
    </div>
  );
};
