import React, { createContext, useContext, useEffect, useState, useMemo, type ReactNode } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { isFirebaseConfigured, loginWithFirebaseAuth, loginWithFirebaseGoogle } from './firebase';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'business_admin' | 'staff' | 'pending';
  isSuperAdmin: boolean;
  businessId?: string | null;
  businessName?: string | null;
  status: 'active' | 'suspended' | 'pending';
}

export type AuthMode = 'demo' | 'credentials' | 'firebase' | 'clerk' | 'none';

interface TablewaveAuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  authMode: AuthMode;
  loginAsDemo: (role: 'super_admin' | 'business_admin' | 'staff') => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    password: string,
    name?: string,
    role?: 'super_admin' | 'business_admin' | 'staff'
  ) => Promise<void>;
  loginWithFirebase: (email: string, pass: string) => Promise<void>;
  loginWithFirebaseGoogle: () => Promise<void>;
  signOut: (opts?: { redirectUrl?: string }) => Promise<void>;
  addListener: (listener: (state: { user: AuthUser | null }) => void) => () => void;
}

const TablewaveAuthContext = createContext<TablewaveAuthContextType | null>(null);

const TOKEN_KEY = 'tablewave_auth_token';
const USER_KEY = 'tablewave_auth_user';
const MODE_KEY = 'tablewave_auth_mode';

// Configure the API client to automatically pass the active bearer token on all requests
setAuthTokenGetter(() => {
  return localStorage.getItem(TOKEN_KEY);
});

export function TablewaveAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    return (localStorage.getItem(MODE_KEY) as AuthMode) || 'none';
  });
  const [isLoaded, setIsLoaded] = useState(true);
  const [listeners, setListeners] = useState<Array<(state: { user: AuthUser | null }) => void>>([]);

  const notifyListeners = (updatedUser: AuthUser | null) => {
    listeners.forEach((cb) => {
      try {
        cb({ user: updatedUser });
      } catch (err) {
        console.error('Error in auth listener:', err);
      }
    });
  };

  const setAuthSession = (newToken: string, newUser: AuthUser, mode: AuthMode) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(MODE_KEY, mode);
    setToken(newToken);
    setUser(newUser);
    setAuthMode(mode);
    notifyListeners(newUser);
  };

  const clearAuthSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MODE_KEY);
    setToken(null);
    setUser(null);
    setAuthMode('none');
    notifyListeners(null);
  };

  const loginAsDemo = async (role: 'super_admin' | 'business_admin' | 'staff') => {
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        throw new Error('Demo login request failed');
      }
      const data = await res.json();
      setAuthSession(data.token, data.user, 'demo');
    } catch {
      // Fallback client-side demo user if API happens to be temporarily down
      const isSuperAdmin = role === 'super_admin';
      const fallbackUser: AuthUser = {
        id: `usr_mock_${role}`,
        email: role === 'super_admin' ? 'admin@tablewave.com' : role === 'business_admin' ? 'manager@juniperroom.com' : 'kitchen@juniperroom.com',
        name: role === 'super_admin' ? 'Abhishek Kumar (Super Admin)' : role === 'business_admin' ? 'Elena Rossi (Venue Admin)' : 'Marco Vance (Kitchen)',
        role,
        isSuperAdmin,
        businessId: isSuperAdmin ? null : 'biz_demo_juniper',
        businessName: isSuperAdmin ? 'Platform' : 'The Juniper Room',
        status: 'active',
      };
      setAuthSession(`mock-${role}`, fallbackUser, 'demo');
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to sign in. Check your email or credentials.');
    }
    const data = await res.json();
    setAuthSession(data.token, data.user, 'credentials');
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name?: string,
    role: 'super_admin' | 'business_admin' | 'staff' = 'business_admin'
  ) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, name, role }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to register account.');
    }
    const data = await res.json();
    setAuthSession(data.token, data.user, 'credentials');
  };

  const loginWithFirebase = async (email: string, pass: string) => {
    const data = await loginWithFirebaseAuth(email, pass);
    setAuthSession(data.token, data.user, 'firebase');
  };

  const loginWithFirebaseGoogleHandler = async () => {
    const data = await loginWithFirebaseGoogle();
    setAuthSession(data.token, data.user, 'firebase');
  };

  const signOut = async (opts?: { redirectUrl?: string }) => {
    clearAuthSession();
    if (opts?.redirectUrl) {
      window.location.href = opts.redirectUrl;
    }
  };

  const addListener = (listener: (state: { user: AuthUser | null }) => void) => {
    setListeners((prev) => [...prev, listener]);
    return () => {
      setListeners((prev) => prev.filter((l) => l !== listener));
    };
  };

  const isSignedIn = Boolean(token && user);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoaded,
      isSignedIn,
      userId: user?.id ?? null,
      authMode,
      loginAsDemo,
      loginWithEmail,
      registerWithEmail,
      loginWithFirebase,
      loginWithFirebaseGoogle: loginWithFirebaseGoogleHandler,
      signOut,
      addListener,
    }),
    [user, token, isLoaded, isSignedIn, authMode, listeners]
  );

  return <TablewaveAuthContext.Provider value={value}>{children}</TablewaveAuthContext.Provider>;
}

export function useTablewaveAuth(): TablewaveAuthContextType {
  const ctx = useContext(TablewaveAuthContext);
  if (!ctx) {
    throw new Error('useTablewaveAuth must be used within TablewaveAuthProvider');
  }
  return ctx;
}

// Clerk-compatible drop-in replacements for components that expect useAuth() or useClerk()
export function useAuth() {
  const ctx = useContext(TablewaveAuthContext);
  if (!ctx) {
    return { isLoaded: true, isSignedIn: false, userId: null, getToken: async () => null };
  }
  return {
    isLoaded: ctx.isLoaded,
    isSignedIn: ctx.isSignedIn,
    userId: ctx.userId,
    getToken: async () => ctx.token,
  };
}

export function useClerk() {
  const ctx = useContext(TablewaveAuthContext);
  if (!ctx) {
    return {
      signOut: async () => {},
      addListener: () => () => {},
      user: null,
    };
  }
  return {
    signOut: ctx.signOut,
    addListener: ctx.addListener,
    user: ctx.user,
  };
}
