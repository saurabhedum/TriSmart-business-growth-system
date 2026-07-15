import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, AuthError } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const config = firebaseConfig as any;
const dbId = (config.firestoreDatabaseId === '(default)' || config.firestoreDatabaseId === 'default') ? undefined : config.firestoreDatabaseId;
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache()
}, dbId);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://mail.google.com/');
googleProvider.addScope('https://www.googleapis.com/auth/contacts');
googleProvider.addScope('https://www.googleapis.com/auth/forms.body');
googleProvider.addScope('https://www.googleapis.com/auth/directory.readonly');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const getAccessToken = () => cachedAccessToken;

export const loginWithGoogle = async (): Promise<boolean> => {
  if (isSigningIn) return false;
  isSigningIn = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return true;
  } catch (error) {
    const authError = error as AuthError;
    if (authError.code === 'auth/popup-blocked') {
      console.error("Error signing in with Google", error);
      throw new Error("Sign-in popup was blocked by your browser. Please allow popups for this site to sign in, or try opening the app in a new tab.");
    } else if (authError.code === 'auth/cancelled-popup-request' || authError.code === 'auth/popup-closed-by-user') {
      console.warn("Sign-in popup was closed or cancelled by the user.");
      return false;
    } else if (authError.code === 'auth/network-request-failed') {
      console.error("Error signing in with Google", error);
      throw new Error("Network request failed. This is common in iframes due to ad-blockers or privacy settings. Please try opening the app in a new tab.");
    } else if (authError.code === 'auth/operation-not-allowed') {
      console.error("Error signing in with Google", error);
      throw new Error("Google Sign-In is not enabled in the Firebase Console. Please enable it under Authentication > Sign-in method.");
    } else if (authError.code === 'auth/unauthorized-domain') {
      console.error("Error signing in with Google", error);
      throw new Error("This domain is not authorized for OAuth operations. To fix this, go to Firebase Console > Authentication > Settings > Authorized domains, and add this website's domain name.");
    } else if (authError.message && authError.message.includes('INTERNAL ASSERTION FAILED')) {
      console.error("Error signing in with Google", error);
      throw new Error("An internal authentication error occurred. Please try opening the app in a new tab or allowing popups.");
    } else {
      console.error("Error signing in with Google", error);
      throw error;
    }
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
  } catch (error) {
    console.error("Error signing out", error);
  }
};
