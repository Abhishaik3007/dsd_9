import { type ComponentType, type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { Redirect, useLocation, Link } from 'wouter';
import { useAuth, useTablewaveAuth } from '@/lib/auth-context';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2, ChevronDown,
  CirclePlus, Clock3, Copy, Download, Edit3, ExternalLink, Package,
  Plus, QrCode, Search, Sparkles, Trash2, Users, Utensils, X,
  Building2, Wallet, Store, Eye, EyeOff,
} from 'lucide-react';
import {
  RiStore3Line,
  RiPriceTag3Line,
  RiFileList3Line,
  RiRestaurant2Line,
  RiQrScan2Line,
} from 'react-icons/ri';
import {
  getGetAnalyticsQueryKey, getGetDashboardQueryKey, getGetCurrentUserQueryKey,
  getListBusinessesQueryKey, getListCategoriesQueryKey, getListItemsQueryKey,
  getListOrdersQueryKey, getListOutletsQueryKey, getListPlansQueryKey, getListTeamQueryKey,
  useCreateBusiness, useCreateCategory, useCreateItem, useCreateOutlet, useCreatePlan,
  useDeleteCategory, useDeleteItem, useDeleteOutlet, useGetAnalytics, useGetCurrentUser,
  useGetDashboard, useInviteTeamMember, useListBusinesses, useListCategories, useListItems,
  useListOrders, useListOutlets, useListPlans, useListTeam, useUpdateBusiness,
  useUpdateCategory, useUpdateItem, useUpdateOrder, useUpdateOutlet,
  type Business, type Category, type CurrentUser, type MenuItem, type Order, type Outlet, type Plan,
  type Dashboard, type Analytics, type TopItem, type OrderLine,
} from '@workspace/api-client-react';
import QRCode from 'qrcode';
import { firestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { WorkspaceShell } from '@/components/workspace-shell';
import { AppDatePicker, AppSelect, Button, EmptyState, Field, Modal, PageTitle, QueryState, SubmitButton } from '@/components/shared';

const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value || 0);
const dateShort = (value: string) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
const dateTime = (value: string) => new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' }).format(new Date(value));
const paths: Record<string, readonly unknown[]> = {
  dashboard: getGetDashboardQueryKey(), businesses: getListBusinessesQueryKey(), team: getListTeamQueryKey(), plans: getListPlansQueryKey(),
  outlets: getListOutletsQueryKey(), categories: getListCategoriesQueryKey(), items: getListItemsQueryKey(), orders: getListOrdersQueryKey(), analytics: getGetAnalyticsQueryKey(),
};
function invalidate(client: ReturnType<typeof useQueryClient>, ...keys: (readonly unknown[])[]) {
  keys.forEach((queryKey) => void client.invalidateQueries({ queryKey }));
}

function Status({ value }: { value: string }) {
  const clean = value.toLowerCase();
  const tone = ['active', 'completed', 'ready'].includes(clean) ? 'bg-[#e2f1e9] text-[#28745f]' : ['new', 'pending', 'invited', 'preparing'].includes(clean) ? 'bg-[#fff0df] text-[#a96c38]' : ['cancelled', 'suspended', 'inactive'].includes(clean) ? 'bg-[#f7e8e5] text-[#a84e45]' : 'bg-[#eceeea] text-[#697780]';
  return <span className={`status-pill ${tone}`} data-testid={`status-${clean}`}><span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />{value.replaceAll('_', ' ')}</span>;
}

function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto rounded-[16px] border border-[#e6e3db]"><table className="w-full min-w-[760px] border-collapse text-left">{children}</table></div>;
}

function Th({ children }: { children: ReactNode }) { return <th className="bg-[#f5f4ee] px-4 py-3 text-[9px] font-bold uppercase tracking-[.1em] text-[#8b9699]">{children}</th>; }
function Td({ children, className = '' }: { children: ReactNode; className?: string }) { return <td className={`border-t border-[#efede6] px-4 py-3.5 text-[12px] text-[#53616e] ${className}`}>{children}</td>; }
function initials(name: string) { return name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); }

function StatCard({ label, value, note, icon: Icon, accent = false }: { label: string; value: string; note: string; icon: ComponentType<{ size?: number; className?: string }>; accent?: boolean }) {
  return <article className={`surface p-5 ${accent ? 'bg-[#e7f0e9]' : ''}`}><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#818d91]">{label}</span><span className={`grid h-8 w-8 place-items-center rounded-[10px] ${accent ? 'bg-white/75 text-[#16806e]' : 'bg-[#f0efe8] text-[#72808a]'}`}><Icon size={16} /></span></div><p className="mt-4 font-display text-[28px] font-bold tracking-[-.055em] text-[#26394d]" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>{value}</p><p className="mt-1 text-[10px] text-[#8a969b]">{note}</p></article>;
}

function TrendChart({ data }: { data: { label: string; orders: number; revenue: number }[] }) {
  const max = Math.max(1, ...data.map((point) => point.orders));
  return <div className="flex h-[205px] items-end gap-2 px-1 pt-3 sm:gap-3">{data.map((point, i) => <div key={`${point.label}-${i}`} className="group flex h-full flex-1 flex-col justify-end">
    <div className="relative flex h-[calc(100%-22px)] items-end justify-center rounded-t-md bg-[#f4f2ec]">
      <div title={`${point.orders} orders · ${money(point.revenue)}`} className="w-[54%] rounded-t-[5px] bg-[#16806e] transition-transform duration-200 group-hover:scale-x-110" style={{ height: `${Math.max(5, point.orders / max * 100)}%` }} />
      <div className="absolute -top-7 rounded-md bg-[#24374a] px-2 py-1 text-[9px] font-semibold text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">{point.orders}</div>
    </div><span className="mt-2 truncate text-center font-mono text-[8px] text-[#929c9d]">{point.label}</span>
  </div>)}</div>;
}

