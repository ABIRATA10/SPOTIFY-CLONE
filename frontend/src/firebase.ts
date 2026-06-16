import { initializeApp } from 'firebase/app';
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

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Safely initialize Auth with fallback persistence to prevent "INTERNAL ASSERTION FAILED: Pending promise was never set" in iframes
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
  });
} catch (error) {
  // Fall back to getAuth if already initialized (common during Vite hot module replacement)
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
