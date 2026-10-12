import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  loginWithClientDetails,
  loginWithEmailPassword,
  registerPhotographerWithEmailPassword,
  logoutUser,
  AppUserProfile,
} from '../storage/firebase';

const CLIENT_SESSION_KEY = 'pitapixel_client_user';

interface AuthContextType {
  user: AppUserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, brandName?: string) => Promise<void>;
  signInAsClient: (email: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  registerWithEmail: async () => {},
  signInAsClient: async () => {},
  signOut: async () => {},
  clearAuthError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(CLIENT_SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        const profile: AppUserProfile = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL,
        };
        setUser(profile);
        try {
          localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(profile));
        } catch {}
      } else {
        // If not authenticated via Firebase, check if local client session exists
        try {
          const saved = localStorage.getItem(CLIENT_SESSION_KEY);
          if (!saved) {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setAuthError(null);
      const profile = await loginWithGoogle();
      setUser(profile);
      try {
        localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(profile));
      } catch {}
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setAuthError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const handleClientSignIn = async (email: string, name: string) => {
    try {
      setAuthError(null);
      const profile = await loginWithClientDetails(email, name);
      setUser(profile);
      try {
        localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(profile));
      } catch {}
    } catch (err: any) {
      console.error('Client sign in error:', err);
      setAuthError(err.message || 'Failed to sign in');
      throw err;
    }
  };

  const handleEmailSignIn = async (email: string, pass: string) => {
    try {
      setAuthError(null);
      const profile = await loginWithEmailPassword(email, pass);
      setUser(profile);
      try {
        localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(profile));
      } catch {}
    } catch (err: any) {
      console.error('Email sign in error:', err);
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'Invalid email or password.'
        : err.message || 'Failed to sign in.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const handleEmailRegister = async (email: string, pass: string, brandName?: string) => {
    try {
      setAuthError(null);
      const profile = await registerPhotographerWithEmailPassword(email, pass, brandName);
      setUser(profile);
      try {
        localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(profile));
      } catch {}
    } catch (err: any) {
      console.error('Registration error:', err);
      const msg = err.code === 'auth/email-already-in-use'
        ? 'This email address is already registered. Please sign in.'
        : err.code === 'auth/weak-password'
        ? 'Password must be at least 6 characters.'
        : err.message || 'Registration failed.';
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err: any) {
      console.warn('Sign out error:', err);
    } finally {
      setUser(null);
      setFirebaseUser(null);
      try {
        localStorage.removeItem(CLIENT_SESSION_KEY);
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        authError,
        signInWithGoogle: handleSignIn,
        signInWithEmail: handleEmailSignIn,
        registerWithEmail: handleEmailRegister,
        signInAsClient: handleClientSignIn,
        signOut: handleSignOut,
        clearAuthError: () => setAuthError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
