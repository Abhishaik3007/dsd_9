import { Link } from 'wouter';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, ChevronRight, CircleDot,
  ClipboardCheck, Coffee, Film, Hotel, Menu, MoveUpRight, QrCode, Radio,
  Sparkles, TabletSmartphone, TrendingUp, Utensils, Zap,
} from 'lucide-react';
import { useHealthCheck } from '@workspace/api-client-react';
import { BrandMark } from '@/components/shared';

const audiences = [
  { icon: Coffee, name: 'Restaurants', text: 'Turn every table into a faster, friendlier service moment.' },
  { icon: Hotel, name: 'Hotels', text: 'Let guests order from the lobby, their room, or by the pool.' },
  { icon: Film, name: 'Cinemas & theatres', text: 'Get interval orders in before the lights go down.' },
];

export function LandingPage() {
  const health = useHealthCheck();
  return (
    <div className="grain overflow-hidden bg-[#f7f6f0] text-[#25364a]">
      <header className="relative z-10 mx-auto flex h-[76px] max-w-[1320px] items-center justify-between px-5 sm:px-9">
        <Link href="/" className="no-underline"><BrandMark /></Link>
        <nav className="hidden items-center gap-8 text-[12px] font-semibold text-[#687785] md:flex">
          <a href="#platform" className="transition-colors hover:text-[#16806e]">Platform</a><a href="#how" className="transition-colors hover:text-[#16806e]">How it works</a><a href="#fit" className="transition-colors hover:text-[#16806e]">Who it’s for</a>
        </nav>
        <div className="flex items-center gap-2.5">
          <Link href="/sign-in" className="hidden px-3 py-2 text-[12px] font-semibold text-[#546575] hover:text-[#16806e] sm:inline-flex">Sign in</Link>
          <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-[11px] bg-[#203147] px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#16806e]">Get started <ArrowRight size={14} /></Link>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-[1320px] items-center gap-12 px-5 pb-20 pt-12 sm:px-9 sm:pb-28 sm:pt-20 lg:grid-cols-[1fr_.95fr] lg:gap-8">
          <div className="relative z-10 page-enter">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#d9e5dc] bg-[#edf5ef] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-[#367767]">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#48a68a] opacity-35" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#16806e]" /></span>
              {health.isLoading ? 'Connecting to Tablewave' : health.isError ? 'QR ordering, made simple' : 'A calmer way to take orders'}
            </div>
            <h1 className="font-display max-w-[740px] text-[52px] font-extrabold leading-[.99] tracking-[-.075em] text-[#203147] sm:text-[70px] lg:text-[82px]">Good service.<br /><span className="relative inline-block text-[#16806e]">Without the wait.</span></h1>
            <p className="mt-7 max-w-[500px] text-[16px] leading-[1.75] text-[#71808d] sm:text-[17px]">The QR ordering platform that gives guests the freedom to order, and gives your team room to make it memorable.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="inline-flex items-center gap-2.5 rounded-[12px] bg-[#16806e] px-5 py-3.5 text-[13px] font-bold text-white shadow-[0_8px_20px_rgba(22,128,110,.18)] transition-all hover:-translate-y-0.5 hover:bg-[#126c5d]">Start your workspace <ArrowRight size={16} /></Link>
              <a href="#how" className="inline-flex items-center gap-2 rounded-[12px] px-4 py-3.5 text-[13px] font-semibold text-[#526373] hover:bg-[#eeede7]">See how it works <ArrowDownRight size={15} /></a>
            </div>
            <div className="mt-9 flex items-center gap-3 text-[11px] text-[#87929a]"><span className="flex -space-x-2"><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f6f0] bg-[#dce6db] font-bold text-[#547061]">M</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f6f0] bg-[#ead9c9] font-bold text-[#8b694f]">L</span><span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#f7f6f0] bg-[#d5e2e8] font-bold text-[#547385]">A</span></span><span>Made for the people who make a place.</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[590px] page-enter stagger-2">
            <div className="absolute -right-8 -top-6 h-48 w-48 rounded-full bg-[#e4efe6] blur-3xl" />
            <div className="absolute -bottom-8 -left-10 h-48 w-48 rounded-full bg-[#f2dfc9]/80 blur-3xl" />
            <div className="relative overflow-hidden rounded-[27px] border border-[#d8ddd4] bg-[#e9eee7] p-3 shadow-[0_28px_80px_rgba(41,59,72,.15)] sm:p-4">
              <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(#aab9ad 0.65px, transparent 0.65px)', backgroundSize: '16px 16px' }} />
              <div className="relative grid grid-cols-[1fr_210px] gap-3 sm:grid-cols-[1fr_240px]">
                <div className="flex min-h-[350px] flex-col justify-between rounded-[20px] bg-[#203147] p-5 text-white sm:min-h-[405px] sm:p-7">
                  <div><div className="flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#a6c4b8]">Tablewave / live</span><span className="flex items-center gap-1.5 text-[9px] text-[#94adac]"><CircleDot size={9} className="text-[#52c9a6]" /> ACTIVE</span></div>
                    <div className="mt-10"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#90a3b2]">Tonight, all locations</p><p className="mt-2 font-display text-[39px] font-bold tracking-[-.06em]">₹4,286<span className="ml-2 align-middle font-sans text-[12px] font-semibold tracking-normal text-[#8ca2ac]">+12.8%</span></p></div>
                    <div className="mt-7 flex h-[116px] items-end gap-2 border-b border-white/10 pb-2">{[27,40,34,56,47,62,51,79,68,92,77,100,81,90,73,96,82,107].map((height, i) => <span key={i} className={`flex-1 rounded-t-[3px] ${i > 14 ? 'bg-[#58c4a8]' : 'bg-[#507074]'}`} style={{ height }} />)}</div>
                    <div className="mt-2 flex justify-between font-mono text-[8px] text-[#8295a4]"><span>12 PM</span><span>4 PM</span><span>8 PM</span><span>NOW</span></div>
                  </div>
                  <div className="mt-7 grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl border border-white/10 bg-white/[.05] p-3"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#96a7b0]">Orders today</p><p className="mt-1 text-[20px] font-bold">183</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/[.05] p-3"><p className="font-mono text-[8px] uppercase tracking-[.1em] text-[#96a7b0]">Avg. order</p><p className="mt-1 text-[20px] font-bold">₹23.42</p></div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex-1 rounded-[20px] bg-[#fdfcf8] p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between"><span className="font-mono text-[8px] uppercase tracking-[.14em] text-[#88959c]">New order</span><span className="rounded-full bg-[#fff0e3] px-2 py-1 font-mono text-[8px] text-[#b96d3c]">JUST IN</span></div>
                    <div className="mt-6 grid h-[93px] place-items-center rounded-[17px] bg-[#f2efe6]">
                      <div className="grid grid-cols-5 gap-[3px]">{['b','b','a','b','b','b','a','b','a','b','a','b','b','a','a','b','a','b','b','a','b','b','a','b','b'].map((cell, i) => <span key={i} className={`h-[9px] w-[9px] rounded-[2px] ${cell === 'b' ? 'bg-[#293d4f]' : 'bg-[#d5d4ca]'}`} />)}</div>
                    </div>
                    <div className="mt-4"><p className="text-[13px] font-bold text-[#26384b]">Table 12 · Garden Room</p><p className="mt-1 text-[10px] text-[#7d8990]">2 items · ₹31.50</p></div>
                    <div className="mt-4 flex items-center gap-2 border-t border-[#ebe8df] pt-3"><span className="h-2 w-2 rounded-full bg-[#e5a16e]" /><span className="text-[10px] font-semibold text-[#60717d]">Preparing now</span><ChevronRight size={13} className="ml-auto text-[#a0a8a8]" /></div>
                  </div>
                  <div className="rounded-[20px] border border-[#dce2d8] bg-[#fdfcf8]/90 p-4">
                    <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e2efe8] text-[#16806e]"><QrCode size={18} /></span><div><p className="text-[11px] font-bold text-[#2b4052]">Table 12 is ready</p><p className="mt-0.5 text-[9px] text-[#8a9498]">Scan. Order. Enjoy.</p></div><Check size={15} className="ml-auto text-[#16806e]" /></div>
                  </div>
                </div>
              </div>
              <div className="relative mt-3 flex items-center justify-between px-2 py-1 text-[9px] text-[#63746f]"><span className="inline-flex items-center gap-1.5"><Radio size={11} className="text-[#16806e]" /> Connected across 4 locations</span><span className="font-mono">TABLEWAVE / 01</span></div>
            </div>
            <div className="absolute -right-4 top-[34%] hidden items-center gap-2 rounded-xl border border-[#e5e1d7] bg-[#fcfbf7] px-3 py-2.5 shadow-[0_12px_30px_rgba(27,47,64,.12)] sm:flex"><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e4f1ed] text-[#16806e]"><ClipboardCheck size={14} /></span><span className="text-[10px] font-semibold text-[#3b4e5e]">Order sent to kitchen</span></div>
          </div>
        </section>

        <section className="border-y border-[#e5e3da] bg-[#eeeee7]">
          <div className="mx-auto grid max-w-[1320px] items-center gap-5 px-5 py-6 sm:grid-cols-[1fr_auto] sm:px-9">
            <p className="text-[11px] font-semibold uppercase tracking-[.13em] text-[#818d92]">One thoughtful platform, wherever guests gather</p>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-[12px] font-semibold text-[#475c68]"><span className="inline-flex items-center gap-2"><Coffee size={14} /> Restaurant</span><span className="inline-flex items-center gap-2"><Hotel size={14} /> Hospitality</span><span className="inline-flex items-center gap-2"><Film size={14} /> Cinema & stage</span></div>
          </div>
        </section>

        <section id="platform" className="mx-auto max-w-[1320px] px-5 py-20 sm:px-9 sm:py-28">
          <div className="grid gap-8 md:grid-cols-[.82fr_1.18fr] md:gap-20">
            <div><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[#16806e]">A better rhythm</p><h2 className="font-display text-[39px] font-bold leading-[1.05] tracking-[-.06em] sm:text-[52px]">Less time waiting.<br />More time here.</h2></div>
            <div className="pt-1"><p className="max-w-[640px] text-[15px] leading-7 text-[#75828b]">Tablewave removes the little frictions that add up: finding a menu, catching someone’s eye, waiting to pay. Guests stay in their moment. Your team stays in control.</p><div className="mt-7 flex items-center gap-3 text-[11px] font-semibold text-[#4d6f67]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#e0eee7]"><MoveUpRight size={15} /></span> Keep hospitality personal. Let ordering be effortless.</div></div>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              { n: '01', icon: TabletSmartphone, title: 'A menu that moves', text: 'Update dishes, details and availability in a moment. The guest menu is always in sync.' },
              { n: '02', icon: Zap, title: 'Orders, right on time', text: 'Every order lands with the right table, outlet and details. No guesswork, no paper slips.' },
              { n: '03', icon: TrendingUp, title: 'The whole picture', text: 'See how every shift is going, what guests love and where your business is headed.' },
            ].map((feature) => <article key={feature.n} className="group relative overflow-hidden rounded-[19px] border border-[#e2e0d7] bg-[#fbfaf6] p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#e6f0eb] text-[#16806e]"><feature.icon size={19} /></span><span className="font-mono text-[10px] text-[#9aa29f]">{feature.n}</span></div><h3 className="mt-7 font-display text-[18px] font-bold tracking-[-.035em]">{feature.title}</h3><p className="mt-2 text-[13px] leading-6 text-[#7b878d]">{feature.text}</p><ArrowUpRight size={16} className="absolute bottom-7 right-7 text-[#99aaa2] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-[#16806e]" /></article>)}
          </div>
        </section>

        <section id="how" className="bg-[#203147] text-white">
          <div className="mx-auto max-w-[1320px] px-5 py-20 sm:px-9 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:gap-16 items-start">
              <div>
                <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-[#65c7aa]">
                  From scan to serve
                </p>
                <h2 className="font-display text-[40px] font-bold leading-[1.03] tracking-[-.06em] text-white sm:text-[50px]">
                  A few seconds<br />to a better shift.
                </h2>
                <p className="mt-5 max-w-[360px] text-[13px] leading-6 text-[#afbdc4]">
                  No app to install. No complicated setup for guests. Just a small code that makes the whole experience feel considered.
                </p>
                <Link
                  href="/sign-up"
                  className="mt-7 inline-flex items-center gap-2 text-[12px] font-bold text-[#69d0b0] transition-colors hover:text-white"
                >
                  Build your first menu <ArrowRight size={15} />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    n: '01',
                    tag: 'GUEST',
                    icon: QrCode,
                    title: 'Scan the code',
                    detail: 'A unique code brings the right menu to the right table.',
                    badge: 'Table 04 is ready',
                    badgeSub: 'Opens instantly in browser',
                    pill: 'No app needed',
                  },
                  {
                    n: '02',
                    tag: 'MOMENT',
                    icon: Menu,
                    title: 'Choose & send',
                    detail: 'Guests browse, customize and place an order from their phone.',
                    badge: 'Truffle Gnocchi',
                    badgeSub: '2 items · Table 04',
                    pill: 'Direct order',
                  },
                  {
                    n: '03',
                    tag: 'YOUR TEAM',
                    icon: Sparkles,
                    title: 'Make it happen',
                    detail: 'Your team sees every detail and keeps service moving.',
                    badge: 'Ticket #108',
                    badgeSub: 'Preparing now',
                    pill: 'Kitchen live',
                  },
                ].map((step) => (
                  <article
                    key={step.tag}
                    className="group relative flex flex-col justify-between rounded-[20px] border border-white/10 bg-white/[.04] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[.07] sm:p-6"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[9px] uppercase tracking-[.18em] text-[#79cdb5]">
                          {step.tag} / {step.n}
                        </span>
                        <span className="grid h-10 w-10 place-items-center rounded-[13px] border border-white/15 bg-white/[.06] text-[#7bd1b6] transition-transform duration-300 group-hover:scale-105">
                          <step.icon size={18} />
                        </span>
                      </div>

                      <h3 className="mt-6 font-display text-[17px] font-bold text-white">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-[12px] leading-5 text-[#afbdc4]">
                        {step.detail}
                      </p>
                    </div>

                    <div className="mt-6 rounded-[14px] border border-white/10 bg-white/[.05] p-3.5 transition-colors group-hover:bg-white/[.08]">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-white">{step.badge}</span>
                        <span className="rounded-full bg-[#16806e]/25 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#65c7aa]">
                          {step.pill}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#8ea0ab]">
                        {step.n === '03' && <span className="h-1.5 w-1.5 rounded-full bg-[#e5a16e]" />}
                        <span>{step.badgeSub}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="fit" className="mx-auto max-w-[1320px] px-5 py-20 sm:px-9 sm:py-28">
          <div className="flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[#16806e]">One platform, many places</p><h2 className="font-display text-[38px] font-bold tracking-[-.055em] sm:text-[48px]">Fits the way you serve.</h2></div><p className="max-w-[330px] text-[13px] leading-6 text-[#7b878d]">Each venue is different. Tablewave gives every guest a familiar, thoughtful way to order.</p></div>
          <div className="mt-10 grid gap-3 md:grid-cols-3">{audiences.map((item, i) => <article key={item.name} className={`rounded-[20px] border border-[#e1dfd6] p-6 sm:p-7 ${i === 1 ? 'bg-[#e7efe9]' : 'bg-[#fbfaf6]'}`}><div className="flex items-center justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-[#16806e]"><item.icon size={20} /></span><span className="font-mono text-[9px] text-[#97a09e]">0{i + 1}</span></div><h3 className="mt-9 font-display text-[19px] font-bold tracking-[-.035em]">{item.name}</h3><p className="mt-2 max-w-[270px] text-[13px] leading-6 text-[#77858b]">{item.text}</p><Link href="/sign-up" className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#16806e]">Explore Tablewave <ArrowRight size={13} /></Link></article>)}</div>
        </section>

        <section className="mx-auto max-w-[1320px] px-5 pb-20 sm:px-9 sm:pb-28">
          <div className="relative overflow-hidden rounded-[26px] bg-[#e7ede6] px-6 py-9 sm:px-12 sm:py-12 lg:px-16">
            <div className="absolute -right-14 -top-20 h-[280px] w-[280px] rounded-full border border-[#cdd9d0] sm:right-[12%]" /><div className="absolute -right-1 top-[-45px] h-[220px] w-[220px] rounded-full border border-[#cdd9d0] sm:right-[20%]" /><div className="absolute right-[18%] top-[54px] hidden h-[110px] w-[110px] rounded-full bg-[#f7f6f0] lg:block" />
            <div className="relative max-w-[660px]">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[.16em] text-[#16806e]">Your next service starts here</p>
              <h2 className="mt-4 font-display text-[36px] font-bold leading-[1.04] tracking-[-.06em] text-[#203147] sm:text-[48px]">Make ordering the easy part.</h2>
              <p className="mt-4 max-w-[450px] text-[13px] leading-6 text-[#74818a]">Start with your business, build your menu and bring your first table online. It’s your service, just with a little more room to breathe.</p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#e4e2d9] bg-[#f2f1eb]">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-6 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-9">
          <Link href="/" className="no-underline"><BrandMark /></Link><p className="text-[10px] text-[#8b959a]">Good service, carried by good systems.</p><div className="flex gap-5 text-[11px] font-semibold text-[#687782]"><Link href="/sign-in" className="hover:text-[#16806e]">Sign in</Link><Link href="/sign-up" className="hover:text-[#16806e]">Get started</Link></div>
        </div>
      </footer>
    </div>
  );
}