function Overview({
  user,
  dashboard,
  loading,
  error,
  retry,
  orders,
  businesses,
  plans,
}: {
  user: CurrentUser;
  dashboard: Dashboard | undefined;
  loading: boolean;
  error: boolean;
  retry: () => void;
  orders: Order[];
  businesses: Business[];
  plans: Plan[];
}) {
  const isSuperAdmin = user.role === 'super_admin';
  const [timeframe, setTimeframe] = useState<'today' | 'yesterday' | '7d' | '30d' | 'all'>('today');

  const timeframeLabels: Record<typeof timeframe, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    all: 'All Time',
  };

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7d = now.getTime() - 7 * 86400000;
    const startOf30d = now.getTime() - 30 * 86400000;

    return orders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();
      if (isNaN(orderTime)) return true;
      if (timeframe === 'today') return orderTime >= startOfToday;
      if (timeframe === 'yesterday') return orderTime >= startOfYesterday && orderTime < startOfToday;
      if (timeframe === '7d') return orderTime >= startOf7d;
      if (timeframe === '30d') return orderTime >= startOf30d;
      return true;
    });
  }, [orders, timeframe]);

  const venueOrderCount = useMemo(() => {
    if (timeframe === 'today' && dashboard?.orderCount && dashboard.orderCount > filteredOrders.length) {
      return dashboard.orderCount;
    }
    return filteredOrders.length;
  }, [timeframe, dashboard, filteredOrders]);

  const venueRevenue = useMemo(() => {
    const sum = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    if (timeframe === 'today' && dashboard?.revenue && dashboard.revenue > sum) {
      return dashboard.revenue;
    }
    return sum;
  }, [timeframe, dashboard, filteredOrders]);

  const venuePendingCount = useMemo(() => {
    const count = filteredOrders.filter((o) =>
      ['pending', 'preparing', 'new'].includes(o.status?.toLowerCase() || '')
    ).length;
    if (timeframe === 'today' && dashboard?.pendingOrderCount) {
      return Math.max(count, dashboard.pendingOrderCount);
    }
    return count;
  }, [timeframe, dashboard, filteredOrders]);

  const recent = useMemo(() => {
    if (filteredOrders.length) {
      return filteredOrders.slice(0, 5);
    }
    return dashboard?.recentOrders || orders.slice(0, 5);
  }, [filteredOrders, dashboard, orders]);

  const trendData = useMemo(() => {
    if (timeframe === 'today' && dashboard?.orderTrend?.length) {
      return dashboard.orderTrend;
    }
    if (timeframe === '7d' || timeframe === '30d') {
      const days = timeframe === '7d' ? 7 : 14;
      const points: { label: string; orders: number; revenue: number }[] = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        const matches = orders.filter((o) => {
          const t = new Date(o.createdAt).getTime();
          return t >= dayStart && t < dayEnd;
        });
        points.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          orders: matches.length,
          revenue: matches.reduce((s, o) => s + (o.total || 0), 0),
        });
      }
      return points;
    }
    if (timeframe === 'yesterday') {
      return [
        { label: '11 AM', orders: Math.max(1, Math.round(filteredOrders.length * 0.2)), revenue: Math.round(venueRevenue * 0.2) },
        { label: '1 PM', orders: Math.max(1, Math.round(filteredOrders.length * 0.35)), revenue: Math.round(venueRevenue * 0.35) },
        { label: '4 PM', orders: Math.max(0, Math.round(filteredOrders.length * 0.1)), revenue: Math.round(venueRevenue * 0.1) },
        { label: '7 PM', orders: Math.max(1, Math.round(filteredOrders.length * 0.25)), revenue: Math.round(venueRevenue * 0.25) },
        { label: '9 PM', orders: Math.max(0, Math.round(filteredOrders.length * 0.1)), revenue: Math.round(venueRevenue * 0.1) },
      ];
    }
    return dashboard?.orderTrend || [];
  }, [timeframe, dashboard, orders, filteredOrders, venueRevenue]);

  const totalMrr = useMemo(() => {
    return businesses.reduce((sum, b) => {
      if (b.status !== 'active') return sum;
      const plan = plans.find((p) => p.id === b.planId);
      if (!plan) return sum;
      return sum + (plan.interval === 'year' ? plan.price / 12 : plan.price);
    }, 0);
  }, [businesses, plans]);

  return (
    <>
      <PageTitle
        eyebrow={`Welcome back${user.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        title={isSuperAdmin ? 'Platform control, at a glance.' : 'Your venue service, at a glance.'}
        description={
          isSuperAdmin
            ? 'Real-time overview of client businesses, subscription health, and platform-wide volume.'
            : 'A clear view of orders, sales, and kitchen activity across your venue.'
        }
        action={
          <div className="w-[145px]">
            <AppSelect
              name="timeframe"
              value={timeframe}
              onChange={(v) => setTimeframe(v as typeof timeframe)}
              testId="select-overview-timeframe"
              options={[
                { value: 'today', label: 'Today' },
                { value: 'yesterday', label: 'Yesterday' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: 'all', label: 'All Time' },
              ]}
            />
          </div>
        }
      />
      <QueryState loading={loading} error={error} retry={retry}>
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(isSuperAdmin
              ? [
                  {
                    label: 'Registered Venues',
                    value: String(businesses.length || dashboard?.businessCount || 0),
                    note: `${businesses.filter((b) => b.status === 'active').length} active paying accounts`,
                    icon: RiStore3Line,
                    accent: true,
                  },
                  {
                    label: 'Estimated MRR',
                    value: `${money(totalMrr)}/mo`,
                    note: 'From active SaaS subscriptions',
                    icon: RiPriceTag3Line,
                  },
                  {
                    label: `Platform Volume (${timeframeLabels[timeframe]})`,
                    value: money(venueRevenue || dashboard?.revenue || 0),
                    note: 'Total diner transactions captured',
                    icon: BarChart3,
                  },
                  {
                    label: 'Active Subscriptions',
                    value: String(businesses.filter((b) => b.status === 'active').length),
                    note: 'Venues with active status',
                    icon: Users,
                  },
                ]
              : [
                  {
                    label: `Orders (${timeframeLabels[timeframe]})`,
                    value: venueOrderCount.toLocaleString(),
                    note: `${venuePendingCount} orders need kitchen action`,
                    icon: Package,
                    accent: true,
                  },
                  {
                    label: `Revenue (${timeframeLabels[timeframe]})`,
                    value: money(venueRevenue),
                    note: 'Captured at guest tables',
                    icon: BarChart3,
                  },
                  {
                    label: 'Active Locations',
                    value: String(dashboard?.activeBusinessCount ?? 1),
                    note: user.businessName || 'Your venue',
                    icon: Store,
                  },
                  {
                    label: 'Kitchen Queue',
                    value: String(venuePendingCount),
                    note: 'New & preparing orders',
                    icon: Clock3,
                  },
                ]
            ).map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          {/* Super Admin: SaaS Subscription Breakdown & Infrastructure vs Vendor: Order Activity & Service Pulse */}
          {isSuperAdmin ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.45fr_.95fr]">
              <section className="surface p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-bold text-[#384c5e]">SaaS Subscription Breakdown</p>
                    <p className="mt-1 text-[11px] text-[#89949a]">
                      Active client distribution across Tablewave pricing tiers
                    </p>
                  </div>
                  <Link
                    href="/plans"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16806e] hover:underline cursor-pointer"
                  >
                    Manage Plans <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="mt-5 space-y-3.5">
                  {plans.length ? (
                    plans.map((plan) => {
                      const count = businesses.filter((b) => b.planId === plan.id).length;
                      const percentage = businesses.length ? Math.round((count / businesses.length) * 100) : 0;
                      return (
                        <div key={plan.id} className="rounded-xl border border-[#ede9df] bg-[#fbfaf6] p-3.5">
                          <div className="flex items-center justify-between text-[12px]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-[#203147]">{plan.name}</span>
                              <span className="rounded bg-[#f0eee6] px-2 py-0.5 font-mono text-[10px] text-[#71828f]">
                                {money(plan.price)} / {plan.interval}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-[#16806e]">
                              {count} {count === 1 ? 'venue' : 'venues'} ({percentage}%)
                            </span>
                          </div>
                          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#eceae2]">
                            <div
                              className="h-full rounded-full bg-[#16806e] transition-all duration-500"
                              style={{ width: `${Math.max(count ? 8 : 0, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[12px] text-[#89949a]">No subscription plans configured yet.</p>
                  )}
                </div>
              </section>

              <section className="relative overflow-hidden rounded-[18px] bg-[#203147] p-6 text-white">
                <span className="absolute -right-12 -top-10 h-36 w-36 rounded-full border border-white/10" />
                <span className="absolute -right-1 top-3 h-24 w-24 rounded-full border border-white/10" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-[#7ed2b5]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#64c9aa]" /> PLATFORM INFRASTRUCTURE
                  </div>
                  <p className="mt-6 font-display text-[22px] font-bold tracking-[-.04em]">
                    All Systems Operational
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#aab8c1]">
                    Multi-tenant restaurant engine running 24/7. High-availability QR routing and live kitchen ordering active.
                  </p>

                  <div className="mt-6 space-y-2.5 border-t border-white/10 pt-4 text-[11px]">
                    <div className="flex items-center justify-between text-[#d6e0e6]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#47a486]" /> Core API & Routing
                      </span>
                      <span className="font-mono text-[10px] text-[#7ed2b5]">99.99% Uptime</span>
                    </div>
                    <div className="flex items-center justify-between text-[#d6e0e6]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#47a486]" /> Active Client Venues
                      </span>
                      <span className="font-mono text-[10px] font-bold text-white">
                        {businesses.filter((b) => b.status === 'active').length} of {businesses.length} Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#d6e0e6]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#47a486]" /> QR Table Dispatch
                      </span>
                      <span className="font-mono text-[10px] text-[#7ed2b5]">Active</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-[1.55fr_.85fr]">
              <section className="surface p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[12px] font-bold text-[#384c5e]">Order activity</p>
                    <p className="mt-1 text-[10px] text-[#89949a]">
                      A steady pulse through {timeframeLabels[timeframe].toLowerCase()}’s service
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f1eb] px-2 py-1 text-[9px] font-semibold text-[#37806c]">
                    <ArrowUpRight size={11} /> Live
                  </span>
                </div>
                <TrendChart data={trendData} />
              </section>

              <section className="relative overflow-hidden rounded-[18px] bg-[#203147] p-6 text-white">
                <span className="absolute -right-12 -top-10 h-36 w-36 rounded-full border border-white/10" />
                <span className="absolute -right-1 top-3 h-24 w-24 rounded-full border border-white/10" />
                <div className="relative">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-[#7ed2b5]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#64c9aa]" /> SERVICE PULSE
                  </div>
                  <p className="mt-8 font-display text-[23px] font-bold tracking-[-.04em]">
                    Everything’s moving.
                  </p>
                  <p className="mt-2 max-w-[250px] text-[11px] leading-5 text-[#aab8c1]">
                    Your team has {venuePendingCount} orders in progress. Keep the good rhythm going.
                  </p>
                  <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-[10px] text-[#9aabb6]">
                      Order volume ({timeframeLabels[timeframe]})
                    </span>
                    <span className="text-[12px] font-bold">{venueOrderCount} orders</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Super Admin Bottom Section: Registered Businesses vs Vendor Bottom Section: Latest Table Orders */}
          {isSuperAdmin ? (
            <section className="surface mt-5 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-display text-[15px] font-bold tracking-[-.025em]">
                    Registered Client Venues
                  </h2>
                  <p className="mt-0.5 text-[10px] text-[#89949a]">
                    Businesses and restaurants currently active on Tablewave
                  </p>
                </div>
                <Link
                  href="/businesses"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16806e] cursor-pointer"
                >
                  Manage all businesses <ArrowRight size={12} />
                </Link>
              </div>
              {businesses.length ? (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Venue</Th>
                      <Th>Owner</Th>
                      <Th>Plan</Th>
                      <Th>Outlets</Th>
                      <Th>Orders</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {businesses.slice(0, 5).map((b) => (
                      <tr key={b.id} data-testid={`row-business-${b.id}`}>
                        <Td>
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#e7eee8] text-[#427c69]">
                              <Store size={14} />
                            </span>
                            <span className="font-semibold text-[#34485a]">
                              {b.name}
                              <small className="mt-0.5 block text-[9px] font-normal text-[#939da0]">{b.type}</small>
                            </span>
                          </div>
                        </Td>
                        <Td>{b.ownerEmail}</Td>
                        <Td>{b.planName || 'No plan'}</Td>
                        <Td>{b.outletCount} outlets</Td>
                        <Td>{b.orderCount.toLocaleString()} orders</Td>
                        <Td>
                          <Status value={b.status} />
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              ) : (
                <div className="px-5 pb-5">
                  <EmptyState
                    title="No businesses yet"
                    description="Onboard your first restaurant to start scaling Tablewave."
                    action={
                      <Link href="/businesses" className="btn-primary">
                        Add business
                      </Link>
                    }
                  />
                </div>
              )}
            </section>
          ) : (
            <section className="surface mt-5 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-display text-[15px] font-bold tracking-[-.025em]">Latest orders</h2>
                  <p className="mt-0.5 text-[10px] text-[#89949a]">The most recent guest activity at tables</p>
                </div>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16806e] cursor-pointer"
                >
                  View orders <ArrowRight size={12} />
                </Link>
              </div>
              {recent.length ? (
                <TableWrap>
                  <thead>
                    <tr>
                      <Th>Guest</Th>
                      <Th>Location</Th>
                      <Th>Items</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Time</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.slice(0, 5).map((order: Order) => (
                      <tr key={order.id} data-testid={`row-order-${order.id}`}>
                        <Td className="font-semibold text-[#35495a]">
                          {order.customerName || 'Guest'}
                          <span className="mt-1 block font-mono text-[9px] font-normal text-[#9ba4a6]">
                            #{order.id.slice(0, 7)}
                          </span>
                        </Td>
                        <Td>
                          {order.outletName} · Table {order.tableNumber}
                        </Td>
                        <Td>
                          {order.items.reduce((sum: number, item: OrderLine) => sum + item.quantity, 0)} items
                        </Td>
                        <Td className="font-semibold text-[#35495a]">{money(order.total)}</Td>
                        <Td>
                          <Status value={order.status} />
                        </Td>
                        <Td>{dateTime(order.createdAt)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              ) : (
                <div className="px-5 pb-5">
                  <EmptyState
                    title="The first order is just around the corner"
                    description="Once a guest scans one of your table codes, their order will appear here."
                  />
                </div>
              )}
            </section>
          )}
        </>
      </QueryState>
    </>
  );
}

function BusinessesPage({
  businesses,
  plans,
  loading,
  error,
  retry,
  create,
  update,
  createPending,
  updatePending,
  client,
}: {
  businesses: Business[];
  plans: Plan[];
  loading: boolean;
  error: boolean;
  retry: () => void;
  create: ReturnType<typeof useCreateBusiness>;
  update: ReturnType<typeof useUpdateBusiness>;
  createPending: boolean;
  updatePending: boolean;
  client: ReturnType<typeof useQueryClient>;
}) {
  const [modal, setModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [editFormError, setEditFormError] = useState('');
  const [showVendorPass, setShowVendorPass] = useState(false);

  const visible = businesses.filter((b) =>
    `${b.name} ${b.ownerEmail} ${b.type}`.toLowerCase().includes(search.toLowerCase())
  );

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const f = new FormData(event.currentTarget);
    const bizName = String(f.get('name') || '').trim();
    const ownerEmail = String(f.get('ownerEmail') || '').trim().toLowerCase();
    const vendorPassword = String(f.get('password') || 'password123').trim();

    create.mutate(
      {
        data: {
          name: bizName,
          type: String(f.get('type')) as 'Restaurant' | 'Hotel' | 'Cinema/Theatre',
          ownerEmail: ownerEmail,
          password: vendorPassword,
          planId: String(f.get('planId') || '') || undefined,
          expiresAt: String(f.get('expiresAt') || '') || undefined,
        },
      },
      {
        onSuccess: async (createdBiz: any) => {
          setModal(false);
          // Directly ensure the administrator account is written to the Firestore users collection
          if (firestore && createdBiz?.id) {
            try {
              const ownerUid = `usr_${createdBiz.id}`;
              await setDoc(
                doc(firestore, 'users', ownerUid),
                {
                  id: ownerUid,
                  email: ownerEmail,
                  name: `${bizName} Admin`,
                  role: 'business_admin',
                  userType: 'business_admin',
                  status: 'active',
                  businessId: createdBiz.id,
                  businessName: bizName,
                  isSuperAdmin: false,
                  password: vendorPassword,
                  createdAt: new Date().toISOString(),
                },
                { merge: true }
              );
            } catch (fsErr) {
              console.warn('[Firestore] Direct user provision note:', fsErr);
            }
          }
          invalidate(client, paths.businesses, paths.dashboard);
        },
        onError: () => setFormError('Could not create this business. Check the details and try again.'),
      }
    );
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBusiness) return;
    setEditFormError('');
    const f = new FormData(event.currentTarget);
    const planVal = String(f.get('planId') || '');
    const expiryVal = String(f.get('expiresAt') || '');

    update.mutate(
      {
        businessId: editingBusiness.id,
        data: {
          name: String(f.get('name') || '').trim() || undefined,
          type: String(f.get('type') || '') as 'Restaurant' | 'Hotel' | 'Cinema/Theatre',
          planId: planVal || null,
          status: String(f.get('status') || '') as 'active' | 'suspended' | 'inactive',
          expiresAt: expiryVal ? new Date(expiryVal).toISOString() : null,
        },
      },
      {
        onSuccess: () => {
          setEditingBusiness(null);
          invalidate(client, paths.businesses, paths.dashboard);
        },
        onError: () => setEditFormError('Could not update business details. Please check the inputs.'),
      }
    );
  }

  return (
    <>
      <PageTitle
        eyebrow="Platform / Venues"
        title="Client Businesses"
        description="Add new restaurants, edit venue details, manage subscription tiers, and control platform access."
        action={
          <Button onClick={() => setModal(true)} testId="button-create-business">
            <CirclePlus size={16} /> Add business
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-[340px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1a3]" />
          <input
            aria-label="Search businesses"
            data-testid="input-search-businesses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search businesses or owners"
            className="field !py-[10px] !pl-9 text-[12px]"
          />
        </div>
        <p className="text-[11px] text-[#88939a]">{businesses.length} businesses registered on Tablewave</p>
      </div>
      <QueryState loading={loading} error={error} retry={retry}>
        {visible.length ? (
          <div className="surface overflow-hidden">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Business</Th>
                  <Th>Owner</Th>
                  <Th>Plan</Th>
                  <Th>Outlets</Th>
                  <Th>Orders</Th>
                  <Th>Created</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((business) => (
                  <tr key={business.id} data-testid={`row-business-${business.id}`}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#e7eee8] text-[#427c69]">
                          <Store size={14} />
                        </span>
                        <span className="font-semibold text-[#34485a]">
                          {business.name}
                          <small className="mt-1 block text-[9px] font-normal text-[#939da0]">
                            {business.type}
                          </small>
                        </span>
                      </div>
                    </Td>
                    <Td>{business.ownerEmail}</Td>
                    <Td>
                      {business.planName || 'No plan'}
                      {business.expiresAt && (
                        <small className="mt-1 block text-[9px] text-[#919c9e]">
                          Until {dateShort(business.expiresAt)}
                        </small>
                      )}
                    </Td>
                    <Td>{business.outletCount} outlets</Td>
                    <Td>{business.orderCount.toLocaleString()}</Td>
                    <Td>{dateShort(business.createdAt)}</Td>
                    <Td>
                      <Status value={business.status} />
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingBusiness(business);
                            setEditFormError('');
                          }}
                          testId={`button-edit-business-${business.id}`}
                        >
                          <Edit3 size={13} /> Edit
                        </Button>
                        <Button
                          variant="quiet"
                          disabled={updatePending}
                          onClick={() =>
                            update.mutate(
                              {
                                businessId: business.id,
                                data: {
                                  status: business.status === 'active' ? 'suspended' : 'active',
                                },
                              },
                              {
                                onSuccess: () => invalidate(client, paths.businesses, paths.dashboard),
                              }
                            )
                          }
                        >
                          {business.status === 'active' ? 'Suspend' : 'Activate'}
                        </Button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          </div>
        ) : (
          <EmptyState
            title={search ? 'No matching businesses' : 'No businesses yet'}
            description={
              search
                ? 'Try another name, owner or venue type.'
                : 'Add your first business to start bringing venues onto Tablewave.'
            }
            action={
              !search && (
                <Button onClick={() => setModal(true)}>
                  <Plus size={15} /> Add business
                </Button>
              )
            }
          />
        )}
      </QueryState>

      {/* Add Business Modal */}
      {modal && (
        <Modal
          title="Add a business"
          subtitle="Create a venue and provision its primary vendor administrator account."
          onClose={() => setModal(false)}
        >
          <form onSubmit={submitCreate} className="space-y-4">
            <Field label="Business name">
              <input
                className="field"
                name="name"
                placeholder="e.g. The Juniper Room"
                required
                data-testid="input-business-name"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Venue type">
                <AppSelect
                  name="type"
                  defaultValue="Restaurant"
                  testId="select-business-type"
                  options={['Restaurant', 'Hotel', 'Cinema/Theatre', 'Cafe', 'Bar', 'Bakery']}
                />
              </Field>
              <Field label="Subscription plan">
                <AppSelect
                  name="planId"
                  defaultValue=""
                  testId="select-business-plan"
                  placeholder="Choose a plan"
                  options={[
                    { value: '', label: 'No plan / Trial' },
                    ...plans.map((plan) => ({
                      value: plan.id,
                      label: plan.name,
                      description: `${money(plan.price)}/${plan.interval}`,
                    })),
                  ]}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Owner email" hint="Primary login email">
                <input
                  className="field"
                  type="email"
                  name="ownerEmail"
                  placeholder="owner@venue.com"
                  required
                  data-testid="input-business-owner"
                />
              </Field>
              <Field label="Vendor login password" hint="Min 6 characters">
                <div className="relative">
                  <input
                    className="field !pr-10"
                    type={showVendorPass ? 'text' : 'password'}
                    name="password"
                    placeholder="Create vendor password"
                    minLength={6}
                    required
                    data-testid="input-business-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowVendorPass((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded text-[#8899a6] hover:text-[#203147] transition-colors cursor-pointer"
                    title={showVendorPass ? 'Hide password' : 'Show password'}
                    aria-label={showVendorPass ? 'Hide password' : 'Show password'}
                  >
                    {showVendorPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </div>
            <Field label="Subscription expiry" hint="Optional — set access validity period">
              <AppDatePicker
                name="expiresAt"
                placeholder="dd-mm-yyyy"
                testId="input-business-expiry"
              />
            </Field>
            {formError && (
              <p className="rounded-lg bg-[#fae9e6] px-3 py-2 text-[11px] text-[#a84e45]">{formError}</p>
            )}
            <div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4">
              <Button variant="secondary" onClick={() => setModal(false)}>
                Cancel
              </Button>
              <SubmitButton pending={createPending}>Create business</SubmitButton>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Business Modal for Super Admin */}
      {editingBusiness && (
        <Modal
          title={`Edit ${editingBusiness.name}`}
          subtitle="Update venue details, subscription tier, and platform status."
          onClose={() => setEditingBusiness(null)}
        >
          <form onSubmit={submitEdit} className="space-y-4">
            <Field label="Business name">
              <input
                className="field"
                name="name"
                defaultValue={editingBusiness.name}
                required
                data-testid="input-edit-business-name"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Venue type">
                <AppSelect
                  name="type"
                  defaultValue={editingBusiness.type}
                  testId="select-edit-business-type"
                  options={['Restaurant', 'Hotel', 'Cinema/Theatre', 'Cafe', 'Bar', 'Bakery']}
                />
              </Field>
              <Field label="Subscription plan">
                <AppSelect
                  name="planId"
                  defaultValue={editingBusiness.planId || ''}
                  testId="select-edit-business-plan"
                  options={[
                    { value: '', label: 'No Plan' },
                    ...plans.map((p) => ({
                      value: p.id,
                      label: p.name,
                      description: `${money(p.price)}/${p.interval}`,
                    })),
                  ]}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Platform status">
                <AppSelect
                  name="status"
                  defaultValue={editingBusiness.status}
                  testId="select-edit-business-status"
                  options={[
                    { value: 'active', label: 'Active', description: 'Business has full access' },
                    { value: 'suspended', label: 'Suspended', description: 'Access is restricted' },
                    { value: 'inactive', label: 'Inactive', description: 'Business is paused' },
                  ]}
                />
              </Field>
              <Field label="Subscription expiry" hint="Optional — set access validity period">
                <AppDatePicker
                  name="expiresAt"
                  defaultValue={
                    editingBusiness.expiresAt
                      ? new Date(editingBusiness.expiresAt).toISOString().split('T')[0]
                      : ''
                  }
                  placeholder="dd-mm-yyyy"
                  testId="input-edit-business-expiry"
                />
              </Field>
            </div>
            {editFormError && (
              <p className="rounded-lg bg-[#fae9e6] px-3 py-2 text-[11px] text-[#a84e45]">
                {editFormError}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4">
              <Button variant="secondary" onClick={() => setEditingBusiness(null)}>
                Cancel
              </Button>
              <SubmitButton pending={updatePending}>Save changes</SubmitButton>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function TeamPage({ members, loading, error, retry, invite, pending, user, client }: { members: import('@workspace/api-client-react').TeamMember[]; loading: boolean; error: boolean; retry: () => void; invite: ReturnType<typeof useInviteTeamMember>; pending: boolean; user: CurrentUser; client: ReturnType<typeof useQueryClient> }) {
  const [modal, setModal] = useState(false); const [formError, setFormError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFormError(''); const f = new FormData(event.currentTarget); invite.mutate({ data: { email: String(f.get('email')), role: String(f.get('role')) as 'business_admin' | 'staff', businessId: user.businessId || null } }, { onSuccess: () => { setModal(false); invalidate(client, paths.team); }, onError: () => setFormError('Invitation could not be sent. Confirm the email and try again.') }); }
  return <><PageTitle eyebrow="People / access" title="Your team" description="Invite the people who keep every service running smoothly." action={<Button onClick={() => setModal(true)} testId="button-invite-member"><Plus size={16} /> Invite teammate</Button>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_290px]"><div className="surface flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#e7f0e9] text-[#16806e]"><Users size={19} /></span><div><p className="font-display text-[20px] font-bold tracking-[-.04em]">{members.length} <span className="text-[12px] font-semibold tracking-normal text-[#78868e]">team members</span></p><p className="mt-1 text-[10px] text-[#89959a]">People with access to your workspace</p></div></div><div className="flex items-center justify-between rounded-[16px] bg-[#203147] px-5 py-4 text-white"><div><p className="text-[10px] text-[#a8b8c0]">Open invitations</p><p className="mt-1 font-display text-[22px] font-bold">{members.filter((m) => m.status === 'invited').length}</p></div><ArrowUpRight size={18} className="text-[#68cbb0]" /></div></div>
    <QueryState loading={loading} error={error} retry={retry}>{members.length ? <div className="surface overflow-hidden"><TableWrap><thead><tr><Th>Member</Th><Th>Role</Th><Th>Business</Th><Th>Joined</Th><Th>Status</Th></tr></thead><tbody>{members.map((member) => <tr key={member.id} data-testid={`row-team-member-${member.id}`}><Td><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e5eee8] font-display text-[10px] font-bold text-[#367663]">{initials(member.name || member.email)}</span><span className="font-semibold text-[#35495a]">{member.name || 'Invitation pending'}<small className="mt-1 block text-[10px] font-normal text-[#89959a]">{member.email}</small></span></div></Td><Td><span className="capitalize">{member.role.replace('_', ' ')}</span></Td><Td>{member.businessName || 'Platform'}</Td><Td>{dateShort(member.createdAt)}</Td><Td><Status value={member.status} /></Td></tr>)}</tbody></TableWrap></div> : <EmptyState title="Bring your crew in" description="Invite a teammate to help manage menus, orders and service." action={<Button onClick={() => setModal(true)}><Plus size={15} /> Invite teammate</Button>} />}</QueryState>
    {modal && <Modal title="Invite a teammate" subtitle="They’ll receive an invitation at their work email." onClose={() => setModal(false)}><form onSubmit={submit} className="space-y-4"><Field label="Work email"><input className="field" type="email" name="email" placeholder="teammate@venue.com" required data-testid="input-invite-email" /></Field><Field label="Access level"><AppSelect name="role" defaultValue="staff" testId="select-invite-role" options={[{ value: 'staff', label: 'Staff — manage service' }, { value: 'business_admin', label: 'Business admin — manage venue' }]} /></Field>{formError && <p className="rounded-lg bg-[#fae9e6] px-3 py-2 text-[11px] text-[#a84e45]">{formError}</p>}<div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><SubmitButton pending={pending}>Send invitation</SubmitButton></div></form></Modal>}
  </>;
}

function PlansPage({ plans, loading, error, retry, create, pending, client }: { plans: Plan[]; loading: boolean; error: boolean; retry: () => void; create: ReturnType<typeof useCreatePlan>; pending: boolean; client: ReturnType<typeof useQueryClient> }) {
  const [modal, setModal] = useState(false); const [formError, setFormError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFormError(''); const f = new FormData(event.currentTarget); create.mutate({ data: { name: String(f.get('name')), price: Number(f.get('price')), interval: String(f.get('interval')) as 'month' | 'year', outletLimit: Number(f.get('outletLimit')), itemLimit: Number(f.get('itemLimit')) } }, { onSuccess: () => { setModal(false); invalidate(client, paths.plans); }, onError: () => setFormError('Plan could not be created. Check the limits and price.') }); }
  return <><PageTitle eyebrow="Subscriptions / billing" title="Plans that fit the venue." description="Set subscription limits and keep every account on the right plan." action={<Button onClick={() => setModal(true)}><Plus size={16} /> Create plan</Button>} />
    <QueryState loading={loading} error={error} retry={retry}>{plans.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan, i) => <article key={plan.id} className={`surface relative overflow-hidden p-6 ${i === 1 ? 'border-[#bbd8cd] bg-[#e9f1e9]' : ''}`} data-testid={`card-plan-${plan.id}`}><div className="flex items-center justify-between"><span className="rounded-full bg-[#f0efe9] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[.12em] text-[#87928f]">PLAN / 0{i + 1}</span><Status value={plan.active ? 'active' : 'inactive'} /></div><h2 className="mt-6 font-display text-[23px] font-bold tracking-[-.05em] text-[#293d50]">{plan.name}</h2><div className="mt-3 flex items-baseline gap-1"><span className="font-display text-[40px] font-bold tracking-[-.07em]">{money(plan.price)}</span><span className="text-[11px] text-[#7c898e]">/ {plan.interval}</span></div><div className="my-6 h-px bg-[#e8e6de]" /><div className="space-y-3 text-[12px] text-[#596976]"><p className="flex items-center gap-2"><Check size={14} className="text-[#16806e]" /> Up to {plan.outletLimit} outlets</p><p className="flex items-center gap-2"><Check size={14} className="text-[#16806e]" /> Up to {plan.itemLimit} menu items</p></div><p className="mt-7 border-t border-[#e8e6de] pt-4 text-[10px] text-[#89949a]">Assigned to {plan.active ? 'active subscriptions' : 'no active businesses'}</p></article>)}</div> : <EmptyState title="Your plans start here" description="Create a subscription plan to define outlet and menu limits for each business." action={<Button onClick={() => setModal(true)}><Plus size={15} /> Create plan</Button>} />}</QueryState>
    {modal && <Modal title="Create a plan" subtitle="Set a clear fit for a business at every stage." onClose={() => setModal(false)}><form onSubmit={submit} className="space-y-4"><Field label="Plan name"><input name="name" required className="field" placeholder="e.g. Studio" data-testid="input-plan-name" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Price"><input name="price" type="number" min="0" step="0.01" required className="field" placeholder="49" data-testid="input-plan-price" /></Field><Field label="Billing interval"><AppSelect name="interval" defaultValue="month" options={[{ value: 'month', label: 'Monthly' }, { value: 'year', label: 'Yearly' }]} /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Outlet limit"><input name="outletLimit" type="number" min="1" required className="field" defaultValue="1" data-testid="input-plan-outlets" /></Field><Field label="Menu item limit"><input name="itemLimit" type="number" min="1" required className="field" defaultValue="80" data-testid="input-plan-items" /></Field></div>{formError && <p className="rounded-lg bg-[#fae9e6] px-3 py-2 text-[11px] text-[#a84e45]">{formError}</p>}<div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><SubmitButton pending={pending}>Create plan</SubmitButton></div></form></Modal>}
  </>;
}

const FOOD_PHOTO_PRESETS = [
  { label: '🍔 Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
  { label: '🍕 Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80' },
  { label: '🍝 Pasta', url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281242?w=600&auto=format&fit=crop&q=80' },
  { label: '🥗 Salad', url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' },
  { label: '☕ Coffee', url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80' },
  { label: '🍸 Cocktail', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&auto=format&fit=crop&q=80' },
  { label: '🍰 Dessert', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80' },
];

function MenuPage({ businessId, categories, items, loading, error, retry, client }: { businessId: string; categories: Category[]; items: MenuItem[]; loading: boolean; error: boolean; retry: () => void; client: ReturnType<typeof useQueryClient> }) {
  const [categoryModal, setCategoryModal] = useState<Category | 'new' | null>(null);
  const [itemModal, setItemModal] = useState<MenuItem | 'new' | null>(null);
  const [photoUrlValue, setPhotoUrlValue] = useState('');
  const [filter, setFilter] = useState('all');
  const [formError, setFormError] = useState('');
  const createCategory = useCreateCategory(); const updateCategory = useUpdateCategory(); const deleteCategory = useDeleteCategory();
  const createItem = useCreateItem(); const updateItem = useUpdateItem(); const deleteItem = useDeleteItem();
  const visible = filter === 'all' ? items : items.filter((item) => item.categoryId === filter);
  const choices = (value: FormDataEntryValue | null) => String(value || '').split(',').map((part) => part.trim()).filter(Boolean).map((part) => { const [name, price] = part.split(':'); return { name: name.trim(), price: Number(price || 0) }; });
  const refresh = () => invalidate(client, paths.categories, paths.items);

  function openItemModal(item: MenuItem | 'new') {
    setFormError('');
    setItemModal(item);
    setPhotoUrlValue(item === 'new' ? '' : item.imageUrl || '');
  }

  function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(''); const name = String(new FormData(event.currentTarget).get('name'));
    if (categoryModal === 'new') createCategory.mutate({ data: { businessId, name } }, { onSuccess: () => { setCategoryModal(null); refresh(); }, onError: () => setFormError('Could not save this category.') });
    else if (categoryModal) updateCategory.mutate({ categoryId: categoryModal.id, data: { name } }, { onSuccess: () => { setCategoryModal(null); refresh(); }, onError: () => setFormError('Could not update this category.') });
  }

  function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(''); const f = new FormData(event.currentTarget);
    const data = {
      categoryId: String(f.get('categoryId')),
      name: String(f.get('name')),
      description: String(f.get('description') || ''),
      price: Number(f.get('price')),
      imageUrl: photoUrlValue || String(f.get('imageUrl') || ''),
      available: f.get('available') === 'on',
      variants: choices(f.get('variants')),
      addOns: choices(f.get('addOns')),
    };
    if (itemModal === 'new') createItem.mutate({ data: { businessId, ...data } }, { onSuccess: () => { setItemModal(null); refresh(); }, onError: () => setFormError('Could not create this item. Check the details.') });
    else if (itemModal) updateItem.mutate({ itemId: itemModal.id, data }, { onSuccess: () => { setItemModal(null); refresh(); }, onError: () => setFormError('Could not update this item.') });
  }

  function removeCategory(category: Category) { if (window.confirm(`Delete ${category.name}? Items in this category may be affected.`)) deleteCategory.mutate({ categoryId: category.id }, { onSuccess: refresh }); }
  function removeItem(item: MenuItem) { if (window.confirm(`Remove ${item.name} from the menu?`)) deleteItem.mutate({ itemId: item.id }, { onSuccess: refresh }); }
  const [confirmAvailability, setConfirmAvailability] = useState<MenuItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<MenuItem | null>(null);
  const pendingItem = createItem.isPending || updateItem.isPending;

  return <><PageTitle eyebrow="Menu / catalog" title="Your menu, in good shape." description="Manage categories, dishes and what guests can order right now." action={<Button onClick={() => openItemModal('new')} testId="button-add-menu-item"><Plus size={16} /> Add menu item</Button>} />
    <QueryState loading={loading} error={error} retry={retry}><div className="grid gap-4 lg:grid-cols-[250px_1fr]">
      <section className="surface h-fit p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-[11px] font-bold uppercase tracking-[.1em] text-[#859198]">Categories</h2><button onClick={() => { setFormError(''); setCategoryModal('new'); }} aria-label="Add category" data-testid="button-add-category" className="icon-button !h-8 !w-8 text-[#16806e]"><Plus size={16} /></button></div>
        <button onClick={() => setFilter('all')} data-testid="button-filter-all" className={`mb-1 flex w-full items-center justify-between rounded-[10px] px-3 py-2.5 text-left text-[12px] ${filter === 'all' ? 'bg-[#e6f0e9] font-semibold text-[#276d5e]' : 'text-[#687781] hover:bg-[#f4f3ed]'}`}><span>All menu items</span><span className="font-mono text-[9px]">{items.length}</span></button>
        {categories.map((category) => <div key={category.id} className={`group mb-1 flex items-center rounded-[10px] ${filter === category.id ? 'bg-[#e6f0e9]' : 'hover:bg-[#f4f3ed]'}`}><button onClick={() => setFilter(category.id)} data-testid={`button-filter-category-${category.id}`} className={`flex min-w-0 flex-1 items-center justify-between px-3 py-2.5 text-left text-[12px] ${filter === category.id ? 'font-semibold text-[#276d5e]' : 'text-[#687781]'}`}><span className="truncate">{category.name}</span><span className="ml-2 font-mono text-[9px]">{items.filter((item) => item.categoryId === category.id).length}</span></button><button aria-label={`Edit ${category.name}`} onClick={() => setCategoryModal(category)} className="icon-button !h-7 !w-7 opacity-0 group-hover:opacity-100"><Edit3 size={12} /></button><button aria-label={`Delete ${category.name}`} onClick={() => removeCategory(category)} className="icon-button !h-7 !w-7 text-[#a84e45] opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button></div>)}
        <button onClick={() => setCategoryModal('new')} className="mt-3 flex items-center gap-2 px-3 text-[10px] font-semibold text-[#16806e]"><Plus size={13} /> New category</button>
      </section>
      <div className="space-y-3">{visible.length ? visible.map((item) => <article key={item.id} className="surface flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4" data-testid={`card-menu-item-${item.id}`}>
          <div className="grid h-[68px] w-[68px] shrink-0 place-items-center overflow-hidden rounded-[13px] bg-[#e9efe8]">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <Utensils size={19} className="text-[#7c9c8d]" />}</div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-[13px] font-bold text-[#34495b]">{item.name}</h3><Status value={item.available ? 'available' : 'unavailable'} /></div><p className="mt-1 line-clamp-1 text-[10px] text-[#89959b]">{item.description || item.categoryName}</p><p className="mt-2 font-mono text-[11px] font-semibold text-[#405469]">{money(item.price)} <span className="font-sans font-normal text-[#8c989b]">· {item.categoryName}</span></p></div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setConfirmAvailability(item)}
              aria-label={item.available ? 'Pause dish availability' : 'Publish dish to menu'}
              data-testid={`button-toggle-item-${item.id}`}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition-colors cursor-pointer ${
                item.available
                  ? 'bg-[#fff5ee] text-[#c26d24] hover:bg-[#ffeade]'
                  : 'bg-[#e9f4ef] text-[#16806e] hover:bg-[#d8ece2]'
              }`}
            >
              {item.available ? 'Pause' : 'Publish'}
            </button>
            <button onClick={() => openItemModal(item)} aria-label={`Edit ${item.name}`} data-testid={`button-edit-item-${item.id}`} className="icon-button"><Edit3 size={15} /></button>
            <button onClick={() => setConfirmDeleteItem(item)} aria-label={`Delete ${item.name}`} data-testid={`button-delete-item-${item.id}`} className="icon-button text-[#a84e45]"><Trash2 size={15} /></button>
          </div>
        </article>) : <EmptyState title={filter === 'all' ? 'Your menu is ready for its first item' : 'Nothing in this category yet'} description="Add a dish to start building a menu guests will love." action={<Button onClick={() => openItemModal('new')}><Plus size={15} /> Add menu item</Button>} />}</div>
    </div></QueryState>
    {categoryModal && <Modal title={categoryModal === 'new' ? 'Add a category' : 'Edit category'} subtitle="Keep your menu easy to scan." onClose={() => setCategoryModal(null)}><form onSubmit={saveCategory} className="space-y-4"><Field label="Category name"><input className="field" name="name" required defaultValue={categoryModal === 'new' ? '' : categoryModal.name} placeholder="e.g. Small plates" data-testid="input-category-name" /></Field>{formError && <p className="text-[11px] text-[#a84e45]">{formError}</p>}<div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setCategoryModal(null)}>Cancel</Button><SubmitButton pending={createCategory.isPending || updateCategory.isPending}>Save category</SubmitButton></div></form></Modal>}
    {itemModal && <Modal title={itemModal === 'new' ? 'Add a menu item' : 'Edit menu item'} subtitle="Give guests the details that make choosing easy." onClose={() => setItemModal(null)} wide><form onSubmit={saveItem} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Field label="Item name"><input className="field" name="name" required defaultValue={itemModal === 'new' ? '' : itemModal.name} placeholder="e.g. Charred corn & ricotta" data-testid="input-item-name" /></Field></div>
      <Field label="Category"><AppSelect name="categoryId" required defaultValue={itemModal === 'new' ? categories[0]?.id || '' : itemModal.categoryId} testId="select-item-category" options={categories.map((category) => ({ value: category.id, label: category.name }))} /></Field>
      <Field label="Price"><input className="field" name="price" type="number" step="0.01" min="0" required defaultValue={itemModal === 'new' ? '' : itemModal.price} placeholder="14.50" data-testid="input-item-price" /></Field>
      <div className="sm:col-span-2"><Field label="Description"><textarea className="field min-h-[78px] resize-y" name="description" defaultValue={itemModal === 'new' ? '' : itemModal.description} placeholder="A short, lovely description." data-testid="input-item-description" /></Field></div>
      <div className="sm:col-span-2">
        <Field label="Photo URL" hint="Paste URL or click a preset below">
          <input className="field" type="url" name="imageUrl" value={photoUrlValue} onChange={(e) => setPhotoUrlValue(e.target.value)} placeholder="https://…" data-testid="input-item-image" />
        </Field>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-[#7d8b94] font-semibold mr-1">Presets:</span>
          {FOOD_PHOTO_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setPhotoUrlValue(preset.url)}
              className="rounded-md border border-[#e2ded5] bg-[#fbfaf6] px-2 py-1 text-[10px] font-semibold text-[#546672] hover:border-[#16806e] hover:text-[#16806e] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <Field label="Variants" hint="Separate choices with commas, e.g. Small:0, Large:3"><input className="field" name="variants" defaultValue={itemModal === 'new' ? '' : itemModal.variants.map((choice) => `${choice.name}:${choice.price}`).join(', ')} placeholder="Regular:0, Large:3" data-testid="input-item-variants" /></Field>
      <Field label="Add-ons" hint="Separate choices with commas, e.g. Avocado:2"><input className="field" name="addOns" defaultValue={itemModal === 'new' ? '' : itemModal.addOns.map((choice) => `${choice.name}:${choice.price}`).join(', ')} placeholder="Extra herbs:1.5" data-testid="input-item-addons" /></Field>
      <label className="flex items-center gap-2 text-[12px] font-semibold text-[#53616e] sm:col-span-2"><input type="checkbox" name="available" defaultChecked={itemModal === 'new' ? true : itemModal.available} className="h-4 w-4 accent-[#16806e]" data-testid="checkbox-item-available" /> Available to order</label>
      {formError && <p className="text-[11px] text-[#a84e45] sm:col-span-2">{formError}</p>}<div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4 sm:col-span-2"><Button variant="secondary" onClick={() => setItemModal(null)}>Cancel</Button><SubmitButton pending={pendingItem}>{itemModal === 'new' ? 'Add item' : 'Save item'}</SubmitButton></div>
    </form></Modal>}

    {/* Confirmation Modal for Pause / Publish Menu Item */}
    {confirmAvailability && (
      <Modal
        title={confirmAvailability.available ? `Pause "${confirmAvailability.name}"?` : `Publish "${confirmAvailability.name}"?`}
        subtitle={confirmAvailability.available ? 'Make this item unavailable for guest ordering' : 'Make this item live on the menu'}
        onClose={() => setConfirmAvailability(null)}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 rounded-xl border border-[#ede9df] bg-[#fbfaf6] p-3.5">
            <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#e9efe8]">
              {confirmAvailability.imageUrl ? (
                <img src={confirmAvailability.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <Utensils size={18} className="text-[#7c9c8d]" />
              )}
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#26384a]">{confirmAvailability.name}</p>
              <p className="mt-0.5 text-[11px] font-mono font-semibold text-[#16806e]">{money(confirmAvailability.price)}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-[#738491]">
                {confirmAvailability.available
                  ? 'Guests scanning table QR codes will see this dish marked as Sold Out / Paused. They will not be able to add it to their carts.'
                  : 'This dish will immediately become available for guests to order from their phones at all tables.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4">
            <Button variant="secondary" onClick={() => setConfirmAvailability(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmAvailability.available ? 'secondary' : 'primary'}
              className={confirmAvailability.available ? '!border-[#e6c9b3] !bg-[#fff4eb] !text-[#b55818] hover:!bg-[#ffe8d6]' : ''}
              disabled={updateItem.isPending}
              onClick={() => {
                const target = confirmAvailability;
                updateItem.mutate(
                  { itemId: target.id, data: { available: !target.available } },
                  {
                    onSuccess: () => {
                      setConfirmAvailability(null);
                      refresh();
                    },
                  }
                );
              }}
            >
              {updateItem.isPending ? 'Updating...' : confirmAvailability.available ? 'Pause Dish' : 'Publish Dish'}
            </Button>
          </div>
        </div>
      </Modal>
    )}

    {/* Confirmation Modal for Delete Menu Item */}
    {confirmDeleteItem && (
      <Modal
        title={`Delete "${confirmDeleteItem.name}"?`}
        subtitle="Permanently remove this dish from your restaurant menu."
        onClose={() => setConfirmDeleteItem(null)}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[#fae2df] bg-[#fdf5f4] p-4 text-[12px] leading-relaxed text-[#a84e45]">
            <p className="font-semibold">This action cannot be undone.</p>
            <p className="mt-1 text-[11px] text-[#8c3d36]">
              "{confirmDeleteItem.name}" will be deleted from your catalog immediately. Past order records referencing this item will still retain their historical line details.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4">
            <Button variant="secondary" onClick={() => setConfirmDeleteItem(null)}>
              Keep Dish
            </Button>
            <Button
              variant="primary"
              className="!bg-[#b84e45] hover:!bg-[#9e3f37] !text-white"
              disabled={deleteItem.isPending}
              onClick={() => {
                const target = confirmDeleteItem;
                deleteItem.mutate(
                  { itemId: target.id },
                  {
                    onSuccess: () => {
                      setConfirmDeleteItem(null);
                      refresh();
                    },
                  }
                );
              }}
            >
              {deleteItem.isPending ? 'Deleting...' : 'Delete Dish'}
            </Button>
          </div>
        </div>
      </Modal>
    )}
  </>;
}

function OutletsPage({ businessId, businesses, outlets, loading, error, retry, client }: { businessId: string; businesses: Business[]; outlets: Outlet[]; loading: boolean; error: boolean; retry: () => void; client: ReturnType<typeof useQueryClient> }) {
  const [modal, setModal] = useState<Outlet | 'new' | null>(null);
  const [formError, setFormError] = useState('');
  const [qrPreview, setQrPreview] = useState<{ outlet: Outlet; table: number; url: string; qrDataUrl: string; businessName: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmOutletStatus, setConfirmOutletStatus] = useState<Outlet | null>(null);
  const [confirmDeleteOutlet, setConfirmDeleteOutlet] = useState<Outlet | null>(null);

  const create = useCreateOutlet(); const update = useUpdateOutlet(); const remove = useDeleteOutlet();
  const refresh = () => invalidate(client, paths.outlets, paths.businesses, paths.dashboard);
  const scoped = outlets.filter((outlet) => !businessId || outlet.businessId === businessId);
  const activeBusiness = businesses.find((b) => b.id === businessId) || businesses[0];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError(''); const f = new FormData(event.currentTarget);
    const fields = { name: String(f.get('name')), address: String(f.get('address')), tableCount: Number(f.get('tableCount')) };
    if (modal === 'new') create.mutate({ data: { businessId: String(f.get('businessId') || businessId), ...fields } }, { onSuccess: () => { setModal(null); refresh(); }, onError: () => setFormError('This outlet could not be created. Please check the details.') });
    else if (modal) update.mutate({ outletId: modal.id, data: fields }, { onSuccess: () => { setModal(null); refresh(); }, onError: () => setFormError('This outlet could not be updated.') });
  }

  async function openTableQr(outlet: Outlet, table: number) {
    const business = businesses.find((item) => item.id === outlet.businessId);
    const slug = business?.slug || outlet.businessId;
    const url = `${window.location.origin}/store/${encodeURIComponent(slug)}/${encodeURIComponent(outlet.slug)}/${table}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 800,
        margin: 2,
        color: { dark: '#203147', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      setCopied(false);
      setQrPreview({ outlet, table, url, qrDataUrl, businessName: business?.name || 'Tablewave' });
    } catch {
      window.alert('Could not render table code. Please try again.');
    }
  }

  function copyQrUrl(url: string) {
    void navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadFromModal() {
    if (!qrPreview) return;
    const anchor = document.createElement('a');
    anchor.href = qrPreview.qrDataUrl;
    anchor.download = `${qrPreview.outlet.slug}-table-${qrPreview.table}.png`;
    anchor.click();
  }

  return <><PageTitle eyebrow="Locations / table codes" title="Every seat has a front door." description="Manage outlets, set the table count and download ready-to-print QR codes." action={<Button onClick={() => { setFormError(''); setModal('new'); }} testId="button-add-outlet"><Plus size={16} /> Add outlet</Button>} />
    <QueryState loading={loading} error={error} retry={retry}>{scoped.length ? <div className="grid gap-4 xl:grid-cols-2">{scoped.map((outlet) => {
      const business = businesses.find((item) => item.id === outlet.businessId);
      return <article key={outlet.id} className="surface overflow-hidden" data-testid={`card-outlet-${outlet.id}`}><div className="flex items-start justify-between gap-4 border-b border-[#efede6] p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#e6f0e9] text-[#16806e]"><QrCode size={19} /></span><div><h2 className="font-display text-[17px] font-bold tracking-[-.03em] text-[#31475a]">{outlet.name}</h2><p className="mt-1 text-[10px] text-[#87939a]">{outlet.address || 'Address not set'}{business && ` · ${business.name}`}</p><div className="mt-2"><Status value={outlet.active ? 'active' : 'inactive'} /></div></div></div><button aria-label={`More about ${outlet.name}`} onClick={() => setModal(outlet)} className="icon-button"><Edit3 size={15} /></button></div>
        <div className="flex items-center justify-between px-5 py-4 sm:px-6"><div><p className="font-display text-[22px] font-bold tracking-[-.045em] text-[#34495a]">{outlet.tableCount}<span className="ml-1.5 font-sans text-[11px] font-medium tracking-normal text-[#88949a]">tables</span></p><p className="mt-0.5 text-[9px] text-[#939da0]">Click any table to preview QR & test ordering</p></div><Button variant="secondary" onClick={() => setConfirmOutletStatus(outlet)} className={outlet.active ? 'hover:!border-[#e8c8b4] hover:!bg-[#fff5ee] hover:!text-[#b55818]' : 'hover:!border-[#cce5d7] hover:!bg-[#eaf5ef] hover:!text-[#16806e]'}>{outlet.active ? 'Pause outlet' : 'Activate outlet'}</Button></div>
        <div className="bg-[#f7f6f0] px-5 py-3.5 sm:px-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#89949a]">Interactive Table QR Codes</span>
            <button onClick={() => setModal(outlet)} className="text-[9px] font-semibold text-[#16806e] hover:underline">Edit table count</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: Math.min(outlet.tableCount, 24) }, (_, i) => (
              <button
                key={i}
                onClick={() => void openTableQr(outlet, i + 1)}
                title={`Preview Table ${i + 1} QR Code`}
                data-testid={`button-download-qr-${outlet.id}-${i + 1}`}
                className="rounded-lg border border-[#e3e0d7] bg-white px-2.5 py-1.5 font-mono text-[10px] font-semibold text-[#506371] hover:border-[#16806e] hover:bg-[#e7f1eb] hover:text-[#16806e] transition-all cursor-pointer"
              >
                <QrCode size={12} className="mr-1 inline text-[#16806e]" />
                T{i + 1}
              </button>
            ))}
          </div>
          {outlet.tableCount > 24 && <p className="mt-2 text-[9px] text-[#929c9e]">Showing first 24 of {outlet.tableCount} tables.</p>}
        </div>
        <div className="flex items-center justify-between px-5 py-3 sm:px-6"><a href={`/store/${encodeURIComponent(business?.slug || outlet.businessId)}/${encodeURIComponent(outlet.slug)}/1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#16806e]">Preview guest menu <ExternalLink size={12} /></a><button onClick={() => setConfirmDeleteOutlet(outlet)} aria-label={`Delete ${outlet.name}`} data-testid={`button-delete-outlet-${outlet.id}`} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#a84e45] hover:underline cursor-pointer"><Trash2 size={12} /> Remove</button></div>
      </article>;
    })}</div> : <EmptyState title="Start with a location" description="Add an outlet and Tablewave will prepare a unique code for each table." action={<Button onClick={() => setModal('new')}><Plus size={15} /> Add outlet</Button>} />}</QueryState>

    {/* Table QR Code Interactive Preview Modal */}
    {qrPreview && (
      <Modal title={`Table ${qrPreview.table} · ${qrPreview.outlet.name}`} subtitle={`Scannable QR code for ${qrPreview.businessName}`} onClose={() => setQrPreview(null)}>
        <div className="flex flex-col items-center text-center">
          <div className="relative rounded-2xl border border-[#e6e3da] bg-white p-5 shadow-sm">
            <img src={qrPreview.qrDataUrl} alt={`QR Table ${qrPreview.table}`} className="h-60 w-60 rounded-lg object-contain" />
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="rounded-full bg-[#16806e]/10 px-3 py-1 font-mono text-[10px] font-bold text-[#16806e]">
                TABLE {qrPreview.table}
              </span>
              <span className="text-[11px] font-semibold text-[#627583]">Scan to view menu & order</span>
            </div>
          </div>

          <div className="mt-5 w-full rounded-xl border border-[#e5e2d8] bg-[#f8f7f2] p-3 text-left">
            <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#8b98a0]">Direct Guest URL</p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <input
                readOnly
                value={qrPreview.url}
                className="w-full truncate bg-transparent font-mono text-[11px] text-[#34485a] outline-none"
              />
              <button
                type="button"
                onClick={() => copyQrUrl(qrPreview.url)}
                className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  copied
                    ? 'bg-[#16806e] text-white'
                    : 'border border-[#dcd7cb] bg-white text-[#475b6a] hover:bg-[#ede9df]'
                }`}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="mt-5 flex w-full flex-wrap items-center justify-between gap-3 border-t border-[#ebe8df] pt-4">
            <a
              href={qrPreview.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#16806e] hover:underline"
            >
              Open live storefront ↗
            </a>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setQrPreview(null)}>Close</Button>
              <Button onClick={downloadFromModal}><Download size={15} /> Download PNG</Button>
            </div>
          </div>
        </div>
      </Modal>
    )}

    {/* Confirmation Modal for Pause / Activate Outlet */}
    {confirmOutletStatus && (
      <Modal
        title={confirmOutletStatus.active ? `Pause "${confirmOutletStatus.name}"?` : `Activate "${confirmOutletStatus.name}"?`}
        subtitle={confirmOutletStatus.active ? 'Temporarily suspend guest ordering at this location' : 'Enable live ordering for all table QR codes'}
        onClose={() => setConfirmOutletStatus(null)}
      >
        <div className="space-y-4">
          <div className={`rounded-xl border p-4 text-[12px] leading-relaxed ${confirmOutletStatus.active ? 'border-[#fbe8dc] bg-[#fffaf5] text-[#b45d25]' : 'border-[#d6ecdf] bg-[#f4f9f6] text-[#246b57]'}`}>
            <p className="font-semibold">
              {confirmOutletStatus.active ? 'Guest ordering will be paused' : 'Live ordering will become active'}
            </p>
            <p className="mt-1 text-[11px] text-[#71828f]">
              {confirmOutletStatus.active
                ? `Guests scanning table QR codes at "${confirmOutletStatus.name}" will see that the outlet is currently closed or not taking orders. Existing kitchen orders remain safe.`
                : `Table QR codes at "${confirmOutletStatus.name}" will immediately allow guests to view the menu, select items, and place live kitchen orders.`}
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4">
            <Button variant="secondary" onClick={() => setConfirmOutletStatus(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              className={confirmOutletStatus.active ? '!border-[#e6c9b3] !bg-[#b55818] hover:!bg-[#9c4a12] !text-white' : ''}
              disabled={update.isPending}
              onClick={() => {
                const target = confirmOutletStatus;
                update.mutate(
                  { outletId: target.id, data: { active: !target.active } },
                  {
                    onSuccess: () => {
                      setConfirmOutletStatus(null);
                      refresh();
                    },
                  }
                );
              }}
            >
              {update.isPending ? 'Updating...' : confirmOutletStatus.active ? 'Pause Outlet' : 'Activate Outlet'}
            </Button>
          </div>
        </div>
      </Modal>
    )}

    {/* Confirmation Modal for Delete Outlet */}
    {confirmDeleteOutlet && (
      <Modal
        title={`Delete "${confirmDeleteOutlet.name}"?`}
        subtitle="This location and all its table QR codes will be permanently removed."
        onClose={() => setConfirmDeleteOutlet(null)}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[#fae2df] bg-[#fdf5f4] p-4 text-[12px] leading-relaxed text-[#a84e45]">
            <p className="font-semibold">All table QR codes will stop working immediately.</p>
            <p className="mt-1 text-[11px] text-[#8c3d36]">
              "{confirmDeleteOutlet.name}" ({confirmDeleteOutlet.tableCount} tables) will be permanently deleted. Guests scanning existing printed codes at these tables will see an error.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4">
            <Button variant="secondary" onClick={() => setConfirmDeleteOutlet(null)}>
              Keep Outlet
            </Button>
            <Button
              variant="primary"
              className="!bg-[#b84e45] hover:!bg-[#9e3f37] !text-white"
              disabled={remove.isPending}
              onClick={() => {
                const target = confirmDeleteOutlet;
                remove.mutate(
                  { outletId: target.id },
                  {
                    onSuccess: () => {
                      setConfirmDeleteOutlet(null);
                      refresh();
                    },
                  }
                );
              }}
            >
              {remove.isPending ? 'Deleting...' : 'Delete Outlet'}
            </Button>
          </div>
        </div>
      </Modal>
    )}

    {modal && <Modal title={modal === 'new' ? 'Add an outlet' : `Edit ${modal.name}`} subtitle="Set up the place where guests will order." onClose={() => setModal(null)}><form onSubmit={submit} className="space-y-4"><Field label="Outlet name"><input className="field" name="name" required defaultValue={modal === 'new' ? '' : modal.name} placeholder="e.g. The Garden Room" data-testid="input-outlet-name" /></Field><Field label="Address"><input className="field" name="address" defaultValue={modal === 'new' ? '' : modal.address} placeholder="14 Orchard Lane" data-testid="input-outlet-address" /></Field>{modal === 'new' && <Field label="Business"><input className="field cursor-not-allowed bg-[#f5f3ed]/60 font-medium text-[#334658] opacity-90" readOnly value={activeBusiness?.name || 'Your Venue'} data-testid="input-outlet-business" /><input type="hidden" name="businessId" value={activeBusiness?.id || businessId} /></Field>}<Field label="Number of tables"><input className="field" name="tableCount" type="number" min="1" required defaultValue={modal === 'new' ? 12 : modal.tableCount} data-testid="input-outlet-tables" /></Field>{formError && <p className="rounded-lg bg-[#fae9e6] px-3 py-2 text-[11px] text-[#a84e45]">{formError}</p>}<div className="flex justify-end gap-2 border-t border-[#ebe8df] pt-4"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><SubmitButton pending={create.isPending || update.isPending}>{modal === 'new' ? 'Create outlet' : 'Save outlet'}</SubmitButton></div></form></Modal>}
  </>;
}

const orderStatuses = ['new', 'preparing', 'ready', 'completed', 'cancelled'];
function OrdersPage({ orders, loading, error, retry, client }: { orders: Order[]; loading: boolean; error: boolean; retry: () => void; client: ReturnType<typeof useQueryClient> }) {
  const [filter, setFilter] = useState('all'); const [search, setSearch] = useState('');
  const update = useUpdateOrder();
  const filtered = useMemo(() => orders.filter((order) => (filter === 'all' || order.status === filter) && `${order.customerName} ${order.outletName} ${order.tableNumber} ${order.id}`.toLowerCase().includes(search.toLowerCase())), [orders, filter, search]);
  const countFor = (status: string) => status === 'all' ? orders.length : orders.filter((order) => order.status === status).length;
  function setStatus(order: Order, status: string) { update.mutate({ orderId: order.id, data: { status: status as 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled' } }, { onSuccess: () => invalidate(client, paths.orders, paths.dashboard, paths.analytics) }); }

  return <><PageTitle eyebrow="Service / live orders" title="Keep service in motion." description="Review incoming orders, update the kitchen, and keep guests in the loop." action={<div className="flex items-center gap-2 rounded-[11px] bg-[#e5f0e9] px-3 py-2 text-[10px] font-semibold text-[#327963]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#40a181]" /> Live order feed</div>} />
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1 overflow-x-auto rounded-[12px] bg-[#eae9e2] p-1">{['all', ...orderStatuses].map((status) => <button key={status} onClick={() => setFilter(status)} data-testid={`button-order-filter-${status}`} className={`whitespace-nowrap rounded-[9px] px-3 py-2 text-[10px] font-semibold capitalize transition-colors ${filter === status ? 'bg-[#fcfbf7] text-[#2e4558] shadow-sm' : 'text-[#78868c] hover:text-[#34485a]'}`}>{status === 'all' ? 'All' : status}<span className="ml-1.5 font-mono text-[9px] text-[#9ba3a3]">{countFor(status)}</span></button>)}</div><div className="relative w-full max-w-[270px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a1a3]" /><input className="field !py-[9px] !pl-9 text-[11px]" aria-label="Search orders" data-testid="input-search-orders" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search guest or table" /></div></div>
    <QueryState loading={loading} error={error} retry={retry}>{filtered.length ? <div className="space-y-3">{filtered.map((order) => <article key={order.id} className="surface p-4 sm:p-5" data-testid={`card-order-${order.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f0efe8] font-mono text-[10px] font-bold text-[#62717d]">T{order.tableNumber}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[13px] font-bold text-[#34495a]">{order.customerName || 'Guest'}</h2><Status value={order.status} /><span className="font-mono text-[9px] text-[#9aa3a4]">#{order.id.slice(0, 7)}</span></div><p className="mt-1 text-[10px] text-[#849198]">{order.outletName} · {dateTime(order.createdAt)}{order.customerPhone && ` · ${order.customerPhone}`}</p></div></div>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="font-display text-[17px] font-bold tracking-[-.03em] text-[#35495a] mr-1">{money(order.total)}</span>

        {/* 1-Click Fast Workflow Action Buttons */}
        {order.status === 'new' && (
          <button
            type="button"
            onClick={() => setStatus(order, 'preparing')}
            disabled={update.isPending}
            className="rounded-lg bg-[#16806e] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-[#126b5c] transition-all cursor-pointer"
          >
            Start Preparing →
          </button>
        )}
        {order.status === 'preparing' && (
          <button
            type="button"
            onClick={() => setStatus(order, 'ready')}
            disabled={update.isPending}
            className="rounded-lg bg-[#e2f1e9] px-3 py-1.5 text-[11px] font-bold text-[#28745f] hover:bg-[#cee7d7] transition-all cursor-pointer"
          >
            Mark Ready for Table →
          </button>
        )}
        {order.status === 'ready' && (
          <button
            type="button"
            onClick={() => setStatus(order, 'completed')}
            disabled={update.isPending}
            className="rounded-lg bg-[#203147] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#2d4457] transition-all cursor-pointer"
          >
            Complete Order ✓
          </button>
        )}

        {/* Full Status Dropdown for override */}
        <AppSelect
          value={order.status}
          onChange={(val) => setStatus(order, val)}
          disabled={update.isPending}
          className="!w-auto !min-w-[135px]"
          testId={`select-order-status-${order.id}`}
          options={orderStatuses.map((status) => ({
            value: status,
            label: status.charAt(0).toUpperCase() + status.slice(1),
          }))}
        />
      </div>
    </div><div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#efede6] pt-3">{order.items.map((line, i) => <span key={`${line.itemId}-${i}`} className="text-[10px] text-[#65747e]"><b className="mr-1.5 text-[#374b5e]">{line.quantity}×</b>{line.name}{line.selectedVariant && <small className="text-[#8d989b]"> · {line.selectedVariant}</small>}{line.selectedAddOns?.length > 0 && <small className="text-[#8d989b]"> · {line.selectedAddOns.join(', ')}</small>}</span>)}</div></article>)}</div> : <EmptyState title={search ? 'No orders match that search' : 'Nothing on the board just yet'} description={search ? 'Try another guest name, table or outlet.' : 'New guest orders will appear here as soon as they come in.'} />}</QueryState>
  </>;
}

function AnalyticsPage({ user, analytics, loading, error, retry }: { user: CurrentUser; analytics: Analytics | undefined; loading: boolean; error: boolean; retry: () => void }) {
  const isSuperAdmin = user.role === 'super_admin';
  return <><PageTitle eyebrow={isSuperAdmin ? 'Platform / Revenue' : 'Reports / Performance'} title={isSuperAdmin ? 'Platform-wide Analytics' : 'See what guests love.'} description={isSuperAdmin ? 'A clear read on platform gross merchandise volume, transaction volume, and overall venue adoption.' : 'A clear read on revenue, repeat favorites and the shape of your dining service.'} action={<button className="btn-secondary" onClick={() => window.print()} data-testid="button-export-analytics"><Download size={15} /> Export view</button>} />
    <QueryState loading={loading} error={error} retry={retry}><>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={isSuperAdmin ? 'Platform GMV' : 'Revenue'} value={money(analytics?.revenue ?? 0)} note={isSuperAdmin ? 'Total captured across all venues' : 'Revenue in this period'} icon={BarChart3} accent />
        <StatCard label={isSuperAdmin ? 'Total Orders' : 'Orders'} value={(analytics?.orderCount ?? 0).toLocaleString()} note={isSuperAdmin ? 'Orders placed on Tablewave' : 'Guest orders received'} icon={Package} />
        <StatCard label="Average Order" value={money(analytics?.averageOrder ?? 0)} note="Average ticket per table" icon={ArrowUpRight} />
        <StatCard label="Completed" value={String(analytics?.completedCount ?? 0)} note="Successfully fulfilled orders" icon={Check} />
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_.8fr]"><section className="surface p-5 sm:p-6"><div className="flex items-start justify-between"><div><h2 className="font-display text-[15px] font-bold">Order volume</h2><p className="mt-1 text-[10px] text-[#89949a]">{isSuperAdmin ? 'Platform order and revenue flow by day' : 'Revenue and order flow by day'}</p></div><div className="flex gap-3 text-[9px] text-[#79878d]"><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-[#16806e]" /> Orders</span><span className="flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-[#e3a274]" /> Revenue</span></div></div><TrendChart data={analytics?.trend || []} /></section>
        <section className="surface p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-[15px] font-bold">{isSuperAdmin ? 'Top dishes across platform' : 'Guest favorites'}</h2><p className="mt-1 text-[10px] text-[#89949a]">{isSuperAdmin ? 'Highest volume items across all client venues' : 'Top items by quantity ordered'}</p></div><Package size={16} className="text-[#89a69b]" /></div>{analytics?.topItems?.length ? <div className="mt-5 space-y-4">{analytics.topItems.map((item: TopItem, index: number) => { const max = analytics.topItems[0]?.quantity || 1; return <div key={`${item.name}-${index}`} data-testid={`analytics-top-item-${index}`}><div className="mb-1.5 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="font-mono text-[9px] text-[#9ba4a3]">0{index + 1}</span><span className="truncate text-[11px] font-semibold text-[#435767]">{item.name}</span></div><span className="shrink-0 font-mono text-[9px] text-[#7f8d92]">{item.quantity} · {money(item.revenue)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#f0efe9]"><div className="h-full rounded-full bg-[#67a893]" style={{ width: `${item.quantity / max * 100}%` }} /></div></div>; })}</div> : <div className="py-10 text-center text-[11px] text-[#8b9699]">{isSuperAdmin ? 'Platform dish data will appear here.' : 'Your guest favorites will appear here.'}</div>}</section>
      </div>
    </></QueryState>
  </>;
}

export const ROLE_ALLOWED_ROUTES: Record<string, string[]> = {
  super_admin: ['dashboard', 'businesses', 'plans', 'analytics'],
  business_admin: ['dashboard', 'orders', 'menu', 'outlets', 'team', 'analytics'],
  staff: ['dashboard', 'orders', 'menu', 'outlets'],
  pending: ['dashboard'],
};

export const ROLE_DEFAULT_ROUTE: Record<string, string> = {
  super_admin: '/dashboard',
  business_admin: '/dashboard',
  staff: '/orders',
  pending: '/dashboard',
};

export function Workspace() {
  const { isLoaded, isSignedIn, user: authUser } = useTablewaveAuth();
  const [location] = useLocation();
  const client = useQueryClient();
  const route = location.split('/')[1] || 'dashboard';
  const enabled = Boolean(isSignedIn);
  const current = useGetCurrentUser({ query: { enabled, queryKey: getGetCurrentUserQueryKey() } });
  
  // Resilient resolution: prioritize valid current user data from API if it has valid fields,
  // otherwise fallback to auth context user (demo / local session)
  const isApiUserData = current.data && typeof current.data === 'object' && 'role' in current.data;
  const user = (isApiUserData ? current.data : authUser) as CurrentUser | null;
  const userRole = user?.role;
  const isRoutePermitted = userRole ? (ROLE_ALLOWED_ROUTES[userRole] || []).includes(route) : false;

  const dashboard = useGetDashboard({
    query: {
      enabled: enabled && Boolean(userRole) && isRoutePermitted && route === 'dashboard',
      queryKey: getGetDashboardQueryKey(),
    },
  });
  const businesses = useListBusinesses({
    query: {
      enabled: enabled && Boolean(userRole) && (
        (userRole === 'super_admin' && isRoutePermitted && ['businesses', 'dashboard'].includes(route)) ||
        (userRole !== 'staff' && ['outlets', 'menu', 'dashboard'].includes(route))
      ),
      queryKey: getListBusinessesQueryKey(),
    },
  });
  const team = useListTeam({
    query: {
      enabled: enabled && userRole === 'business_admin' && isRoutePermitted && route === 'team',
      queryKey: getListTeamQueryKey(),
    },
  });
  const plans = useListPlans({
    query: {
      enabled: enabled && userRole === 'super_admin' && isRoutePermitted && ['plans', 'businesses', 'dashboard'].includes(route),
      queryKey: getListPlansQueryKey(),
    },
  });
  const outlets = useListOutlets({
    query: {
      enabled: enabled && ['business_admin', 'staff'].includes(userRole || '') && isRoutePermitted && route === 'outlets',
      queryKey: getListOutletsQueryKey(),
    },
  });
  const categories = useListCategories({
    query: {
      enabled: enabled && ['business_admin', 'staff'].includes(userRole || '') && isRoutePermitted && route === 'menu',
      queryKey: getListCategoriesQueryKey(),
    },
  });
  const items = useListItems({
    query: {
      enabled: enabled && ['business_admin', 'staff'].includes(userRole || '') && isRoutePermitted && route === 'menu',
      queryKey: getListItemsQueryKey(),
    },
  });
  const orders = useListOrders({
    query: {
      enabled: enabled && ['business_admin', 'staff'].includes(userRole || '') && isRoutePermitted && ['orders', 'dashboard'].includes(route),
      queryKey: getListOrdersQueryKey(),
    },
  });
  const analytics = useGetAnalytics({
    query: {
      enabled: enabled && ['super_admin', 'business_admin'].includes(userRole || '') && isRoutePermitted && route === 'analytics',
      queryKey: getGetAnalyticsQueryKey(),
    },
  });
  const createBusiness = useCreateBusiness();
  const updateBusiness = useUpdateBusiness();
  const invite = useInviteTeamMember();
  const createPlan = useCreatePlan();

  if (!isLoaded) return <div className="min-h-[100dvh] bg-[#f5f3ed] p-6"><div className="skeleton mx-auto h-12 max-w-4xl" /><div className="skeleton mx-auto mt-8 h-72 max-w-4xl" /></div>;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  if ((current.isLoading && !user) || !user) return <div className="min-h-[100dvh] bg-[#f5f3ed] p-6"><div className="skeleton mx-auto h-12 max-w-4xl" /><div className="skeleton mx-auto mt-8 h-72 max-w-4xl" /></div>;
  if (current.isError && !user) return <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center px-6 text-center"><div className="font-display text-2xl font-bold">Workspace access is unavailable</div><p className="mt-2 text-sm text-[#77858d]">We couldn’t resolve your Tablewave account. Please try again.</p><Button onClick={() => void current.refetch()} className="mt-5">Try again</Button></div>;
  if (user.status !== 'active') return <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col items-center justify-center px-6 text-center"><div className="font-display text-2xl font-bold">Your account is being set up</div><p className="mt-2 text-sm text-[#77858d]">An administrator will finish granting access shortly.</p></div>;

  if (!isRoutePermitted) {
    const fallback = ROLE_DEFAULT_ROUTE[user.role] || '/dashboard';
    return <Redirect to={fallback} />;
  }
  const businessId = user.businessId || businesses.data?.[0]?.id || '';
  const loadPage = {
    dashboard: { loading: dashboard.isLoading, error: dashboard.isError, retry: () => void dashboard.refetch() },
    businesses: { loading: businesses.isLoading || plans.isLoading, error: businesses.isError || plans.isError, retry: () => { void businesses.refetch(); void plans.refetch(); } },
    team: { loading: team.isLoading, error: team.isError, retry: () => void team.refetch() },
    plans: { loading: plans.isLoading, error: plans.isError, retry: () => void plans.refetch() },
    outlets: { loading: outlets.isLoading || businesses.isLoading, error: outlets.isError || businesses.isError, retry: () => { void outlets.refetch(); void businesses.refetch(); } },
    menu: { loading: categories.isLoading || items.isLoading, error: categories.isError || items.isError, retry: () => { void categories.refetch(); void items.refetch(); } },
    orders: { loading: orders.isLoading, error: orders.isError, retry: () => void orders.refetch() },
    analytics: { loading: analytics.isLoading, error: analytics.isError, retry: () => void analytics.refetch() },
  }[route] || { loading: dashboard.isLoading, error: dashboard.isError, retry: () => void dashboard.refetch() };

  return <WorkspaceShell user={user}>
    {route === 'dashboard' && <Overview user={user} dashboard={dashboard.data} loading={loadPage.loading} error={loadPage.error} retry={loadPage.retry} orders={orders.data || []} businesses={businesses.data || []} plans={plans.data || []} />}
    {route === 'businesses' && <BusinessesPage businesses={businesses.data || []} plans={plans.data || []} loading={loadPage.loading} error={loadPage.error} retry={loadPage.retry} create={createBusiness} update={updateBusiness} createPending={createBusiness.isPending} updatePending={updateBusiness.isPending} client={client} />}
    {route === 'team' && <TeamPage members={team.data || []} loading={loadPage.loading} error={loadPage.error} retry={loadPage.retry} invite={invite} pending={invite.isPending} user={user} client={client} />}
    {route === 'plans' && <PlansPage plans={plans.data || []} loading={loadPage.loading} error={loadPage.error} retry={loadPage.retry} create={createPlan} pending={createPlan.isPending} client={client} />}
    {route === 'menu' && <MenuPage businessId={businessId} categories={categories.data || []} items={items.data || []} loading={loadPage.loading} error={loadPage.error} retry={loadPage.retry} client={client} />}
    {route === 'outlets' && <OutletsPage businessId={businessId} businesses={businesses.data || []} outlets={outlets.data || []} loading={loadPage.loading} error={loadPage.error} retry={loadPage.retry} client={client} />}
    {route === 'orders' && <OrdersPage orders={orders.data || []} loading={loadPage.loading} error={loadPage.error} retry={loadPage.retry} client={client} />}
    {route === 'analytics' && <AnalyticsPage user={user} analytics={analytics.data} loading={loadPage.loading} error={loadPage.error} retry={loadPage.retry} />}
  </WorkspaceShell>;
}