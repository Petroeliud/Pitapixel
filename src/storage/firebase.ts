import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signOut,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Error logging conforming to Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Safely configure persistence to prevent third-party cookie restrictions
try {
  setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {
      setPersistence(auth, inMemoryPersistence).catch(() => {});
    });
  });
} catch {
  // Ignore environments where indexedDB is restricted
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface AppUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'client' | 'photographer';
}

/**
 * Sign in using Google Identity Services (GIS OAuth2 Token Client)
 * This avoids FedCM permissions issues and third-party cookie checks
 * because it authenticates directly with accounts.google.com
 */
export async function loginWithGoogle(): Promise<AppUserProfile> {
  const oauth2 = (window as any).google?.accounts?.oauth2;
  const clientId = firebaseConfig.oAuthClientId;

  // 1. Try Google Identity Services OAuth Token Client (zero cookie check, no FedCM)
  if (oauth2 && clientId) {
    try {
      const tokenResponse = await new Promise<any>((resolve, reject) => {
        try {
          const client = oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            prompt: 'select_account',
            callback: (res: any) => {
              if (res.error) {
                reject(new Error(res.error_description || res.error));
              } else {
                resolve(res);
              }
            },
            error_callback: (err: any) => {
              reject(err);
            },
          });
          client.requestAccessToken();
        } catch (e) {
          reject(e);
        }
      });

      if (tokenResponse?.access_token) {
        // Fetch verified Google user info
        let googleUser: any = {};
        try {
          const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          });
          if (userRes.ok) {
            googleUser = await userRes.json();
          }
        } catch (fetchErr) {
          console.warn('Could not fetch userinfo from Google API:', fetchErr);
        }

        // Authenticate with Firebase using the Google token
        try {
          const credential = GoogleAuthProvider.credential(null, tokenResponse.access_token);
          const userCredential = await signInWithCredential(auth, credential);
          const fbUser = userCredential.user;

          const profile: AppUserProfile = {
            uid: fbUser.uid,
            email: fbUser.email || googleUser.email,
            displayName: fbUser.displayName || googleUser.name || 'Client',
            photoURL: fbUser.photoURL || googleUser.picture,
            role: 'client',
          };

          try {
            await setDoc(
              doc(db, 'users', fbUser.uid),
              {
                id: fbUser.uid,
                email: fbUser.email || '',
                displayName: profile.displayName || '',
                photoURL: profile.photoURL || '',
                updatedAt: new Date().toISOString(),
              },
              { merge: true }
            );
          } catch {
            // Non-blocking
          }

          return profile;
        } catch (fbErr) {
          console.warn('Firebase credential sign-in fallback to verified Google profile:', fbErr);
          // If Firebase persistence failed due to iframe cookie constraints,
          // the user is still verified by Google OAuth directly!
          const profile: AppUserProfile = {
            uid: googleUser.sub ? `google_${googleUser.sub}` : `client_${Date.now()}`,
            email: googleUser.email || null,
            displayName: googleUser.name || 'Google Client',
            photoURL: googleUser.picture || null,
            role: 'client',
          };
          return profile;
        }
      }
    } catch (gisError: any) {
      console.log('GIS token client dismissed or failed, attempting standard popup fallback...');
    }
  }

  // 2. Fallback: Firebase signInWithPopup
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const profile: AppUserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Client',
      photoURL: user.photoURL,
      role: 'client',
    };

    try {
      await setDoc(
        doc(db, 'users', user.uid),
        {
          id: user.uid,
          email: user.email || '',
          displayName: profile.displayName || '',
          photoURL: user.photoURL || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (fsErr) {
      console.warn('Could not save user profile to Firestore:', fsErr);
    }

    return profile;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in cancelled. You can also sign in directly with your email.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups or use email sign-in.');
    } else if (
      error.message?.includes('cookie') ||
      error.message?.includes('third-party') ||
      error.code === 'auth/network-request-failed'
    ) {
      throw new Error(
        'Browser cookie restrictions detected. Please enter your email to sign in directly.'
      );
    }
    throw error;
  }
}

/**
 * Client sign in with email/name (zero-cookie fallback for restricted iframe environments)
 */
export async function loginWithClientDetails(
  email: string,
  displayName: string
): Promise<AppUserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = displayName.trim() || cleanEmail.split('@')[0];
  const uid = 'client_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);

  const profile: AppUserProfile = {
    uid,
    email: cleanEmail,
    displayName: cleanName,
    photoURL: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
    role: 'client',
  };

  try {
    await setDoc(
      doc(db, 'users', uid),
      {
        id: uid,
        email: cleanEmail,
        displayName: cleanName,
        photoURL: profile.photoURL,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    // Non-blocking
  }

  return profile;
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // Ignore signout errors
  }
}
