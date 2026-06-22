import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeAuth, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  inMemoryPersistence, 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Robustly retrieve or initialize the Auth instance
let authInstance;
try {
  // If already initialized by previous module loads or HMR, retrieve it directly
  authInstance = getAuth(app);
} catch (error) {
  // If getAuth fails (not yet initialized), configure with environment-appropriate persistence
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  try {
    authInstance = initializeAuth(app, {
      persistence: isIframe ? [inMemoryPersistence] : [browserLocalPersistence, browserSessionPersistence]
    });
  } catch (initError) {
    // If initialization still fails (e.g. race conditions), do a final getAuth fallback
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
