import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronUp,
  Clock3, Minus, Plus, QrCode, ShoppingBag, Utensils, X,
} from 'lucide-react';
import { getGetStoreMenuQueryKey, useGetStoreMenu, usePlaceStoreOrder, type MenuItem, type Order, type OrderLine } from '@workspace/api-client-react';
import { BrandMark, Button, Field, Modal, QueryState, SubmitButton, AppSelect } from '@/components/shared';

type CartEntry = OrderLine & { key: string };
type OrderReceipt = Pick<Order, 'id' | 'businessName' | 'outletName' | 'tableNumber' | 'total' | 'items' | 'createdAt'>;
const formatMoney = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);

function CartLineRow({ line, decrement, increment }: { line: CartEntry; decrement: () => void; increment: () => void }) {
  return <div className="flex items-start gap-3 border-b border-[#eeece5] py-3.5 last:border-b-0"><div className="min-w-0 flex-1"><p className="text-[12px] font-bold text-[#35485a]">{line.name}</p><p className="mt-1 text-[10px] text-[#849095]">{[line.selectedVariant, ...line.selectedAddOns].filter(Boolean).join(' · ') || 'Original'}</p><p className="mt-1.5 text-[11px] font-semibold text-[#4a5e6d]">{formatMoney(line.unitPrice * line.quantity)}</p></div><div className="flex items-center gap-2"><button onClick={decrement} aria-label={`Remove one ${line.name}`} className="grid h-7 w-7 place-items-center rounded-lg border border-[#e5e2da] text-[#687781] hover:bg-[#f2f1eb]"><Minus size={12} /></button><span className="w-4 text-center font-mono text-[10px]">{line.quantity}</span><button onClick={increment} aria-label={`Add one ${line.name}`} className="grid h-7 w-7 place-items-center rounded-lg border border-[#e5e2da] text-[#16806e] hover:bg-[#e7f1eb]"><Plus size={12} /></button></div></div>;
}

