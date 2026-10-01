// Dynamic Firestore Database Service for Tablewave
// Connects Tablewave frontend directly to Firebase Firestore for real-time live data

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';

export interface FirestoreBusiness {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: 'active' | 'suspended' | 'inactive' | 'pending';
  ownerEmail: string;
  planId: string | null;
  planName?: string;
  outletCount: number;
  orderCount: number;
  expiresAt: string | null;
  createdAt: string;
}

export interface FirestorePlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  outletLimit: number;
  itemLimit: number;
  active: boolean;
  createdAt: string;
}

export interface FirestoreTeamMember {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'business_admin' | 'staff' | 'pending';
  status: 'active' | 'invited';
  businessId: string | null;
  businessName: string | null;
  createdAt: string;
}

export interface FirestoreOutlet {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  address: string;
  active: boolean;
  tableCount: number;
  createdAt: string;
}

export interface FirestoreCategory {
  id: string;
  businessId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface FirestoreItem {
  id: string;
  businessId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  available: boolean;
  variants: { name: string; price: number }[];
  addOns: { name: string; price: number }[];
  createdAt: string;
}

export interface FirestoreOrder {
  id: string;
  businessId: string;
  outletId: string;
  businessName: string;
  outletName: string;
  tableNumber: string;
  customerName: string;
  customerPhone?: string;
  status: 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total: number;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    selectedVariant?: string;
    selectedAddOns?: string[];
  }[];
  createdAt: string;
}

