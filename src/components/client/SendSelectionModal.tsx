import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { recordActivity } from '../../storage/db';
import { useAuth } from '../../context/AuthContext';

interface SendSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  galleryId: string;
  favoritedCount: number;
  onSuccess?: () => void;
}

export const SendSelectionModal: React.FC<SendSelectionModalProps> = ({
  isOpen,
  onClose,
  galleryId,
  favoritedCount,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.displayName && !name) setName(user.displayName);
      if (user.email && !email) setEmail(user.email);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const details = `Selection of ${favoritedCount} favorites sent by ${name || 'Client'}${email ? ` (${email})` : ''}${notes ? `: "${notes}"` : ''}`;
      await recordActivity(galleryId, 'selection_sent', details);
      setSubmitted(true);
      onSuccess?.();
      setTimeout(() => {
        setSubmitted(false);
        setIsSubmitting(false);
        setName('');
        setEmail('');
        setNotes('');
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Error sending selection:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
              Send Selection
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Notify photographer with your {favoritedCount} favorited {favoritedCount === 1 ? 'photo' : 'photos'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
              <Check className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Selection Delivered
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your photographer has received your favorites list.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elena Rostova"
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Email Address (optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena@example.com"
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Notes for Photographer (optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Here are our selections for the wedding album print..."
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 focus:border-zinc-900 focus:outline-hidden dark:border-zinc-800 dark:bg-zinc-800 dark:text-white dark:focus:border-zinc-100"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <span>Send to Photographer</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
