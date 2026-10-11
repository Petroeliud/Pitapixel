import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  loginWithClientDetails,
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
