import { useState } from 'react';
import { useLocation } from 'wouter';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
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
  const { loginWithEmail } = useTablewaveAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
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
          Sign In
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

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#faeceb] p-3 text-[12px] font-medium text-[#b85046]">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email / Password Sign In */}
      <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#485c6c]">Email Address</label>
          <div className="group mt-1 flex items-center gap-2.5 rounded-xl border border-[#ded9cc] bg-white px-3 py-2 transition-all duration-200 focus-within:border-[#16806e] focus-within:ring-2 focus-within:ring-[#16806e]/15 focus-within:shadow-sm">
            <Mail size={16} className="shrink-0 text-[#96a4af] transition-colors duration-200 group-focus-within:text-[#16806e]" />
            <input
              type="email"
              required
              placeholder="you@tablewave.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-[13px] bg-transparent outline-none text-[#203147] placeholder:text-[#a5b2bc]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#485c6c]">Password</label>
          <div className="group mt-1 flex items-center gap-2.5 rounded-xl border border-[#ded9cc] bg-white px-3 py-2 transition-all duration-200 focus-within:border-[#16806e] focus-within:ring-2 focus-within:ring-[#16806e]/15 focus-within:shadow-sm">
            <Lock size={16} className="shrink-0 text-[#96a4af] transition-colors duration-200 group-focus-within:text-[#16806e]" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-[13px] bg-transparent outline-none text-[#203147] placeholder:text-[#a5b2bc]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#8899a6] transition-all duration-150 hover:bg-[#f0ece1] hover:text-[#203147] active:scale-95 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={15} className="transition-transform duration-150" />
              ) : (
                <Eye size={15} className="transition-transform duration-150" />
              )}
            </button>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full justify-center !py-2.5 shadow-sm hover:shadow-md">
          {loading ? 'Authenticating...' : 'Sign In to Workspace'}
        </Button>
      </form>
    </div>
  );
}
