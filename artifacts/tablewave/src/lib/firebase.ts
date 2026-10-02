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
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDFfDuS_k0iuykgaIMZ79BOfaVJVezLqqU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dsd9-e6eba.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dsd9-e6eba",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dsd9-e6eba.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "863373779673",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:863373779673:web:3c6c314f73b38ff27754c8",
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

export const MASTER_SUPERADMIN_EMAILS = [
  'abhishaik3007@gmail.com',
  'admin@tablewave.com',
];

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    MASTER_SUPERADMIN_EMAILS.includes(clean) ||
    clean.includes('superadmin') ||
    clean.includes('admin')
  );
}

async function syncFirebaseUserDoc(
  user: FirebaseUser,
  customName?: string,
  role = 'business_admin',
  venueName?: string
) {
  const cleanEmail = (user.email || '').toLowerCase().trim();
  const isSuper = role === 'super_admin' || isSuperAdminEmail(cleanEmail);

  if (isSuper) {
    const superProfile = {
      id: user.uid,
      email: cleanEmail || 'abhishaik3007@gmail.com',
      name: customName || user.displayName || 'Abhishek Kumar (Super Admin)',
      role: 'super_admin' as const,
      userType: 'super_admin' as const,
      status: 'active' as const,
      businessId: null,
      businessName: 'Platform',
      isSuperAdmin: true,
      createdAt: new Date().toISOString(),
    };
    if (firestore) {
      try {
        await setDoc(doc(firestore, 'users', user.uid), superProfile, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Could not write super admin profile:', err);
      }
    }
    return superProfile;
  }

  // Non-SuperAdmin: find provisioned business or provisioned user doc
  let matchedBizId: string | null = null;
  let matchedBizName: string | null = venueName?.trim() || null;
  let matchedRole: 'business_admin' | 'staff' = role === 'staff' ? 'staff' : 'business_admin';

  if (firestore) {
    try {
      // 1. Check if user profile already exists by user.uid
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const udata = userSnap.data();
        if (udata.businessId) matchedBizId = udata.businessId;
        if (udata.businessName) matchedBizName = udata.businessName;
        if (udata.role) matchedRole = udata.role;
      }

      // 2. Check if Super Admin provisioned an account for this email
      if (!matchedBizId && cleanEmail) {
        const userQ = query(collection(firestore, 'users'), where('email', '==', cleanEmail));
        const userDocs = await getDocs(userQ);
        if (!userDocs.empty) {
          const provUser = userDocs.docs[0].data();
          matchedBizId = provUser.businessId || null;
          matchedBizName = provUser.businessName || null;
          matchedRole = provUser.role || matchedRole;
        }
      }

      // 3. Check if Super Admin created a business with this ownerEmail
      if (!matchedBizId && cleanEmail) {
        const bizQ = query(collection(firestore, 'businesses'), where('ownerEmail', '==', cleanEmail));
        const bizDocs = await getDocs(bizQ);
        if (!bizDocs.empty) {
          const provBiz = bizDocs.docs[0].data();
          matchedBizId = provBiz.id || null;
          matchedBizName = provBiz.name || null;
        }
      }
    } catch (err) {
      console.warn('[Firestore] Error resolving user business:', err);
    }
  }

  const userProfile = {
    id: user.uid,
    email: cleanEmail || 'user@venue.com',
    name: customName || user.displayName || cleanEmail.split('@')[0] || (matchedRole === 'staff' ? 'Staff Member' : 'Venue Owner'),
    role: matchedRole,
    userType: matchedRole,
    status: 'active' as const,
    businessId: matchedBizId,
    businessName: matchedBizName || (cleanEmail ? `${cleanEmail.split('@')[0]}'s Venue` : 'My Venue'),
    isSuperAdmin: false,
    createdAt: new Date().toISOString(),
  };

  if (firestore) {
    try {
      const ref = doc(firestore, 'users', user.uid);
      await setDoc(ref, userProfile, { merge: true });
    } catch (err) {
      console.warn('[Firestore] Could not write user doc:', err);
    }
  }

  return userProfile;
}

export async function loginWithFirebaseAuth(email: string, pass: string): Promise<{ token: string; user: any }> {
  if (!auth) {
    throw new Error('Firebase is not configured. Add your Firebase credentials in .env.local');
  }
  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const idToken = await credential.user.getIdToken();
  const userDoc = await syncFirebaseUserDoc(credential.user);
  return { token: `fb_${idToken.slice(0, 32)}`, user: userDoc };
}

export async function registerWithFirebaseAuth(
  email: string,
  pass: string,
  name?: string,
  role = 'business_admin',
  venueName?: string
): Promise<{ token: string; user: any }> {
  if (!auth) {
    throw new Error('Firebase is not configured. Add your Firebase credentials in .env.local');
  }
  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const idToken = await credential.user.getIdToken();
  const userDoc = await syncFirebaseUserDoc(credential.user, name, role, venueName);
  return { token: `fb_${idToken.slice(0, 32)}`, user: userDoc };
}

export async function loginWithFirebaseGoogle(): Promise<{ token: string; user: any }> {
  if (!auth) {
    throw new Error('Firebase is not configured. Add your Firebase credentials in .env.local');
  }
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const idToken = await credential.user.getIdToken();
  const userDoc = await syncFirebaseUserDoc(credential.user);
  return { token: `fb_${idToken.slice(0, 32)}`, user: userDoc };
}

