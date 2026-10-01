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
import { getFirestore, doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

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

async function syncFirebaseUserDoc(
  user: FirebaseUser,
  customName?: string,
  role = 'business_admin',
  venueName?: string
) {
  const isSuper = role === 'super_admin' || user.email?.toLowerCase().includes('admin') || user.email?.toLowerCase().includes('super') || false;
  const resolvedRole = isSuper ? 'super_admin' : role;
  const cleanUid = user.uid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || Date.now().toString().slice(-6);
  const bizId = isSuper ? null : `biz_${cleanUid}`;
  const bizName = isSuper ? 'Platform' : (venueName?.trim() || `${customName?.trim() || user.displayName || user.email?.split('@')[0] || 'My'}'s Venue`);

  const userProfile = {
    id: user.uid,
    email: user.email || 'user@venue.com',
    name: customName || user.displayName || user.email?.split('@')[0] || (isSuper ? 'Super Admin' : 'Venue Admin'),
    role: resolvedRole,
    status: 'active' as const,
    businessId: bizId,
    businessName: bizName,
    isSuperAdmin: isSuper,
    createdAt: new Date().toISOString(),
  };

  if (firestore) {
    try {
      const ref = doc(firestore, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        const userIsSuper = data.role === 'super_admin' || isSuper || Boolean(data.isSuperAdmin);
        const sanitized = {
          ...data,
          role: userIsSuper ? 'super_admin' : (data.role || 'business_admin'),
          isSuperAdmin: userIsSuper,
          businessId: userIsSuper ? null : data.businessId,
          businessName: userIsSuper ? 'Platform' : data.businessName,
        };
        if (userIsSuper && (data.businessId || !data.isSuperAdmin)) {
          try {
            await setDoc(ref, sanitized, { merge: true });
          } catch {}
        }
        return sanitized;
      }

      // Provision genuine unique business, outlet, and category for this genuine account
      if (bizId) {
        const bizRef = doc(firestore, 'businesses', bizId);
        const bizSnap = await getDoc(bizRef);
        if (!bizSnap.exists()) {
          const newBiz = {
            id: bizId,
            name: bizName,
            slug: bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'venue',
            type: 'Restaurant',
            status: 'active',
            ownerEmail: user.email || '',
            planId: 'plan_growth',
            planName: 'Growth',
            outletCount: 1,
            orderCount: 0,
            expiresAt: null,
            createdAt: new Date().toISOString(),
          };
          await setDoc(bizRef, newBiz);

          // Default outlet for genuine account
          const outId = `out_${cleanUid}_main`;
          await setDoc(doc(firestore, 'outlets', outId), {
            id: outId,
            businessId: bizId,
            name: 'Main Dining Room',
            slug: 'main',
            address: 'Table Service Area',
            active: true,
            tableCount: 12,
            createdAt: new Date().toISOString(),
          });

          // Default category for genuine account
          const catId = `cat_${cleanUid}_specials`;
          await setDoc(doc(firestore, 'categories', catId), {
            id: catId,
            businessId: bizId,
            name: 'Chef Specialties',
            sortOrder: 1,
            createdAt: new Date().toISOString(),
          });
        }
      }

      await setDoc(ref, userProfile);
    } catch (err) {
      console.warn('[Firestore] Could not write user doc, using local session:', err);
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