// Global SaaS Pricing Tiers (Platform configuration, not dummy data)
const DEFAULT_PLANS: FirestorePlan[] = [
  { id: 'plan_starter', name: 'Starter', price: 29, interval: 'month', outletLimit: 1, itemLimit: 40, active: true, createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'plan_growth', name: 'Growth', price: 79, interval: 'month', outletLimit: 3, itemLimit: 120, active: true, createdAt: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: 'plan_enterprise', name: 'Enterprise', price: 199, interval: 'month', outletLimit: 10, itemLimit: 500, active: true, createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
];

let isSeeding = false;
let isSeeded = false;

// Purge any dummy records from Cloud Firestore so genuine accounts only see real data
export async function cleanupDummyDataFromFirestore(): Promise<void> {
  if (!firestore) return;

  const dummyBizIds = ['biz_demo_juniper', 'biz_demo_velvet', 'biz_demo_starlight'];
  const dummyOutlets = ['out_juniper_dt', 'out_juniper_pt'];
  const dummyCats = ['cat_starters', 'cat_mains', 'cat_pizzas', 'cat_drinks', 'cat_desserts'];
  const dummyItems = ['item_arancini', 'item_ribeye', 'item_margherita', 'item_oldfashioned', 'item_tiramisu'];
  const dummyOrders = ['ord_101', 'ord_102', 'ord_103', 'ord_104'];
  const dummyTeam = ['usr_mock_superadmin', 'usr_mock_bizadmin', 'usr_mock_staff', 'usr_mock_invitee'];

  try {
    for (const id of dummyBizIds) {
      try { await deleteDoc(doc(firestore, 'businesses', id)); } catch {}
    }
    for (const id of dummyOutlets) {
      try { await deleteDoc(doc(firestore, 'outlets', id)); } catch {}
    }
    for (const id of dummyCats) {
      try { await deleteDoc(doc(firestore, 'categories', id)); } catch {}
    }
    for (const id of dummyItems) {
      try { await deleteDoc(doc(firestore, 'items', id)); } catch {}
    }
    for (const id of dummyOrders) {
      try { await deleteDoc(doc(firestore, 'orders', id)); } catch {}
    }
    for (const id of dummyTeam) {
      try { await deleteDoc(doc(firestore, 'team', id)); } catch {}
    }

    // Scan collections for any lingering docs tagged with biz_demo
    try {
      const bizSnap = await getDocs(collection(firestore, 'businesses'));
      for (const d of bizSnap.docs) {
        if (d.id.startsWith('biz_demo_')) {
          await deleteDoc(d.ref);
        }
      }
    } catch {}

    try {
      const outSnap = await getDocs(collection(firestore, 'outlets'));
      for (const d of outSnap.docs) {
        const data = d.data();
        if (data.businessId?.startsWith('biz_demo_') || d.id.startsWith('out_juniper_')) {
          await deleteDoc(d.ref);
        }
      }
    } catch {}

    try {
      const catSnap = await getDocs(collection(firestore, 'categories'));
      for (const d of catSnap.docs) {
        const data = d.data();
        if (data.businessId?.startsWith('biz_demo_') || d.id.startsWith('cat_starters') || d.id.startsWith('cat_mains') || d.id.startsWith('cat_pizzas') || d.id.startsWith('cat_drinks') || d.id.startsWith('cat_desserts')) {
          await deleteDoc(d.ref);
        }
      }
    } catch {}

    try {
      const itemSnap = await getDocs(collection(firestore, 'items'));
      for (const d of itemSnap.docs) {
        const data = d.data();
        if (data.businessId?.startsWith('biz_demo_')) {
          await deleteDoc(d.ref);
        }
      }
    } catch {}

    try {
      const ordSnap = await getDocs(collection(firestore, 'orders'));
      for (const d of ordSnap.docs) {
        const data = d.data();
        if (data.businessId?.startsWith('biz_demo_') || ['ord_101', 'ord_102', 'ord_103', 'ord_104'].includes(d.id)) {
          await deleteDoc(d.ref);
        }
      }
    } catch {}

    try {
      const teamSnap = await getDocs(collection(firestore, 'team'));
      for (const d of teamSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch {}

    console.log('[Firestore] Live Firestore cleaned of dummy demo fixtures.');
  } catch (err) {
    console.warn('[Firestore] Dummy data cleanup warning:', err);
  }
}

// Ensure platform subscription plans exist, and clean up any dummy documents
export async function ensureFirestoreSeeded(): Promise<void> {
  if (!firestore || isSeeded || isSeeding) return;
  isSeeding = true;
  try {
    // 1. Only seed standard platform plans if empty (SaaS pricing tiers)
    const planSnap = await getDocs(collection(firestore, 'plans'));
    if (planSnap.empty) {
      console.log('[Firestore] Initializing platform plans...');
      for (const p of DEFAULT_PLANS) {
        await setDoc(doc(firestore, 'plans', p.id), p);
      }
    }

    // 2. Ensure primary platform super admin account is provisioned in Firestore users collection
    try {
      const superAdminData = {
        id: 'usr_superadmin_abhishaik',
        email: 'Abhishaik3007@gmail.com',
        name: 'Abhishek Kumar (Super Admin)',
        role: 'super_admin',
        userType: 'super_admin',
        status: 'active',
        businessId: null,
        businessName: 'Platform',
        isSuperAdmin: true,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(firestore, 'users', 'usr_superadmin_abhishaik'), superAdminData, { merge: true });
    } catch (adminErr) {
      console.warn('[Firestore] Super admin provisioning note:', adminErr);
    }

    // 3. Clean up any dummy records from Firestore
    await cleanupDummyDataFromFirestore();

    isSeeded = true;
  } catch (err) {
    console.warn('[Firestore] Initialization check failed:', err);
  } finally {
    isSeeding = false;
  }
}

function resolveUser(token?: string | null) {
  let role = 'business_admin';
  let isSuperAdmin = false;

  if (typeof window !== 'undefined') {
    try {
      const rawUser = localStorage.getItem('tablewave_auth_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const userIsSuper = Boolean(u.isSuperAdmin || u.role === 'super_admin');
        return {
          id: u.id || 'usr_current',
          email: u.email || 'user@tablewave.com',
          name: u.name || (userIsSuper ? 'Super Admin' : 'Venue Owner'),
          role: userIsSuper ? 'super_admin' : (u.role || 'business_admin'),
          status: 'active',
          businessId: userIsSuper ? null : (u.businessId || null),
          businessName: userIsSuper ? 'Platform' : (u.businessName || null),
          isSuperAdmin: userIsSuper,
        };
      }
    } catch {
      // ignore
    }
  }

  if (token) {
    if (token.includes('super_admin') || token.includes('superadmin')) {
      role = 'super_admin';
      isSuperAdmin = true;
    } else if (token.includes('staff')) {
      role = 'staff';
    }
  }

  return {
    id: role === 'super_admin' ? 'usr_superadmin' : role === 'staff' ? 'usr_staff' : 'usr_bizadmin',
    email: role === 'super_admin' ? 'admin@tablewave.com' : 'user@tablewave.com',
    name: role === 'super_admin' ? 'Super Admin' : 'Venue Owner',
    role,
    status: 'active',
    businessId: isSuperAdmin ? null : null,
    businessName: isSuperAdmin ? 'Platform' : 'Venue',
    isSuperAdmin,
  };
}

// Main Dynamic Firestore API Handler
export async function handleFirestoreApi(
  url: string,
  method: string,
  body?: any,
  token?: string | null
): Promise<any> {
  // If user is authenticated as a demo user (1-Click Demo), bypass Firestore and let the
  // in-memory client mock handler serve the rich demo experience
  if (token && (token.startsWith('mock-') || token.startsWith('mock:'))) {
    return undefined;
  }

  if (!firestore) return undefined;

  const cleanUrl = url.split('?')[0].replace(/\/+$/, '');
  const user = resolveUser(token);

  // Trigger non-blocking initialization & dummy cleanup check
  void ensureFirestoreSeeded();

  try {
    // 1. /api/me
    if (cleanUrl === '/api/me' && method === 'GET') {
      return user;
    }

    // 2. /api/dashboard
    if (cleanUrl === '/api/dashboard' && method === 'GET') {
      const bizSnap = await getDocs(collection(firestore, 'businesses'));
      const ordSnap = await getDocs(collection(firestore, 'orders'));

      const businesses = bizSnap.docs
        .map((d) => d.data() as FirestoreBusiness)
        .filter((b) => !b.id.startsWith('biz_demo_'));

      const allOrders = ordSnap.docs
        .map((d) => d.data() as FirestoreOrder)
        .filter((o) => !o.id.startsWith('ord_10') && !o.businessId.startsWith('biz_demo_'));

      const scopedOrders = user.isSuperAdmin
        ? allOrders
        : user.businessId
        ? allOrders.filter((o) => o.businessId === user.businessId)
        : [];

      // Calculate dynamic 7-day trend from genuine orders
      const now = new Date();
      const orderTrend: { label: string; orders: number; revenue: number }[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        const dayOrders = scopedOrders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= dayStart && t < dayEnd;
        });
        orderTrend.push({
          label: dayNames[d.getDay()],
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        });
      }

      return {
        businessCount: businesses.length,
        activeBusinessCount: businesses.filter((b) => b.status === 'active').length,
        orderCount: scopedOrders.length,
        revenue: scopedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        pendingOrderCount: scopedOrders.filter((o) => o.status === 'new' || o.status === 'preparing').length,
        recentOrders: scopedOrders.slice(0, 8),
        orderTrend,
      };
    }

    // 3. /api/businesses
    if (cleanUrl === '/api/businesses') {
      if (method === 'GET') {
        const snap = await getDocs(collection(firestore, 'businesses'));
        const list = snap.docs
          .map((d) => d.data() as FirestoreBusiness)
          .filter((b) => !b.id.startsWith('biz_demo_'));

        if (user.isSuperAdmin) return list;
        if (user.businessId) {
          return list.filter((b) => b.id === user.businessId);
        }
        return list.filter((b) => b.ownerEmail === user.email);
      }
      if (method === 'POST') {
        const id = `biz_${Date.now().toString().slice(-6)}`;
        const newBiz: FirestoreBusiness = {
          id,
          name: body?.name || 'New Venue',
          slug: (body?.name || 'venue').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'venue',
          type: body?.type || 'Restaurant',
          status: 'active',
          ownerEmail: body?.ownerEmail || user.email || 'owner@venue.com',
          planId: body?.planId || 'plan_growth',
          planName: 'Growth',
          outletCount: 1,
          orderCount: 0,
          expiresAt: body?.expiresAt || null,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(firestore, 'businesses', id), newBiz);
        return newBiz;
      }
    }

    const bizIdMatch = cleanUrl.match(/^\/api\/businesses\/([^/]+)$/);
    if (bizIdMatch && (method === 'PATCH' || method === 'PUT')) {
      const id = bizIdMatch[1];
      await updateDoc(doc(firestore, 'businesses', id), body);
      const updated = await getDoc(doc(firestore, 'businesses', id));
      return updated.data() || { id, ...body };
    }

    // 4. /api/plans
    if (cleanUrl === '/api/plans') {
      if (method === 'GET') {
        const snap = await getDocs(collection(firestore, 'plans'));
        const plans = snap.docs.map((d) => d.data() as FirestorePlan);
        return plans.length ? plans : DEFAULT_PLANS;
      }
      if (method === 'POST') {
        const id = `plan_${Date.now().toString().slice(-6)}`;
        const newPlan: FirestorePlan = {
          id,
          name: body?.name || 'Custom Plan',
          price: Number(body?.price) || 49,
          interval: body?.interval || 'month',
          outletLimit: Number(body?.outletLimit) || 2,
          itemLimit: Number(body?.itemLimit) || 80,
          active: true,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(firestore, 'plans', id), newPlan);
        return newPlan;
      }
    }

    // 5. /api/team (reads and writes to unified users collection)
    if (cleanUrl === '/api/team' && method === 'GET') {
      const snap = await getDocs(collection(firestore, 'users'));
      const list = snap.docs
        .map((d) => d.data() as FirestoreTeamMember)
        .filter((t) => !t.id.startsWith('usr_mock_'));

      if (user.isSuperAdmin) return list;
      return user.businessId ? list.filter((t) => t.businessId === user.businessId) : [];
    }
    if (cleanUrl === '/api/team/invite' && method === 'POST') {
      const id = `usr_inv_${Date.now().toString().slice(-6)}`;
      const newMember: FirestoreTeamMember = {
        id,
        email: body?.email || 'teammate@venue.com',
        name: body?.email?.split('@')[0] || 'Invited Teammate',
        role: body?.role || 'staff',
        status: 'invited',
        businessId: user.businessId || null,
        businessName: user.businessName || 'Venue',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(firestore, 'users', id), newMember);
      return newMember;
    }

    // 6. /api/outlets
    if (cleanUrl === '/api/outlets') {
      if (method === 'GET') {
        const snap = await getDocs(collection(firestore, 'outlets'));
        const list = snap.docs
          .map((d) => d.data() as FirestoreOutlet)
          .filter((o) => !o.businessId.startsWith('biz_demo_') && !o.id.startsWith('out_juniper_'));

        if (user.isSuperAdmin) return list;
        return user.businessId ? list.filter((o) => o.businessId === user.businessId) : [];
      }
      if (method === 'POST') {
        const id = `out_${Date.now().toString().slice(-6)}`;
        const newOutlet: FirestoreOutlet = {
          id,
          businessId: user.businessId || 'biz_main',
          name: body?.name || 'Main Outlet',
          slug: (body?.name || 'outlet').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'outlet',
          address: body?.address || '123 Main St',
          active: true,
          tableCount: Number(body?.tableCount) || 12,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(firestore, 'outlets', id), newOutlet);
        return newOutlet;
      }
    }

    const outletMatch = cleanUrl.match(/^\/api\/outlets\/([^/]+)$/);
    if (outletMatch) {
      const id = outletMatch[1];
      if (method === 'PATCH' || method === 'PUT') {
        await updateDoc(doc(firestore, 'outlets', id), body);
        const updated = await getDoc(doc(firestore, 'outlets', id));
        return updated.data() || { id, ...body };
      }
      if (method === 'DELETE') {
        await deleteDoc(doc(firestore, 'outlets', id));
        return { success: true };
      }
    }

    // 7. /api/categories
    if (cleanUrl === '/api/categories') {
      if (method === 'GET') {
        const snap = await getDocs(collection(firestore, 'categories'));
        const list = snap.docs
          .map((d) => d.data() as FirestoreCategory)
          .filter((c) => !c.businessId.startsWith('biz_demo_'));

        if (user.isSuperAdmin) return list;
        return user.businessId ? list.filter((c) => c.businessId === user.businessId) : [];
      }
      if (method === 'POST') {
        const id = `cat_${Date.now().toString().slice(-6)}`;
        const newCat: FirestoreCategory = {
          id,
          businessId: user.businessId || 'biz_main',
          name: body?.name || 'General',
          sortOrder: Number(body?.sortOrder) || 1,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(firestore, 'categories', id), newCat);
        return newCat;
      }
    }

    const catMatch = cleanUrl.match(/^\/api\/categories\/([^/]+)$/);
    if (catMatch) {
      const id = catMatch[1];
      if (method === 'PATCH' || method === 'PUT') {
        await updateDoc(doc(firestore, 'categories', id), body);
        const updated = await getDoc(doc(firestore, 'categories', id));
        return updated.data() || { id, ...body };
      }
      if (method === 'DELETE') {
        await deleteDoc(doc(firestore, 'categories', id));
        return { success: true };
      }
    }

    // 8. /api/items
    if (cleanUrl === '/api/items') {
      if (method === 'GET') {
        const snap = await getDocs(collection(firestore, 'items'));
        const list = snap.docs
          .map((d) => d.data() as FirestoreItem)
          .filter((i) => !i.businessId.startsWith('biz_demo_'));

        if (user.isSuperAdmin) return list;
        return user.businessId ? list.filter((i) => i.businessId === user.businessId) : [];
      }
      if (method === 'POST') {
        const id = `item_${Date.now().toString().slice(-6)}`;
        const newItem: FirestoreItem = {
          id,
          businessId: user.businessId || 'biz_main',
          categoryId: body?.categoryId || 'cat_main',
          name: body?.name || 'New Item',
          description: body?.description || '',
          price: Number(body?.price) || 14,
          imageUrl: body?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
          available: body?.available ?? true,
          variants: body?.variants || [],
          addOns: body?.addOns || [],
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(firestore, 'items', id), newItem);
        return newItem;
      }
    }

    const itemMatch = cleanUrl.match(/^\/api\/items\/([^/]+)$/);
    if (itemMatch) {
      const id = itemMatch[1];
      if (method === 'PATCH' || method === 'PUT') {
        await updateDoc(doc(firestore, 'items', id), body);
        const updated = await getDoc(doc(firestore, 'items', id));
        return updated.data() || { id, ...body };
      }
      if (method === 'DELETE') {
        await deleteDoc(doc(firestore, 'items', id));
        return { success: true };
      }
    }

    // 9. /api/orders
    if (cleanUrl === '/api/orders' && method === 'GET') {
      const snap = await getDocs(collection(firestore, 'orders'));
      const list = snap.docs
        .map((d) => d.data() as FirestoreOrder)
        .filter((o) => !o.id.startsWith('ord_10') && !o.businessId.startsWith('biz_demo_'));

      if (user.isSuperAdmin) return list;
      return user.businessId ? list.filter((o) => o.businessId === user.businessId) : [];
    }

    const orderMatch = cleanUrl.match(/^\/api\/orders\/([^/]+)$/);
    if (orderMatch && (method === 'PATCH' || method === 'PUT')) {
      const id = orderMatch[1];
      if (body?.status) {
        await updateDoc(doc(firestore, 'orders', id), { status: body.status });
      }
      const updated = await getDoc(doc(firestore, 'orders', id));
      return updated.data() || { id, status: body?.status || 'preparing' };
    }

    // 10. /api/analytics
    if (cleanUrl === '/api/analytics' && method === 'GET') {
      const snap = await getDocs(collection(firestore, 'orders'));
      const allOrders = snap.docs
        .map((d) => d.data() as FirestoreOrder)
        .filter((o) => !o.id.startsWith('ord_10') && !o.businessId.startsWith('biz_demo_'));

      const scopedOrders = user.isSuperAdmin
        ? allOrders
        : user.businessId
        ? allOrders.filter((o) => o.businessId === user.businessId)
        : [];

      const totalRevenue = scopedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

      // Dynamic 7-day trend
      const now = new Date();
      const trend: { label: string; orders: number; revenue: number }[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        const dayOrders = scopedOrders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= dayStart && t < dayEnd;
        });
        trend.push({
          label: dayNames[d.getDay()],
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        });
      }

      // Dynamic top items aggregation from genuine orders
      const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
      for (const order of scopedOrders) {
        for (const it of order.items || []) {
          const key = it.itemId || it.name;
          const existing = itemMap.get(key) || { name: it.name, quantity: 0, revenue: 0 };
          existing.quantity += it.quantity || 1;
          existing.revenue += (it.unitPrice || 0) * (it.quantity || 1);
          itemMap.set(key, existing);
        }
      }
      const topItems = Array.from(itemMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      return {
        orderCount: scopedOrders.length,
        revenue: totalRevenue,
        averageOrder: scopedOrders.length ? +(totalRevenue / scopedOrders.length).toFixed(1) : 0,
        completedCount: scopedOrders.filter((o) => o.status === 'completed').length,
        trend,
        topItems,
      };
    }

    // 11. /api/store/:business/:outlet/:table
    const storeMenuMatch = cleanUrl.match(/^\/api\/store\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (storeMenuMatch && method === 'GET') {
      const bParam = decodeURIComponent(storeMenuMatch[1]);
      const oParam = decodeURIComponent(storeMenuMatch[2]);
      const table = decodeURIComponent(storeMenuMatch[3]);

      const bizSnap = await getDocs(collection(firestore, 'businesses'));
      const outSnap = await getDocs(collection(firestore, 'outlets'));
      const catSnap = await getDocs(collection(firestore, 'categories'));
      const itemSnap = await getDocs(collection(firestore, 'items'));

      const allBiz = bizSnap.docs
        .map((d) => d.data() as FirestoreBusiness)
        .filter((b) => !b.id.startsWith('biz_demo_'));
      const allOut = outSnap.docs
        .map((d) => d.data() as FirestoreOutlet)
        .filter((o) => !o.businessId.startsWith('biz_demo_'));
      const allCat = catSnap.docs
        .map((d) => d.data() as FirestoreCategory)
        .filter((c) => !c.businessId.startsWith('biz_demo_'));
      const allItems = itemSnap.docs
        .map((d) => d.data() as FirestoreItem)
        .filter((i) => !i.businessId.startsWith('biz_demo_'));

      // Find the specific target business requested
      const targetBiz = allBiz.find((b) => b.slug === bParam || b.id === bParam) || allBiz[0];

      if (!targetBiz) {
        return {
          business: { id: 'empty', name: 'Venue', slug: bParam, status: 'active', outletCount: 0, orderCount: 0 },
          outlet: { id: 'empty', name: 'Main', slug: oParam, address: '', tableCount: 1, active: true },
          tableNumber: table,
          categories: [],
          items: [],
        };
      }

      // Find the specific target outlet for that business
      const targetOutlet =
        allOut.find((o) => (o.slug === oParam || o.id === oParam) && o.businessId === targetBiz.id) ||
        allOut.find((o) => o.businessId === targetBiz.id) ||
        allOut[0] ||
        { id: `out_${targetBiz.id}_1`, name: 'Main Room', slug: 'main', address: '', tableCount: 10, active: true, createdAt: new Date().toISOString() };

      // Filter categories and items strictly to this venue
      const categories = allCat.filter((c) => c.businessId === targetBiz.id);
      const items = allItems.filter((i) => i.businessId === targetBiz.id);

      return {
        business: {
          id: targetBiz.id,
          name: targetBiz.name,
          slug: targetBiz.slug,
          type: targetBiz.type,
          status: targetBiz.status,
          ownerEmail: targetBiz.ownerEmail,
          planId: targetBiz.planId,
          planName: targetBiz.planName ?? null,
          expiresAt: targetBiz.expiresAt ?? null,
          outletCount: targetBiz.outletCount,
          orderCount: targetBiz.orderCount,
          createdAt: targetBiz.createdAt,
        },
        outlet: {
          id: targetOutlet.id,
          name: targetOutlet.name,
          slug: targetOutlet.slug,
          address: targetOutlet.address,
          tableCount: targetOutlet.tableCount,
          active: targetOutlet.active,
          createdAt: targetOutlet.createdAt,
        },
        tableNumber: table,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          sortOrder: c.sortOrder,
          createdAt: c.createdAt,
        })),
        items: items.map((item) => ({
          id: item.id,
          businessId: item.businessId,
          categoryId: item.categoryId,
          categoryName: categories.find((c) => c.id === item.categoryId)?.name ?? 'General',
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          available: item.available,
          variants: item.variants,
          addOns: item.addOns,
          createdAt: item.createdAt,
        })),
      };
    }

    // 12. /api/store/order
    if (cleanUrl === '/api/store/order' && method === 'POST') {
      const bizSnap = await getDocs(collection(firestore, 'businesses'));
      const outSnap = await getDocs(collection(firestore, 'outlets'));
      const allBiz = bizSnap.docs
        .map((d) => d.data() as FirestoreBusiness)
        .filter((b) => !b.id.startsWith('biz_demo_'));
      const allOut = outSnap.docs
        .map((d) => d.data() as FirestoreOutlet)
        .filter((o) => !o.businessId.startsWith('biz_demo_'));

      const targetBiz =
        allBiz.find((b) => b.slug === body?.businessSlug || b.id === body?.businessSlug) ||
        allBiz[0];

      const targetOutlet =
        allOut.find((o) => (o.slug === body?.outletSlug || o.id === body?.outletSlug) && o.businessId === targetBiz?.id) ||
        allOut.find((o) => o.businessId === targetBiz?.id) ||
        allOut[0];

      const total = (body?.items || []).reduce(
        (sum: number, item: any) => sum + (item.unitPrice || 0) * (item.quantity || 1),
        0
      );
      const id = `ord_${Date.now().toString().slice(-6)}`;
      const newOrder: FirestoreOrder = {
        id,
        businessId: targetBiz ? targetBiz.id : 'biz_main',
        outletId: targetOutlet ? targetOutlet.id : 'out_main',
        businessName: targetBiz ? targetBiz.name : 'Restaurant',
        outletName: targetOutlet ? targetOutlet.name : 'Dining Room',
        tableNumber: body?.tableNumber || '1',
        customerName: body?.customerName || 'Guest',
        customerPhone: body?.customerPhone,
        status: 'new',
        total,
        items: body?.items || [],
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(firestore, 'orders', id), newOrder);
      return newOrder;
    }
  } catch (err) {
    console.error('[Firestore API Error]:', err);
    throw err;
  }

  return undefined;
}
