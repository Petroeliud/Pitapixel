import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldAlert, KeyRound } from 'lucide-react';
import { Photographer } from '../../types';
import { loginAdmin, getAdminPasswordToken } from '../../lib/api';

interface PhotographerAuthGateProps {
  photographer: Photographer;
  children: React.ReactNode;
  onReturnToGallery: () => void;
}

export const PhotographerAuthGate: React.FC<PhotographerAuthGateProps> = ({
  children,
  onReturnToGallery,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(getAdminPasswordToken());
  });

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const result = await loginAdmin(password.trim());
      if (result.success) {
        setIsAuthenticated(true);
      } else {
        setError(result.error || 'Incorrect admin password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // If authenticated as admin, render photographer dashboard
  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          <KeyRound className="h-5 w-5" />
        </div>

        <h2 className="mt-4 text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
          Photographer Admin Login
        </h2>

        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          Enter your photographer password to manage galleries and client deliveries.
        </p>

        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-3">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Admin password"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-white"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-left text-[11px] text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-2.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white cursor-pointer"
          >
            {loading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onReturnToGallery}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            ← Back to Client Gallery
          </button>
        </div>
      </div>
    </div>
  );
};
