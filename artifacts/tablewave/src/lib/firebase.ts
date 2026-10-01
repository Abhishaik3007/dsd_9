import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YOUR_')
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
  } catch (err) {
    console.warn('[Firebase] Initialization skipped or failed:', err);
  }
}

export { app, auth, firestore };

export async function loginWithFirebaseAuth(email: string, pass: string): Promise<{ token: string; user: any }> {
  if (!auth) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID to your .env');
  }
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const idToken = await credential.user.getIdToken();
  
  // Exchange with Tablewave API
  const res = await fetch('/api/auth/firebase-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken,
      email: credential.user.email,
      name: credential.user.displayName,
      uid: credential.user.uid,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to authenticate with Tablewave API using Firebase');
  }

  return res.json();
}

export async function registerWithFirebaseAuth(email: string, pass: string, name?: string): Promise<{ token: string; user: any }> {
  if (!auth) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID to your .env');
  }
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const idToken = await credential.user.getIdToken();

  const res = await fetch('/api/auth/firebase-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken,
      email: credential.user.email,
      name: name || credential.user.displayName,
      uid: credential.user.uid,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to complete registration');
  }

  return res.json();
}

export async function loginWithFirebaseGoogle(): Promise<{ token: string; user: any }> {
  if (!auth) {
    throw new Error('Firebase is not configured. Add VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID to your .env');
  }
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const idToken = await credential.user.getIdToken();

  const res = await fetch('/api/auth/firebase-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idToken,
      email: credential.user.email,
      name: credential.user.displayName,
      uid: credential.user.uid,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to sign in with Google');
  }

  return res.json();
}