export function Storefront() {
  const { business = '', outlet = '', table = '' } = useParams<{ business: string; outlet: string; table: string }>();
  const [, setLocation] = useLocation();
  const menu = useGetStoreMenu(business, outlet, table, { query: { queryKey: getGetStoreMenuQueryKey(business, outlet, table) } });
  const placeOrder = usePlaceStoreOrder();
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState<CartEntry[]>([]);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const data = menu.data;
  const filtered = useMemo(() => !data ? [] : data.items.filter((item) => item.available && (category === 'all' || item.categoryId === category)), [data, category]);
  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(item: MenuItem, form?: HTMLFormElement) {
    const selection = form ? new FormData(form) : null;
    const variantName = String(selection?.get('variant') || item.variants[0]?.name || '');
    const variantPrice = item.variants.find((option) => option.name === variantName)?.price || 0;
    const addOns = item.addOns.filter((addOn) => selection?.getAll('addOn').includes(addOn.name));
    const unitPrice = item.price + variantPrice + addOns.reduce((sum, addOn) => sum + addOn.price, 0);
    const lineName = item.name;
    const key = `${item.id}-${variantName}-${addOns.map((addOn) => addOn.name).join('|')}`;
    setCart((previous) => {
      const existing = previous.find((entry) => entry.key === key);
      return existing ? previous.map((entry) => entry.key === key ? { ...entry, quantity: entry.quantity + 1 } : entry) : [...previous, { key, itemId: item.id, name: lineName, quantity: 1, unitPrice, selectedVariant: variantName, selectedAddOns: addOns.map((addOn) => addOn.name) }];
    });
    setSelected(null);
  }
  function alterQuantity(line: CartEntry, amount: number) {
    setCart((previous) => previous.map((entry) => entry.key === line.key ? { ...entry, quantity: entry.quantity + amount } : entry).filter((entry) => entry.quantity > 0));
  }
  function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setFormError('');
    const form = new FormData(event.currentTarget);
    const payload = {
      businessSlug: business, outletSlug: outlet, tableNumber: table,
      customerName: String(form.get('customerName') || '').trim(),
      customerPhone: String(form.get('customerPhone') || '').trim() || undefined,
      items: cart.map(({ key: _key, ...line }) => line),
    };
    placeOrder.mutate({ data: payload }, {
      onSuccess: (order) => {
        const receipt: OrderReceipt = { id: order.id, businessName: order.businessName, outletName: order.outletName, tableNumber: order.tableNumber, total: order.total, items: order.items, createdAt: order.createdAt };
        sessionStorage.setItem('tablewave-last-order', JSON.stringify(receipt));
        setCart([]);
        setLocation('/order-confirmation');
      },
      onError: (err: any) => {
        console.error('[Store Order Placement Error]:', err);
        const msg = err?.data?.error || err?.message;
        setFormError(
          msg && typeof msg === 'string' && !msg.includes('fetch') && !msg.includes('JSON') && msg.length < 120
            ? msg
            : 'We couldn’t send your order just yet. Please check your connection and try again.'
        );
      },
    });
  }

  return <div className="grain min-h-[100dvh] bg-[#f8f7f2] text-[#293d4f]">
    <header className="sticky top-0 z-20 border-b border-[#e6e3db] bg-[#f8f7f2]/95 backdrop-blur"><div className="mx-auto flex h-[66px] max-w-[1100px] items-center justify-between px-4 sm:px-7">
      <BrandMark /><span className="inline-flex items-center gap-1.5 rounded-full border border-[#e1dfd6] bg-white/70 px-2.5 py-1.5 font-mono text-[9px] text-[#7d898f]"><QrCode size={12} /> TABLE {table}</span>
    </div></header>
    <QueryState loading={menu.isLoading} error={menu.isError} retry={() => void menu.refetch()}>{data && <>
      <div className="mx-auto max-w-[1100px] px-4 pb-28 pt-6 sm:px-7 sm:pt-9">
        <div className="relative overflow-hidden rounded-[23px] bg-[#203147] px-5 py-7 text-white sm:px-8 sm:py-9">
          <div className="absolute -right-10 -top-16 h-[220px] w-[220px] rounded-full border border-white/10" /><div className="absolute right-12 top-[-6px] h-[130px] w-[130px] rounded-full border border-white/10" />
          <p className="relative font-mono text-[9px] uppercase tracking-[.17em] text-[#8bd0b7]">A TABLEWAVE MENU</p>
          <h1 className="relative mt-3 font-display text-[31px] font-bold leading-tight tracking-[-.055em] sm:text-[39px]">{data.business.name}</h1>
          <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#b3c0c8]"><span>{data.outlet.name}</span><span className="h-1 w-1 rounded-full bg-[#79949d]" /><span>Table {data.tableNumber}</span><span className="h-1 w-1 rounded-full bg-[#79949d]" /><span className="inline-flex items-center gap-1"><Clock3 size={11} /> Order at your pace</span></div>
        </div>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{[{ id: 'all', name: 'All' }, ...data.categories.map((item) => ({ id: item.id, name: item.name }))].map((item) => <button key={item.id} onClick={() => setCategory(item.id)} data-testid={`button-store-category-${item.id}`} className={`whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-semibold transition-colors ${category === item.id ? 'border-[#16806e] bg-[#16806e] text-white' : 'border-[#e2dfd7] bg-[#fbfaf6] text-[#63727c] hover:border-[#a7cabb]'}`}>{item.name}</button>)}</div>
            {filtered.length ? <div className="space-y-3">{filtered.map((item) => <article key={item.id} className="surface flex items-center gap-3 p-3 sm:gap-4 sm:p-4" data-testid={`store-item-${item.id}`}>
              <div className="grid h-[76px] w-[76px] shrink-0 place-items-center overflow-hidden rounded-[15px] bg-[#e8eee7] sm:h-[88px] sm:w-[88px]">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" /> : <Utensils size={21} className="text-[#8ba697]" />}</div>
              <div className="min-w-0 flex-1"><p className="text-[13px] font-bold text-[#32485a]">{item.name}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#849096]">{item.description || item.categoryName}</p><p className="mt-2 font-mono text-[11px] font-semibold text-[#395165]">{formatMoney(item.price)}</p></div>
              <button onClick={() => item.variants.length || item.addOns.length ? setSelected(item) : addToCart(item)} aria-label={`Add ${item.name} to your order`} data-testid={`button-add-store-item-${item.id}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e3f0e9] text-[#16806e] transition-all hover:scale-105 hover:bg-[#16806e] hover:text-white">{item.variants.length || item.addOns.length ? <span className="text-[10px] font-bold">Add</span> : <Plus size={17} />}</button>
            </article>)}</div> : <div className="rounded-[18px] border border-dashed border-[#dcd9d0] bg-[#fbfaf6] px-6 py-12 text-center"><p className="font-display font-bold">Nothing on the menu in this section.</p><p className="mt-1 text-[11px] text-[#849095]">Try another category.</p></div>}
          </div>
          <aside className="hidden lg:block"><div className="surface sticky top-[88px] p-5"><div className="flex items-center justify-between"><h2 className="font-display text-[16px] font-bold">Your order</h2><span className="rounded-full bg-[#f0efe8] px-2 py-1 font-mono text-[9px] text-[#728089]">{totalQuantity} items</span></div>
            {cart.length ? <><div className="mt-3 max-h-[42vh] overflow-y-auto">{cart.map((line) => <CartLineRow key={line.key} line={line} decrement={() => alterQuantity(line, -1)} increment={() => alterQuantity(line, 1)} />)}</div><div className="mt-2 flex items-center justify-between border-t border-[#eae8df] pt-4"><span className="text-[11px] text-[#78868c]">Subtotal</span><span className="font-display text-[17px] font-bold">{formatMoney(total)}</span></div><Button onClick={() => setCheckoutOpen(true)} className="mt-4 w-full">Continue to checkout <ArrowRight size={15} /></Button></> : <div className="py-10 text-center"><span className="mx-auto grid h-11 w-11 place-items-center rounded-[14px] bg-[#f0efe8] text-[#88959a]"><ShoppingBag size={18} /></span><p className="mt-3 text-[11px] font-semibold text-[#667780]">Your order starts here</p><p className="mt-1 text-[10px] text-[#96a0a0]">Add something you love.</p></div>}
          </div></aside>
        </div>
      </div>
      {cart.length > 0 && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e5e2da] bg-[#fbfaf6]/95 p-3 backdrop-blur-lg lg:hidden"><button onClick={() => setCheckoutOpen(true)} data-testid="button-open-cart" className="mx-auto flex w-full max-w-[650px] items-center justify-between rounded-[13px] bg-[#16806e] px-4 py-3 text-white shadow-[0_8px_24px_rgba(22,128,110,.2)]"><span className="flex items-center gap-2 text-[12px] font-bold"><ShoppingBag size={16} /> View order <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[9px]">{totalQuantity}</span></span><span className="flex items-center gap-1.5 text-[12px] font-bold">{formatMoney(total)} <ArrowRight size={14} /></span></button></div>}
      {selected && <Modal title={selected.name} subtitle={selected.description} onClose={() => setSelected(null)}><form onSubmit={(event) => { event.preventDefault(); addToCart(selected, event.currentTarget); }} className="space-y-4">
        {selected.variants.length > 0 && <Field label="Choose a size"><AppSelect name="variant" defaultValue={selected.variants[0]?.name} options={selected.variants.map((variant) => ({ value: variant.name, label: variant.name + (variant.price ? ` · +${formatMoney(variant.price)}` : '') }))} /></Field>}
        {selected.addOns.length > 0 && <fieldset><legend className="mb-2 text-[12px] font-semibold text-[#53616e]">Add something extra</legend><div className="space-y-2">{selected.addOns.map((addOn) => <label key={addOn.name} className="flex items-center justify-between rounded-xl border border-[#e7e4dc] bg-white/60 px-3 py-2.5 text-[11px] text-[#556774]"><span className="flex items-center gap-2"><input type="checkbox" name="addOn" value={addOn.name} className="h-4 w-4 accent-[#16806e]" />{addOn.name}</span><span className="font-mono text-[10px]">+{formatMoney(addOn.price)}</span></label>)}</div></fieldset>}
        <div className="flex justify-end border-t border-[#ebe8df] pt-4"><Button type="submit">Add to order <Plus size={15} /></Button></div>
      </form></Modal>}
      {checkoutOpen && <Modal title="One last thing." subtitle={`Your order will be sent to ${data.outlet.name}, table ${data.tableNumber}.`} onClose={() => setCheckoutOpen(false)}><form onSubmit={submitOrder} className="space-y-4">
        <div className="max-h-[220px] overflow-y-auto rounded-[13px] bg-[#f5f4ee] px-3">{cart.map((line) => <CartLineRow key={line.key} line={line} decrement={() => alterQuantity(line, -1)} increment={() => alterQuantity(line, 1)} />)}</div>
        <Field label="Your name"><input className="field" name="customerName" autoComplete="name" required placeholder="How should we find you?" data-testid="input-customer-name" /></Field>
        <Field label="Phone number" hint="Optional, only if we need to find you"><input className="field" name="customerPhone" type="tel" autoComplete="tel" placeholder="(555) 015-0284" data-testid="input-customer-phone" /></Field>
        <div className="flex items-center justify-between border-t border-[#ebe8df] pt-3"><span className="text-[11px] text-[#74828a]">Order total</span><span className="font-display text-[19px] font-bold">{formatMoney(total)}</span></div>
        {formError && <p className="rounded-lg bg-[#fae9e6] px-3 py-2 text-[11px] text-[#a84e45]">{formError}</p>}
        <SubmitButton pending={placeOrder.isPending} className="w-full">Place order <ArrowRight size={15} /></SubmitButton>
        <p className="text-center text-[9px] leading-4 text-[#99a2a1]">No payment is taken here. Your team will take care of you.</p>
      </form></Modal>}
    </>}</QueryState>
    <footer className="mx-auto flex max-w-[1100px] items-center justify-between border-t border-[#e8e5dd] px-4 py-5 text-[9px] text-[#9aa3a1] sm:px-7"><span>Powered by Tablewave</span><span>Good service, in motion.</span></footer>
  </div>;
}

export function OrderConfirmation() {
  const [, setLocation] = useLocation();
  let order: OrderReceipt | null = null;
  try { const stored = sessionStorage.getItem('tablewave-last-order'); order = stored ? JSON.parse(stored) as OrderReceipt : null; } catch { order = null; }
  return <main className="grain flex min-h-[100dvh] flex-col bg-[#f7f6f0] px-4 text-[#26394d]"><header className="mx-auto flex h-[70px] w-full max-w-[1050px] items-center"><BrandMark /></header><section className="mx-auto my-auto w-full max-w-[490px] py-10">
    <div className="surface px-6 py-8 text-center sm:px-10 sm:py-10"><span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#e3f1e9] text-[#16806e]"><CheckCircle2 size={28} strokeWidth={1.7} /></span>
      <p className="mt-6 font-mono text-[9px] font-semibold uppercase tracking-[.16em] text-[#16806e]">Order received</p><h1 className="mt-2 font-display text-[30px] font-bold leading-tight tracking-[-.055em] sm:text-[35px]">You’re all set.</h1><p className="mx-auto mt-2 max-w-[330px] text-[12px] leading-5 text-[#7e8b91]">Your team has your order. Settle in and we’ll take it from here.</p>
      {order ? <div className="mt-7 rounded-[15px] bg-[#f4f3ed] p-4 text-left"><div className="flex items-center justify-between border-b border-[#e5e2da] pb-3"><span className="text-[10px] text-[#76858b]">{order.outletName} · Table {order.tableNumber}</span><span className="font-mono text-[9px] text-[#89959a]">#{order.id.slice(0, 8)}</span></div><div className="space-y-2 py-3">{order.items.map((item, index) => <div key={`${item.itemId}-${index}`} className="flex justify-between gap-3 text-[10px]"><span className="text-[#566a77]">{item.quantity}× {item.name}</span><span className="font-mono text-[#627580]">{formatMoney(item.quantity * item.unitPrice)}</span></div>)}</div><div className="flex justify-between border-t border-[#e5e2da] pt-3 text-[11px] font-bold"><span>Total</span><span>{formatMoney(order.total)}</span></div></div> : <div className="mt-7 rounded-[13px] bg-[#f4f3ed] px-4 py-3 text-[10px] text-[#79868b]">Thanks for choosing Tablewave.</div>}
      <Button onClick={() => { sessionStorage.removeItem('tablewave-last-order'); setLocation('/'); }} variant="secondary" className="mt-6 w-full"><ArrowLeft size={14} /> Back to the beginning</Button>
    </div><p className="mt-6 text-center font-mono text-[9px] tracking-[.08em] text-[#9aa3a1]">A LITTLE MORE ROOM TO ENJOY THE MOMENT.</p>
  </section></main>;
}