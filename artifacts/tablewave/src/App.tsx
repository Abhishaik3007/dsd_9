import { type ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Route, Switch, Redirect, useLocation, Router as WouterRouter, Link } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BrandMark, Button } from '@/components/shared';
import { getGetCurrentUserQueryKey, useGetCurrentUser } from '@workspace/api-client-react';
import { TablewaveAuthProvider, useAuth, useClerk, useTablewaveAuth } from '@/lib/auth-context';
import { AuthCard } from '@/components/auth-modal';
import { LandingPage } from '@/pages/landing';
import { Workspace } from '@/pages/workspace';
import { OrderConfirmation, Storefront } from '@/pages/store';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 20_000, refetchOnWindowFocus: true, retry: 1 },
  },
});

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function QueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const cache = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) cache.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, cache]);
  return null;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn, user: authUser } = useTablewaveAuth();
  const current = useGetCurrentUser({
    query: { enabled: Boolean(isSignedIn), queryKey: getGetCurrentUserQueryKey() },
  });
  
  if (!isLoaded || (isSignedIn && current.isLoading && !authUser)) {
    return (
      <div className="min-h-[100dvh] bg-[#f7f6f0] p-6">
        <div className="skeleton mx-auto mt-8 h-[500px] max-w-5xl" />
      </div>
    );
  }
  
  if (!isSignedIn) return <LandingPage />;
  
  if (current.isError && !authUser) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f7f6f0] px-6 text-center">
        <BrandMark />
        <h1 className="mt-7 font-display text-2xl font-bold">Your workspace isn’t ready to open.</h1>
        <p className="mt-2 max-w-md text-sm text-[#77858d]">
          We couldn’t resolve your account. Try signing in again.
        </p>
        <Link href="/sign-in">
          <Button className="mt-5">Go to Sign In</Button>
        </Link>
      </main>
    );
  }
  
  const role = (current.data && typeof current.data === 'object' && 'role' in current.data)
    ? current.data.role
    : authUser?.role;
  const destination = role === 'staff' ? '/orders' : '/dashboard';
  return <Redirect to={destination} />;
}

function SignInPage() {
  return (
    <main className="grain flex min-h-[100dvh] items-center justify-center bg-[#f4f3ed] px-4 py-10">
      <div className="absolute left-6 top-6 sm:left-10 sm:top-9">
        <Link href="/">
          <BrandMark />
        </Link>
      </div>
      <div className="grid w-full max-w-[970px] items-center gap-12 lg:grid-cols-[.9fr_1fr]">
        <div className="hidden lg:block">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[#16806e]">
            Good to see you again
          </p>
          <h1 className="mt-4 font-display text-[43px] font-bold leading-[1.02] tracking-[-.06em] text-[#203147]">
            Let’s make<br />service flow.
          </h1>
          <p className="mt-4 max-w-[330px] text-[13px] leading-6 text-[#77858d]">
            Your orders, team and menus are waiting right where you left them.
          </p>
          <div className="mt-8 flex items-center gap-3 rounded-[15px] bg-[#e7eee7] p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fbfaf6] text-[#16806e]">
              01
            </span>
            <span className="text-[11px] font-semibold text-[#52656d]">
              Everything for a good shift.<br />
              <small className="font-normal text-[#8a9698]">All in one calm workspace.</small>
            </span>
          </div>
        </div>
        <div className="w-full">
          <AuthCard />
          <p className="mx-auto mt-5 max-w-[440px] text-center text-[9px] leading-4 text-[#9aa2a1]">
            By continuing, you’re accessing the Tablewave workspace for your venue.
          </p>
        </div>
      </div>
    </main>
  );
}

function SignUpPage() {
  return (
    <main className="grain flex min-h-[100dvh] items-center justify-center bg-[#f4f3ed] px-4 py-10">
      <div className="absolute left-6 top-6 sm:left-10 sm:top-9">
        <Link href="/">
          <BrandMark />
        </Link>
      </div>
      <div className="grid w-full max-w-[980px] items-center gap-12 lg:grid-cols-[.92fr_1fr]">
        <div className="hidden lg:block">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[#16806e]">
            Make room for good service
          </p>
          <h1 className="mt-4 font-display text-[42px] font-bold leading-[1.02] tracking-[-.06em] text-[#203147]">
            Start with a<br />better first step.
          </h1>
          <p className="mt-4 max-w-[330px] text-[13px] leading-6 text-[#77858d]">
            Bring your venue online, give every table a simple way to order, and keep your team in their rhythm.
          </p>
          <div className="mt-8 space-y-3">
            {['One workspace for every location', 'Menus that stay in sync', 'Orders that find the right team'].map((text, i) => (
              <div key={text} className="flex items-center gap-3 text-[11px] font-semibold text-[#53666f]">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e1eee6] text-[#16806e]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="w-full">
          <AuthCard title="Create your workspace" subtitle="Start managing your menus and table orders in minutes." />
          <p className="mx-auto mt-5 max-w-[440px] text-center text-[9px] leading-4 text-[#9aa2a1]">
            One account. A more thoughtful way to run service.
          </p>
        </div>
      </div>
    </main>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TablewaveAuthProvider>
          <QueryClientCacheInvalidator />
          <WouterRouter base={basePath}>
            <RoutedErrorBoundary>
              <Switch>
                <Route path="/" component={HomeRedirect} />
                <Route path="/sign-in/*?" component={SignInPage} />
                <Route path="/sign-up/*?" component={SignUpPage} />
                <Route path="/dashboard" component={Workspace} />
                <Route path="/businesses" component={Workspace} />
                <Route path="/team" component={Workspace} />
                <Route path="/plans" component={Workspace} />
                <Route path="/menu" component={Workspace} />
                <Route path="/outlets" component={Workspace} />
                <Route path="/orders" component={Workspace} />
                <Route path="/analytics" component={Workspace} />
                <Route path="/store/:business/:outlet/:table" component={Storefront} />
                <Route path="/order-confirmation" component={OrderConfirmation} />
                <Route component={NotFound} />
              </Switch>
            </RoutedErrorBoundary>
          </WouterRouter>
          <Toaster />
        </TablewaveAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;