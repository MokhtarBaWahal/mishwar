import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyMockKeyForDevOnly_DemoModeActive',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mishwar-yemen.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mishwar-yemen',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mishwar-yemen.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:demo123456'
};

export const isFirebaseConfigured = (): boolean => {
  const key = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(key && !key.includes('MockKey') && !key.includes('YOUR_FIREBASE'));
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('[MISHWAR Firebase] Initializing in offline / safe fallback mode:', error);
  // Re-attempt minimal initialize
  app = initializeApp(firebaseConfig, 'mishwar-fallback');
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, auth, db, storage };
