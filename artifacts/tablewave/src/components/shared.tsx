import { type ReactNode } from 'react';
import { AlertCircle, ArrowUpRight, LoaderCircle, Plus, X } from 'lucide-react';

export function BrandMark({ light = false, iconOnly = false }: { light?: boolean; iconOnly?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${light ? 'text-white' : 'text-[#223448]'}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#16806e] text-white shadow-sm">
        <svg viewBox="0 0 26 26" width="20" height="20" fill="none" aria-hidden="true">
          <path d="M4 6.5h6.2v6.2H4zM15.8 6.5H22v6.2h-6.2zM4 18.3h6.2v3.2H4z" fill="currentColor" />
          <path d="M15.8 18.3H22v3.2h-6.2zM13 4v5.2M13 16.8V22M4 14h5.2M16.8 14H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="13" cy="13" r="2.1" fill="#f2a265" />
        </svg>
      </span>
      {!iconOnly && <span className="font-display text-[17px] font-extrabold tracking-[-.055em]">tablewave</span>}
    </span>
  );
}

export function Button({
  children,
  onClick,
  type = 'button',
  disabled,
  variant = 'primary',
  className = '',
  testId,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  className?: string;
  testId?: string;
}) {
  const styles = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : variant === 'danger' ? 'inline-flex items-center justify-center gap-2 rounded-[11px] border border-red-200 px-3.5 py-2.5 font-semibold text-red-700 hover:bg-red-50' : 'inline-flex items-center justify-center gap-2 rounded-[10px] px-3 py-2 font-semibold text-[#667280] hover:bg-[#f0efe9] hover:text-[#233348]';
  return <button type={type} onClick={onClick} disabled={disabled} data-testid={testId} className={`${styles} ${className}`}>{children}</button>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[#16806e]">{eyebrow}</p>}
        <h1 className="font-display text-[30px] font-bold leading-tight tracking-[-.045em] text-[#223448] sm:text-[34px]" data-testid={`heading-${title.toLowerCase().replaceAll(' ', '-')}`}>{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#74808c]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Modal({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()} className="fixed inset-0 z-[80] flex items-end justify-center bg-[#152336]/45 p-0 backdrop-blur-[3px] sm:items-center sm:p-5">
      <section role="dialog" aria-modal="true" aria-label={title} className={`page-enter max-h-[92dvh] w-full overflow-y-auto no-scrollbar rounded-t-[22px] border border-[#e3e0d7] bg-[#fcfbf7] p-5 shadow-[0_25px_80px_rgba(22,38,55,.2)] sm:rounded-[22px] sm:p-7 ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-bold tracking-[-.035em] text-[#223448]">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-[#74808c]">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close dialog" data-testid="button-close-dialog" className="icon-button"><X size={18} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#d8d6cc] bg-[#fbfaf6] px-6 py-10 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#e4f1ed] text-[#16806e]"><ArrowUpRight size={21} /></div>
      <h3 className="font-display text-[16px] font-bold text-[#2a3c4f]">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-[#7c8790]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingRows({ count = 4 }: { count?: number }) {
  return <div className="space-y-3" aria-label="Loading content">{Array.from({ length: count }).map((_, i) => <div key={i} className="skeleton h-[62px] w-full" />)}</div>;
}

export function QueryState({ loading, error, retry, children }: { loading: boolean; error?: boolean; retry: () => void; children: ReactNode }) {
  if (loading) return <LoadingRows />;
  if (error) return <div className="surface flex flex-col items-center px-6 py-12 text-center"><AlertCircle size={22} className="mb-3 text-[#b94c40]" /><h3 className="font-display font-bold">We couldn’t load this view</h3><p className="mt-1 text-sm text-[#74808c]">Check your connection and try once more.</p><Button variant="secondary" onClick={retry} className="mt-4">Try again</Button></div>;
  return <>{children}</>;
}

export function SubmitButton({ children, pending, className = '' }: { children: ReactNode; pending: boolean; className?: string }) {
  return <Button type="submit" disabled={pending} className={className}>{pending ? <><LoaderCircle size={16} className="animate-spin" /> Saving…</> : children}</Button>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-[12px] font-semibold text-[#53616e]">{label}<div className="mt-1.5">{children}</div>{hint && <span className="mt-1 block text-[11px] font-normal text-[#89929a]">{hint}</span>}</label>;
}

export function AddLabel() { return <><Plus size={16} /> Add new</>; }

export { AppSelect, type SelectOption } from '@/components/ui/select';
export { AppDatePicker } from '@/components/ui/date-picker';