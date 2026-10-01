import { useState } from 'react';
import { useLocation } from 'wouter';
import { Shield, Sparkles, Store, UtensilsCrossed, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useTablewaveAuth } from '@/lib/auth-context';
import { BrandMark, Button } from '@/components/shared';

interface AuthCardProps {
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export function AuthCard({
  onSuccess,
  title = "Welcome to Tablewave",
  subtitle = "Sign in to manage your venues, tables, and live orders."
}: AuthCardProps) {
  const [, setLocation] = useLocation();
  const { loginAsDemo, loginWithEmail, registerWithEmail } = useTablewaveAuth();

  const [activeTab, setActiveTab] = useState<'demo' | 'email'>('demo');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [venueName, setVenueName] = useState('');
  const [role, setRole] = useState<'super_admin' | 'business_admin' | 'staff'>('business_admin');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDemo = async (selectedRole: 'super_admin' | 'business_admin' | 'staff') => {
    setLoading(true);
    setError(null);
    try {
      await loginAsDemo(selectedRole);
      if (onSuccess) onSuccess();
      else setLocation(selectedRole === 'staff' ? '/orders' : '/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to sign in as demo user');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (emailMode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail(email, password, name, role, venueName);
      }
      if (onSuccess) onSuccess();
      else setLocation('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface mx-auto w-full max-w-[500px] overflow-hidden rounded-[24px] border border-[#e3dfd3] bg-[#fcfbf7] p-7 shadow-[0_24px_64px_rgba(32,49,71,.1)] sm:p-9">
      <div className="flex items-center justify-between">
        <BrandMark />
        <span className="rounded-full bg-[#16806e]/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#16806e]">
          Fast Sign In
        </span>
      </div>

      <div className="mt-6">
        <h2 className="font-display text-[25px] font-bold leading-tight tracking-[-.04em] text-[#203147]">
          {title}
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#75848f]">
          {subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-[#edeae1] p-1 text-[12px] font-semibold">
        <button
          type="button"
          onClick={() => { setActiveTab('demo'); setError(null); }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
            activeTab === 'demo'
              ? 'bg-white text-[#203147] shadow-sm'
              : 'text-[#697a88] hover:text-[#203147]'
          }`}
        >
          <Sparkles size={14} className="text-[#16806e]" />
          <span>1-Click Demo</span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('email'); setError(null); }}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 transition-all ${
            activeTab === 'email'
              ? 'bg-white text-[#203147] shadow-sm'
              : 'text-[#697a88] hover:text-[#203147]'
          }`}
        >
          <Mail size={14} />
          <span>Email & Password</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#faeceb] p-3 text-[12px] font-medium text-[#b85046]">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: 1-Click Instant Demo Login */}
      {activeTab === 'demo' && (
        <div className="mt-6 space-y-3">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-[#86959f]">
            Choose your dashboard account:
          </p>

          {/* 1. Super Admin */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemo('super_admin')}
            className="group flex w-full items-center gap-3.5 rounded-2xl border border-[#ded9cc] bg-white p-3.5 text-left transition-all hover:border-[#16806e] hover:shadow-md cursor-pointer"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf5f3] text-[#16806e] group-hover:bg-[#16806e] group-hover:text-white transition-colors">
              <Shield size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#203147]">1. Super Admin</p>
                <span className="rounded bg-[#edf5f3] px-2 py-0.5 font-mono text-[9px] font-bold text-[#16806e]">Platform Owner</span>
              </div>
              <p className="text-[11px] text-[#71828f] truncate">
                Add & edit businesses, set pricing plans, inspect platform metrics
              </p>
            </div>
            <ArrowRight size={16} className="text-[#a5b2bc] group-hover:translate-x-0.5 group-hover:text-[#16806e] transition-transform" />
          </button>

          {/* 2. Business / Vendor */}
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDemo('business_admin')}
            className="group flex w-full items-center gap-3.5 rounded-2xl border border-[#ded9cc] bg-white p-3.5 text-left transition-all hover:border-[#16806e] hover:shadow-md cursor-pointer"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f4f8] text-[#2c537d] group-hover:bg-[#203147] group-hover:text-white transition-colors">
              <Store size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#203147]">2. Business / Vendor</p>
                <span className="rounded bg-[#f0f4f8] px-2 py-0.5 font-mono text-[9px] font-bold text-[#2c537d]">Restaurant Owner</span>
              </div>
              <p className="text-[11px] text-[#71828f] truncate">
                Add & edit menu items, generate table QR codes, manage live orders
              </p>
            </div>
            <ArrowRight size={16} className="text-[#a5b2bc] group-hover:translate-x-0.5 group-hover:text-[#16806e] transition-transform" />
          </button>

          {/* Customer Callout */}
          <div className="mt-4 rounded-xl border border-dashed border-[#dcd7cb] bg-[#f8f6f0] p-3 text-[11px] leading-relaxed text-[#687a86]">
            <p className="font-semibold text-[#32485a] flex items-center gap-1.5">
              <span>📱</span> 3. Customers / Guests (Zero Login)
            </p>
            <p className="mt-0.5 text-[10.5px] text-[#72828e]">
              Diners never log in — they just scan the table QR code on their phone, pick their items, enter their details at checkout, and place the order directly.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: Self-hosted Email / Password */}
      {activeTab === 'email' && (
        <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium text-[#71828f]">
              {emailMode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            </p>
            <button
              type="button"
              onClick={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
              className="font-mono text-[11px] font-semibold text-[#16806e] underline"
            >
              {emailMode === 'signin' ? 'Create new account' : 'Sign in instead'}
            </button>
          </div>

          {emailMode === 'signup' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-[#485c6c]">Your Name</label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#ded9cc] bg-white px-3 py-2">
                  <User size={16} className="text-[#96a4af]" />
                  <input
                    type="text"
                    placeholder="Abhishek Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-[13px] bg-transparent outline-none text-[#203147]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#485c6c]">Account Role</label>
                <div className="mt-1 grid grid-cols-2 gap-2 text-[12px]">
                  <button
                    type="button"
                    onClick={() => setRole('business_admin')}
                    className={`rounded-xl border p-2 text-center font-medium ${
                      role === 'business_admin'
                        ? 'border-[#16806e] bg-[#edf5f3] text-[#16806e]'
                        : 'border-[#ded9cc] bg-white text-[#526574]'
                    }`}
                  >
                    Venue Owner
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('super_admin')}
                    className={`rounded-xl border p-2 text-center font-medium ${
                      role === 'super_admin'
                        ? 'border-[#16806e] bg-[#edf5f3] text-[#16806e]'
                        : 'border-[#ded9cc] bg-white text-[#526574]'
                    }`}
                  >
                    Super Admin
                  </button>
                </div>
              </div>

              {role === 'business_admin' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#485c6c]">Restaurant / Venue Name</label>
                  <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#ded9cc] bg-white px-3 py-2">
                    <Store size={16} className="text-[#96a4af]" />
                    <input
                      type="text"
                      placeholder="e.g. The Golden Fork, Bella Cucina"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      className="w-full text-[13px] bg-transparent outline-none text-[#203147]"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#485c6c]">Email Address</label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#ded9cc] bg-white px-3 py-2">
              <Mail size={16} className="text-[#96a4af]" />
              <input
                type="email"
                required
                placeholder="you@tablewave.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-[13px] bg-transparent outline-none text-[#203147]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#485c6c]">Password</label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#ded9cc] bg-white px-3 py-2">
              <Lock size={16} className="text-[#96a4af]" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-[13px] bg-transparent outline-none text-[#203147]"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full justify-center !py-2.5">
            {loading ? 'Processing...' : emailMode === 'signin' ? 'Sign In to Workspace' : 'Create Tablewave Account'}
          </Button>
        </form>
      )}
    </div>
  );
}
